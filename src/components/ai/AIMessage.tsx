import { Bot, User, Clock, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../../types/ai';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  node?: any;
}

interface AIMessageProps {
  message: Message;
  onRetry?: (message: Message) => void;
}

export function AIMessage({ message, onRetry }: AIMessageProps) {
  const isAI = message.role === 'assistant';
  const metadata = message.metadata || {};
  const [copied, setCopied] = useState(false);

  const handleRetry = () => {
    if (onRetry && message.role === 'user') {
      onRetry(message);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CodeBlock: React.FC<CodeComponentProps> = ({
    inline,
    className,
    children,
    ...props
  }) => {
    const { ref, node, ...restProps } = props as any;
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...restProps}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...restProps}>
        {children}
      </code>
    );
  };

  return (
    <div className={cn(
      'flex gap-3',
      isAI ? 'justify-start' : 'justify-end'
    )}>
      {isAI && (
        <div className={cn(
          'h-8 w-8 rounded-full border flex items-center justify-center',
          'bg-gray-700'
        )}>
          <Bot className={cn('h-4 w-4', 'text-cyberpunk-neon')} />
        </div>
      )}
      
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={cn(
          'rounded-lg p-4 border',
          'bg-gray-700',
          'border-gray-600',
          'text-white'
        )}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {isAI ? <Bot className="h-5 w-5 mr-2" /> : <User className="h-5 w-5 mr-2" />}
              <span className="font-semibold text-sm">{isAI ? 'AI Assistant' : 'You'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-gray-600 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 hover:text-white" />
                )}
              </button>
              <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="text-sm prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code: CodeBlock,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Metadata */}
        {isAI && metadata.processingTime && (
          <div className={cn(
            'flex items-center gap-2 text-xs',
            'text-cyberpunk-neon'
          )}>
            <Clock className="h-3 w-3" />
            <span>{Math.round(metadata.processingTime / 1000)}s</span>
          </div>
        )}
      </div>

      {!isAI && (
        <div className={cn(
          'h-8 w-8 rounded-full border flex items-center justify-center',
          'bg-blue-600'
        )}>
          <User className={cn('h-4 w-4', 'text-cyberpunk-neon')} />
        </div>
      )}

      {!isAI && onRetry && (
         <div className="flex items-center justify-end mt-2">
           <button onClick={handleRetry} className="text-xs text-gray-400 hover:text-white flex items-center">
             <RefreshCw className="h-3 w-3 mr-1" /> Retry
           </button>
         </div>
       )}
    </div>
  );
}

AIMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    metadata: PropTypes.object
  }).isRequired,
  onRetry: PropTypes.func
}; 