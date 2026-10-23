import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { AIMessage } from '../../../types/legal';

interface AIHistoryProps {
  messages: AIMessage[];
}

export function AIHistory({ messages }: AIHistoryProps) {
  const conversations = groupMessagesByConversation(messages);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Chat History
      </h2>

      <div className="space-y-4">
        {conversations.map((conversation, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare size={16} className="text-blue-500 dark:text-blue-400" />
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  {truncateText(conversation[0].content, 30)}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Clock size={12} className="mr-1" />
                {format(conversation[0].timestamp, 'MMM d, h:mm a')}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {conversation.length} messages
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupMessagesByConversation(messages: AIMessage[]): AIMessage[][] {
  const conversations: AIMessage[][] = [];
  let currentConversation: AIMessage[] = [];

  messages.forEach((message) => {
    if (
      currentConversation.length === 0 ||
      getTimeDifferenceInMinutes(
        message.timestamp,
        currentConversation[currentConversation.length - 1].timestamp
      ) < 30
    ) {
      currentConversation.push(message);
    } else {
      conversations.push(currentConversation);
      currentConversation = [message];
    }
  });

  if (currentConversation.length > 0) {
    conversations.push(currentConversation);
  }

  return conversations;
}

function getTimeDifferenceInMinutes(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}