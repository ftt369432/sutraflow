import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import svgr from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';
import checker from 'vite-plugin-checker'; // Import the checker plugin
import { visualizer } from 'rollup-plugin-visualizer';
import { emailApp } from './src/server/emailBackend';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Server-side env (used by the Tavily proxy so the key never needs to reach the browser)
  return {
    base: './',
    plugins: [
      react(),
      svgr(),
      envCompatible({
        prefix: 'VITE_', // Ensure this matches your environment variable prefix if different from default REACT_APP_
        mountedPath: 'process.env', // Default is 'process.env'
      }),
      // Temporarily disable TypeScript checking to fix reload loop
      // ...(mode === 'development' ? [
      //   checker({
      //     typescript: true, // Enable TypeScript checking only in development
      //     eslint: {
      //       lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // Keep or adjust as needed for flat config
      //       useFlatConfig: true, // Add this line to use ESLint flat config
      //     },
      //   })
      // ] : []),
      visualizer(),
      {
        name: 'sovereign-backend-middleware',
        configureServer(server) {
          try {
            server.middlewares.use(emailApp);
            console.log('📧 [Vite] Sovereign Email & IMAP Backend mounted on /api/email');
          } catch (err) {
            console.error('⚠️ [Vite] Could not load emailBackend:', err);
          }
          // 🔎 READ-ONLY recursive file finder for the legal agent engine (never writes, never deletes)
          server.middlewares.use((req, res, next) => {
            if (!(req.url && req.url.startsWith('/api/fs/find'))) return next();
            try {
              const url = new URL(req.url, 'http://localhost:3000');
              const root = url.searchParams.get('root') || '';
              const tokens = (url.searchParams.get('q') || '').toLowerCase().split(/\s+/).filter(Boolean);
              const exts = (url.searchParams.get('ext') || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
              const anyMode = url.searchParams.get('any') === '1';
              const wantDirs = url.searchParams.get('dirs') === '1';
              const maxDepth = Math.min(parseInt(url.searchParams.get('depth') || '3', 10) || 3, 6);
              const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 500);
              res.setHeader('Content-Type', 'application/json');
              if (!root || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
                res.end(JSON.stringify({ success: false, error: 'Root not found', files: [] }));
                return;
              }
              const found: any[] = [];
              const walk = (dir: string, depth: number) => {
                if (found.length >= limit) return;
                let entries: fs.Dirent[] = [];
                try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_e) { return; }
                for (const entry of entries) {
                  if (found.length >= limit) return;
                  const full = path.join(dir, entry.name);
                  const lower = entry.name.toLowerCase();
                  const isDir = entry.isDirectory();
                  const nameOk = tokens.length === 0
                    ? true
                    : (anyMode ? tokens.some(t => lower.includes(t)) : tokens.every(t => lower.includes(t)));
                  const extOk = isDir || exts.length === 0 || exts.some(e => lower.endsWith(e));
                  if (nameOk && extOk && (isDir ? wantDirs : true)) {
                    let size = 0; let lastModified = '';
                    try { const st = fs.statSync(full); size = isDir ? 0 : st.size; lastModified = st.mtime.toISOString(); } catch (_e) {}
                    found.push({ name: entry.name, path: full, isDirectory: isDir, size, lastModified });
                  }
                  if (isDir && depth < maxDepth) walk(full, depth + 1);
                }
              };
              walk(root, 1);
              res.end(JSON.stringify({ success: true, files: found }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message, files: [] }));
            }
          });

          // 🌐 Tavily proxy: key injected server-side from .env.local (no CORS, no key in browser requests)
          server.middlewares.use((req, res, next) => {
            const u = req.url || '';
            const tavilyKey = env.TAVILY_API_KEY || env.VITE_TAVILY_API_KEY || '';
            if (u.startsWith('/api/tavily/status')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ configured: Boolean(tavilyKey) }));
              return;
            }
            const isSearch = u.startsWith('/api/tavily/search');
            const isExtract = u.startsWith('/api/tavily/extract');
            if (!(isSearch || isExtract) || req.method !== 'POST') return next();
            let raw = '';
            const preParsed = (req as any).body;
            const run = async () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const body = preParsed && typeof preParsed === 'object' ? preParsed : (raw ? JSON.parse(raw) : {});
                const key = tavilyKey || body.api_key || '';
                if (!key) {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Tavily API key not configured' }));
                  return;
                }
                const upstream = await fetch(`https://api.tavily.com/${isSearch ? 'search' : 'extract'}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                  body: JSON.stringify({ ...body, api_key: key })
                });
                res.statusCode = upstream.status;
                res.end(await upstream.text());
              } catch (err: any) {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: err.message }));
              }
            };
            if (preParsed || (req as any).readableEnded) { run(); return; }
            req.on('data', (c) => { raw += c; });
            req.on('end', run);
          });

          // 🔎 Backend Web Search Proxy (Node.js server-side fetch — zero CORS in browser)
          server.middlewares.use(async (req, res, next) => {
            const u = req.url || '';
            if (!u.startsWith('/api/web/search')) return next();
            try {
              const url = new URL(u, 'http://localhost:3000');
              const q = url.searchParams.get('q') || '';
              res.setHeader('Content-Type', 'application/json');
              if (!q) {
                res.end(JSON.stringify({ success: false, error: 'Query required' }));
                return;
              }
              const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
              });
              if (ddgRes.ok) {
                const data = await ddgRes.json();
                const abstract = data.AbstractText || data.Heading || '';
                const related = (data.RelatedTopics || []).slice(0, 5).map((t: any) => t.Text).filter(Boolean);
                res.end(JSON.stringify({ success: true, abstract, related }));
                return;
              }
              res.end(JSON.stringify({ success: false, error: `Upstream error ${ddgRes.status}` }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 📓 Notion probe middleware: tests integration token securely without browser CORS blocks
          server.middlewares.use((req, res, next) => {
            const u = req.url || '';
            if (!u.startsWith('/api/notion/probe') || req.method !== 'POST') return next();
            let raw = '';
            const preParsed = (req as any).body;
            const run = async () => {
              res.setHeader('Content-Type', 'application/json');
              const startTime = Date.now();
              try {
                const body = preParsed && typeof preParsed === 'object' ? preParsed : (raw ? JSON.parse(raw) : {});
                const key = body.apiKey || env.NOTION_API_KEY || env.VITE_NOTION_API_KEY || '';
                if (!key) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Notion API key / token required' }));
                  return;
                }
                const upstream = await fetch('https://api.notion.com/v1/users/me', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${key}`,
                    'Notion-Version': '2022-06-28'
                  }
                });
                const latencyMs = Date.now() - startTime;
                const data = await upstream.json();
                if (upstream.ok) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, user: data, latencyMs }));
                } else {
                  res.statusCode = upstream.status;
                  res.end(JSON.stringify({ success: false, error: data.message || `Notion error ${upstream.status}`, latencyMs }));
                }
              } catch (err: any) {
                res.statusCode = 502;
                res.end(JSON.stringify({ success: false, error: err.message, latencyMs: Date.now() - startTime }));
              }
            };
            if (preParsed || (req as any).readableEnded) { run(); return; }
            req.on('data', (c) => { raw += c; });
            req.on('end', run);
          });

          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/api/fs/list')) {
              try {
                const url = new URL(req.url, 'http://localhost:3000');
                let targetPath = url.searchParams.get('path') || '';
                if (!targetPath || targetPath === 'AI_GENERATED_DOCS') {
                  targetPath = path.resolve(__dirname, 'AI_GENERATED_DOCS');
                }
                // Handle Windows drive roots like E: or G: or E:\ or G:\
                if (/^[a-zA-Z]:$/.test(targetPath)) {
                  targetPath = `${targetPath}\\`;
                }

                if (!fs.existsSync(targetPath)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Path not found', files: [] }));
                  return;
                }

                const stat = fs.statSync(targetPath);
                if (!stat.isDirectory()) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Target is not a directory', files: [] }));
                  return;
                }

                const entries = fs.readdirSync(targetPath, { withFileTypes: true });
                const files = entries.map(entry => {
                  const fullPath = path.join(targetPath, entry.name);
                  let size = 0;
                  let lastModified = '';
                  try {
                    if (!entry.isDirectory()) {
                      const fStat = fs.statSync(fullPath);
                      size = fStat.size;
                      lastModified = fStat.mtime.toISOString();
                    }
                  } catch (_e) {}
                  return {
                    name: entry.name,
                    path: fullPath,
                    isDirectory: entry.isDirectory(),
                    size,
                    lastModified
                  };
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, files }));
                return;
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message, files: [] }));
                return;
              }
            }

            if (req.url && req.url.startsWith('/api/fs/read')) {
              try {
                const url = new URL(req.url, 'http://localhost:3000');
                const targetPath = url.searchParams.get('path') || '';
                if (!targetPath || !fs.existsSync(targetPath)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'File not found' }));
                  return;
                }

                const stat = fs.statSync(targetPath);
                if (stat.isDirectory()) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Target is a directory' }));
                  return;
                }

                const content = fs.readFileSync(targetPath, 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, content }));
                return;
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
                return;
              }
            }

            if (req.url && req.url.startsWith('/api/fs/mkdir') && req.method === 'POST') {
              let raw = '';
              const preParsed = (req as any).body;
              const run = () => {
                res.setHeader('Content-Type', 'application/json');
                try {
                  const body = preParsed && typeof preParsed === 'object' ? preParsed : (raw ? JSON.parse(raw) : {});
                  let targetPath = body.path || '';
                  if (!targetPath) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Path required' }));
                    return;
                  }
                  targetPath = path.resolve(targetPath);
                  fs.mkdirSync(targetPath, { recursive: true });
                  res.end(JSON.stringify({ success: true, path: targetPath }));
                } catch (err: any) {
                  console.error('[Vite FS API] /api/fs/mkdir failed:', err.message);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              };
              if (preParsed || (req as any).readableEnded) { run(); return; }
              req.on('data', (c) => { raw += c; });
              req.on('end', run);
              return;
            }

            if (req.url && req.url.startsWith('/api/fs/write') && req.method === 'POST') {
              let raw = '';
              const preParsed = (req as any).body;
              const run = () => {
                res.setHeader('Content-Type', 'application/json');
                try {
                  const body = preParsed && typeof preParsed === 'object' ? preParsed : (raw ? JSON.parse(raw) : {});
                  let targetPath = body.path || '';
                  const content = body.content !== undefined ? body.content : '';
                  if (!targetPath) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Path required' }));
                    return;
                  }
                  targetPath = path.resolve(targetPath);
                  const parentDir = path.dirname(targetPath);
                  if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                  }
                  fs.writeFileSync(targetPath, content, 'utf8');
                  res.end(JSON.stringify({ success: true, path: targetPath, size: Buffer.byteLength(content) }));
                } catch (err: any) {
                  console.error('[Vite FS API] /api/fs/write failed:', err.message);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              };
              if (preParsed || (req as any).readableEnded) { run(); return; }
              req.on('data', (c) => { raw += c; });
              req.on('end', run);
              return;
            }

            if (req.url && req.url.startsWith('/api/shell/exec') && req.method === 'POST') {
              let raw = '';
              const preParsed = (req as any).body;
              const run = async () => {
                res.setHeader('Content-Type', 'application/json');
                try {
                  const body = preParsed && typeof preParsed === 'object' ? preParsed : (raw ? JSON.parse(raw) : {});
                  const cmd = body.command || '';
                  const cwd = body.cwd || process.cwd();
                  if (!cmd) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Command required' }));
                    return;
                  }
                  const { exec } = await import('child_process');
                  exec(cmd, { cwd, timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                    if (err) {
                      res.end(JSON.stringify({ success: false, error: err.message, stdout, stderr, exitCode: err.code }));
                    } else {
                      res.end(JSON.stringify({ success: true, stdout, stderr, exitCode: 0 }));
                    }
                  });
                } catch (err: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              };
              if (preParsed || (req as any).readableEnded) { run(); return; }
              req.on('data', (c) => { raw += c; });
              req.on('end', run);
              return;
            }



            const host = (req.headers.host || '').toLowerCase();
            const isTrustworthy = host.startsWith('localhost') || 
                                  host.startsWith('127.0.0.1') || 
                                  Boolean((req.socket as any)?.encrypted) || 
                                  req.headers['x-forwarded-proto'] === 'https';

            // Cross-Origin-Opener-Policy is only accepted by browsers on trustworthy origins (localhost/HTTPS).
            if (isTrustworthy) {
              res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            }
            res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

            if (req.url && req.url.startsWith('/release/')) {
              // Remove query params if any
              const cleanUrl = req.url.split('?')[0];
              const filePath = path.join(__dirname, cleanUrl);
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`);
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        // Add an alias for webworker-threads to a dummy module
        'webworker-threads': path.resolve(__dirname, './src/lib/dummy-webworker-threads.js'),
        // Add an alias for the 'util' module
        'util': 'util/', // This ensures Vite picks up the browser-friendly version
        // Add Buffer polyfill
        'buffer': 'buffer/',
      },
    },
    optimizeDeps: {
      exclude: [
        'pdfjs-dist/build/pdf.worker.min.mjs',
        'pdfjs-dist/build/pdf.worker.min.js',
        'pdfjs-dist',
        '@/config/env'
      ],
      include: [
        'buffer'
      ]
    },
    worker: {
      format: 'es'
    },
    server: {
      port: 3000, // Change to 3000 to match CORS settings
      open: false, // Do not auto-open external browser (Electron handles desktop window)
      host: '0.0.0.0', // Allow external connections
      hmr: false, // Temporarily disable HMR to stop reload loops
      proxy: {
        '/api/ollama': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/ollama/, ''),
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ models: [], offline: true }));
              }
            });
          }
        },
        '/v1': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ models: [], offline: true }));
              }
            });
          }
        },
        '/api/tags': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ models: [], offline: true }));
              }
            });
          }
        },
        '/api/generate': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: '', offline: true }));
              }
            });
          }
        },
        '/api/chat': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: { role: 'assistant', content: '' }, offline: true }));
              }
            });
          }
        }
      }
    },
    build: {
      sourcemap: mode === 'development', // Only generate sourcemaps in development
      outDir: 'build',
      chunkSizeWarningLimit: 600, // Increase warning limit
      minify: 'terser', // Use terser for better compression
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Remove console logs in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        input: './index.html', // Specify the main entry point
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom'
            ],
            supabase: ['@supabase/supabase-js'],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast'
            ],
            ai: [
              '@google/generative-ai',
              'openai'
            ],
            utils: [
              'lodash.debounce',
              'zustand',
              'nanoid',
              'uuid'
            ]
          }
        }
      }
    },
    define: {
      // Vite does not polyfill process.env by default for client-side code.
      // envCompatible plugin handles this. If you still need specific global constants:
      // 'process.env.NODE_ENV': JSON.stringify(mode),
      // 'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
      // 'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      'process.versions': JSON.stringify(process.versions || {}),
      'global': 'window', // Add this line to define global as window
    },
  };
});
