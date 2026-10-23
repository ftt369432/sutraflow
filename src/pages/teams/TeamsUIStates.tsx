import React from 'react';
import { Button } from '../../components/ui/Button';
import { MessageSquare, Zap, Sparkles, Users } from 'lucide-react';

export const TeamsPageSkeleton: React.FC = () => (
  <div className="flex h-full bg-white overflow-hidden">
    <div className="w-72 bg-slate-50 border-r border-slate-200 p-4 space-y-3">
      <div className="h-8 bg-slate-200/60 rounded-lg animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-14 bg-white border-b border-slate-100 flex items-center px-6">
        <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex h-full items-center justify-center bg-white">
    <div className="max-w-sm text-center space-y-4">
      <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center">
        <MessageSquare className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Unable to load teams</h3>
      <p className="text-sm text-slate-500">{error.message || 'Something went wrong.'}</p>
      <Button onClick={onRetry} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6">
        <Zap className="h-4 w-4 mr-2" /> Try Again
      </Button>
    </div>
  </div>
);

export const EmptyState: React.FC<{ onCreateTeam: () => void }> = ({ onCreateTeam }) => (
  <div className="flex h-full items-center justify-center bg-white">
    <div className="max-w-md text-center space-y-6 p-8">
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-sm border border-blue-100">
        <Users className="h-10 w-10 text-blue-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Teams 🚀</h2>
        <p className="text-slate-500 leading-relaxed">
          Create your first team to start collaborating with your colleagues in organized channels.
        </p>
      </div>
      <Button onClick={onCreateTeam} size="lg" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8 shadow-lg shadow-slate-200">
        <Sparkles className="h-5 w-5 mr-2" /> Create Your First Team
      </Button>
    </div>
  </div>
);
