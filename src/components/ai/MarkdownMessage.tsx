import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Eye, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  streaming?: boolean;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const MarkdownMessage = React.memo(function MarkdownMessage({ content, isStreaming, streaming, isEditing, onSave, className }: MarkdownMessageProps) {
  const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});
  const [editContent, setEditContent] = useState(content);
  const [displayedContent, setDisplayedContent] = useState(streaming ? '' : content);
  
  // Streaming effect
  React.useEffect(() => {
    if (streaming) {
      let currentIndex = 0;
      const words = content.split(' ');
      setDisplayedContent('');
      
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          setDisplayedContent(prev => prev + (currentIndex === 0 ? '' : ' ') + words[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          // After streaming is complete, turn off streaming to clean up the UI
          setTimeout(() => {
            // This will be handled by the parent component
          }, 100);
        }
      }, 40); // Stream each word every 40ms (2x faster) for improved responsiveness
      
      return () => clearInterval(streamInterval);
    } else {
      setDisplayedContent(content);
    }
  }, [content, streaming]);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopiedCodes(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  const handleSaveEdit = () => {
    if (onSave) {
      onSave(editContent);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-4", className)}>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Edit your message..."
        />
        <div className="flex gap-2">
          <Button onClick={handleSaveEdit} size="sm">Save</Button>
          <Button onClick={() => setEditContent(content)} variant="outline" size="sm">Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-base md:text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-5 mb-2.5 flex items-center gap-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-200 mt-4 mb-2 flex items-center gap-1.5" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-3 mb-1" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300 font-normal" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-slate-900 dark:text-slate-100 tracking-tight" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-700 dark:text-slate-300" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-700 dark:text-slate-300" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-relaxed pl-1" {...props} />
            ),
            hr: ({ node, ...props }) => (
              <hr className="my-5 border-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <div className="my-3.5 pl-4 pr-3 py-2.5 rounded-r-xl border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm shadow-xs leading-relaxed not-italic">
                {props.children}
              </div>
            ),
            code: ({ node, inline, className, children, ...props }: CodeProps) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const codeIndex = node?.position?.start.offset || 0;
              const isInline = inline ?? (!match && !String(children).includes('\n'));
              
              if (isInline) {
                const text = String(children || '').trim();
                const isFilePath =
                  /^(?:AI_GENERATED_DOCS|[A-Za-z]:[/\\]|\.\/|\/).*(\.md|\.docx|\.pdf|\.tsx?|\.py|\.json)$/i.test(text) ||
                  text.startsWith('AI_GENERATED_DOCS/') ||
                  text.startsWith('AI_GENERATED_DOCS\\') ||
                  /\.(md|docx|pdf|tsx|ts|py)$/i.test(text);

                if (isFilePath) {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent('genieflow:open-artifact', {
                            detail: {
                              path: text,
                              title: text.split(/[\\/]/).pop() || text
                            }
                          })
                        );
                      }}
                      title={`Click to open ${text} in Viewport`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200/80 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:border-blue-400 transition-all font-mono text-[11px] font-semibold tracking-tight cursor-pointer group/chip"
                    >
                      <span>{children}</span>
                      <span className="text-[9px] text-blue-500 opacity-60 group-hover/chip:opacity-100">↗</span>
                    </button>
                  );
                }

                return (
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-blue-700 dark:text-cyan-300 border border-slate-200/70 dark:border-slate-700/60 font-mono text-[11px] font-semibold tracking-tight" {...props}>
                    {children}
                  </code>
                );
              }
              
              const rawCode = String(children || '').replace(/\n$/, '');
              const shouldHighlight = !!language && language !== 'text' && rawCode.length < 15000;

              return (
                <div className="relative group my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono border-b border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">{language.toUpperCase() || 'CODE / PREVIEW'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 opacity-80 hover:opacity-100"
                      onClick={() => handleCopyCode(rawCode, codeIndex)}
                    >
                      {copiedCodes[codeIndex] ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  {shouldHighlight ? (
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0 0 0.375rem 0.375rem',
                        fontSize: '0.875rem',
                        overflowX: 'auto',
                        maxWidth: '100%',
                      }}
                    >
                      {rawCode}
                    </SyntaxHighlighter>
                  ) : (
                    <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed select-text">
                      <code>{rawCode}</code>
                    </pre>
                  )}
                </div>
              );
            },
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs backdrop-blur-xs">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="hover:bg-blue-50/40 dark:hover:bg-blue-900/15 transition-colors odd:bg-transparent even:bg-slate-50/40 dark:even:bg-slate-800/20" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-3.5 py-2.5 font-bold tracking-wider text-slate-700 dark:text-slate-200 whitespace-nowrap" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 align-top leading-relaxed" {...props} />
            ),
          }}
        >
          {displayedContent}
        </ReactMarkdown>
      </div>
      
      {(isStreaming || streaming) && displayedContent.length < content.length && (
        <div className="flex space-x-1 mt-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
          <div className="w-2 h-2 rounded-full bg-blue-700 animate-bounce delay-200" />
        </div>
      )}
    </div>
  );
}); 