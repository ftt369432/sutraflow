import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Email } from '../../types';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';

interface EmailComposeProps {
  onSend: (email: Partial<Email>) => Promise<void>;
  onCancel: () => void;
  initialEmail?: Partial<Email>;
}

export function EmailCompose({ onSend, onCancel, initialEmail }: EmailComposeProps) {
  const [to, setTo] = useState(initialEmail?.to?.join(', ') || '');
  const [subject, setSubject] = useState(initialEmail?.subject || '');
  const [content, setContent] = useState(initialEmail?.content || '');

  const { getSuggestedTemplates, useTemplate } = useEmailTemplates();
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSend({
      to: to.split(',').map(email => email.trim()),
      subject,
      content
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showTemplates && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Suggested Templates
            </h3>
            <div className="space-y-2">
              {getSuggestedTemplates({ subject, content }).map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSubject(template.subject);
                    setContent(template.content);
                    useTemplate(template.id);
                    setShowTemplates(false);
                  }}
                  className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {template.subject}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <input
              type="text"
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}