/**
 * Utility to pop out documents/files into a new browser window
 */
export function popOutDocument(title: string, content: string, type?: string) {
  const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  const initialTheme = isDark ? 'dark' : 'light';

  // Configure new window size and features
  const width = 850;
  const height = 900;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  const newWindow = window.open(
    '',
    `_blank_${Math.random().toString(36).substring(2, 9)}`,
    `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no,scrollbars=yes,resizable=yes`
  );

  if (!newWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for this site to view documents in a new window.');
    return;
  }

  // Sanitize content slightly for script safety
  const safeContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const documentHtml = `
    <!DOCTYPE html>
    <html lang="en" class="${initialTheme}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'Courier New', 'monospace'],
              }
            }
          }
        }
      </script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', 'Inter', sans-serif;
          transition: background-color 0.2s, color 0.2s;
        }
        pre {
          font-family: 'Fira Code', 'Courier New', monospace;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 4px;
        }
      </style>
    </head>
    <body class="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col antialiased">
      <!-- Premium Sticky Header -->
      <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              ${type || 'Document'}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Detached View</span>
          </div>
          <h1 class="text-lg font-bold truncate mt-1 text-slate-900 dark:text-white" title="${title}">
            ${title}
          </h1>
        </div>

        <div class="flex items-center space-x-2 flex-shrink-0">
          <!-- Zoom Controls -->
          <div class="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 mr-2">
            <button id="zoom-out" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" title="Zoom Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <span id="zoom-text" class="text-xs px-2 min-w-[3rem] text-center font-medium">100%</span>
            <button id="zoom-in" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" title="Zoom In">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>

          <!-- Theme Toggle -->
          <button id="theme-toggle" class="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Toggle Dark/Light Mode">
            <svg id="sun-icon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <svg id="moon-icon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>

          <!-- Copy Button -->
          <button id="copy-btn" class="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1" title="Copy Content">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>

          <!-- Print Button -->
          <button id="print-btn" class="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Print Document">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
          </button>

          <!-- Close Window -->
          <button id="close-btn" class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors" title="Close Window">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </header>

      <!-- Main Viewer Area -->
      <main class="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10">
        <div id="content-container" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div id="document-text" class="whitespace-pre-wrap font-mono text-sm leading-relaxed tracking-wide text-slate-800 dark:text-slate-200 transition-all select-text">
${safeContent}
          </div>
        </div>
      </main>

      <!-- Footer Toast Notification -->
      <div id="toast" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none">
        Copied to clipboard!
      </div>

      <script>
        const docText = document.getElementById('document-text');
        const zoomText = document.getElementById('zoom-text');
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        const copyBtn = document.getElementById('copy-btn');
        const printBtn = document.getElementById('print-btn');
        const closeBtn = document.getElementById('close-btn');
        const toast = document.getElementById('toast');

        // Zoom Logic
        let zoomLevel = 100;
        document.getElementById('zoom-in').addEventListener('click', () => {
          if (zoomLevel < 200) {
            zoomLevel += 10;
            updateZoom();
          }
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
          if (zoomLevel > 60) {
            zoomLevel -= 10;
            updateZoom();
          }
        });

        function updateZoom() {
          zoomText.innerText = zoomLevel + '%';
          docText.style.fontSize = (zoomLevel / 100) * 0.875 + 'rem';
        }

        // Theme Toggle Logic
        function updateThemeIcons() {
          const isDark = document.documentElement.classList.contains('dark');
          if (isDark) {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
          } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
          }
        }

        themeToggle.addEventListener('click', () => {
          document.documentElement.classList.toggle('dark');
          updateThemeIcons();
        });

        // Copy Logic
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(docText.innerText);
            showToast();
          } catch (err) {
            console.error('Failed to copy: ', err);
          }
        });

        function showToast() {
          toast.classList.remove('opacity-0');
          toast.classList.add('opacity-100');
          setTimeout(() => {
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0');
          }, 2000);
        }

        // Print Logic
        printBtn.addEventListener('click', () => {
          window.print();
        });

        // Close Logic
        closeBtn.addEventListener('click', () => {
          window.close();
        });

        // Initialize state
        updateThemeIcons();
      </script>
    </body>
    </html>
  `;

  newWindow.document.write(documentHtml);
  newWindow.document.close();
}
