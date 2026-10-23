import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  MessageSquare,
  Search,
  Plus,
  Star,
  Trash2,
  FolderPlus,
  Bot,
  Settings,
  Home,
  CalendarDays,
  BookOpen,
  Briefcase,
  HardDrive,
  Wand2,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AgentList } from '../agents/AgentList';
import type { Agent } from '../../types/agent';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  section?: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  isFavorite?: boolean;
  unread?: boolean;
}

import { BRAND_CONFIG } from '../../config/brand';

interface LeftPanelProps {
  conversations?: Conversation[];
  selectedConversationId?: string;
  agents?: Agent[];
  selectedAgentId?: string;
  onSelectConversation?: (id: string) => void;
  onSelectAgent?: (id: string) => void;
  onNewChat?: () => void;
  onNewCase?: () => void;
  onCreateAgent?: () => void;
  onDeleteConversation?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function LeftPanel({
  conversations = [],
  selectedConversationId,
  agents = [],
  selectedAgentId,
  onSelectConversation = () => {},
  onSelectAgent = () => {},
  onNewChat = () => {},
  onNewCase = () => {},
  onCreateAgent = () => {},
  onDeleteConversation = () => {},
  onToggleFavorite = () => {}
}: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoAdjust, setAutoAdjust] = useState(true);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteConversations = filteredConversations.filter(conv => conv.isFavorite);
  const otherConversations = filteredConversations.filter(conv => !conv.isFavorite);

  return (
    <div className="w-64 flex flex-col h-full bg-gray-900">
      {/* Logo */}
      <div className="flex-none p-4">
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          <Bot className="w-6 h-6 text-cyan-400" />
          {BRAND_CONFIG.name}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-none px-3 py-2 space-y-2">
        <Button
          variant="default"
          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          onClick={onNewCase}
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Case</span>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-gray-600 text-white hover:bg-gray-800 hover:text-white font-semibold"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex-none px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Auto Adjust Switch */}
      <div className="flex-none px-3 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white font-medium">
            <Settings className="h-4 w-4" />
            <span>Auto Adjust</span>
          </div>
          <button
            onClick={() => setAutoAdjust(!autoAdjust)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              autoAdjust ? "bg-blue-600" : "bg-gray-600"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                autoAdjust ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Agents */}
      <div className="flex-none py-2 border-b border-gray-800">
        <AgentList
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
          onCreateAgent={onCreateAgent}
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto py-2">
        {favoriteConversations.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 text-sm font-semibold text-white uppercase">
              Favorites
            </div>
            <div>
              {favoriteConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {favoriteConversations.length > 0 && (
            <div className="px-3 py-1 text-sm font-semibold text-white uppercase">
              Recent
            </div>
          )}
          <div>
            {otherConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>

        {filteredConversations.length === 0 && searchQuery && (
          <div className="px-3 py-2 text-sm text-white text-center">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between py-2 px-3 cursor-pointer',
        isSelected ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-800'
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {conversation.isFavorite ? (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
        ) : (
          <MessageSquare className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="text-sm font-medium truncate">{conversation.title}</span>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 hover:bg-gray-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(conversation.id);
          }}
        >
          <Star
            className={cn(
              'h-4 w-4',
              conversation.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'
            )}
          />
        </button>
        
        <button
          className="p-1 hover:bg-gray-700 rounded text-white hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 