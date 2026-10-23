import React from 'react';
import { Prism as PrismHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
}

export function SyntaxHighlighter({
  code,
  language = 'javascript',
  showLineNumbers = true,
  wrapLines = true
}: SyntaxHighlighterProps) {
  return (
    <PrismHighlighter
      language={language}
      style={oneLight}
      showLineNumbers={showLineNumbers}
      wrapLines={wrapLines}
      customStyle={{
        margin: 0,
        padding: '1rem',
        borderRadius: 0,
        fontSize: '0.875rem',
        height: '100%',
        overflow: 'auto'
      }}
    >
      {code}
    </PrismHighlighter>
  );
} 