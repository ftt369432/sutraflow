import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { agenticToolRegistry } from '../../services/agents/ToolRegistry';
import { 
  Sparkles, CheckCircle2, XCircle, Brain, Mail, Calendar, 
  ListTodo, ChevronRight, AlertCircle, RefreshCw, Trash2, Info 
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ObserverQueueItem {
  id: string;
  source: string;
  source_id?: string;
  action_type: string;
  action_params: Record<string, any>;
  confidence: number;
  reasoning?: string;
  status: 'pending' | 'approved' | 'dismissed' | 'executed' | 'failed';
  created_at: string;
  error_message?: string;
}

export function AgentObserverInbox() {
  const [items, setItems] = useState<ObserverQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch pending items
  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('agent_observer_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setItems(data || []);
    } catch (err: any) {
      console.error('❌ Error fetching observer queue:', err);
      setError(err.message || 'Failed to load background observations.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Set up realtime subscription
  useEffect(() => {
    fetchPendingItems();

    const channel = supabase
      .channel('agent_observer_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_observer_queue' },
        (payload) => {
          console.log('🔔 Realtime update in agent_observer_queue:', payload);
          // Simply refresh items list to stay in sync
          fetchPendingItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Approve and Execute
  const handleApprove = async (item: ObserverQueueItem) => {
    setProcessingId(item.id);
    setError(null);
    console.log(`🚀 Executing observed action: ${item.action_type}`, item.action_params);

    try {
      // Step A: Update status to approved
      const { error: updateErr1 } = await supabase
        .from('agent_observer_queue')
        .update({ status: 'approved' })
        .eq('id', item.id);

      if (updateErr1) throw updateErr1;

      // Step B: Execute the tool using AgenticToolRegistry
      const result = await agenticToolRegistry.executeTool(item.action_type, item.action_params);

      if (result.success) {
        // Step C: Update status to executed
        const { error: updateErr2 } = await supabase
          .from('agent_observer_queue')
          .update({ status: 'executed' })
          .eq('id', item.id);

        if (updateErr2) throw updateErr2;
        
        // Remove from local list
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        throw new Error(result.error || 'Tool execution returned success=false');
      }
    } catch (err: any) {
      console.error(`❌ Failed to execute action ${item.id}:`, err);
      // Mark as failed in DB
      await supabase
        .from('agent_observer_queue')
        .update({ status: 'failed', error_message: err.message || 'Unknown error' })
        .eq('id', item.id);

      setError(`Failed to execute ${item.action_type}: ${err.message || 'Unknown error'}`);
      fetchPendingItems();
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Dismiss
  const handleDismiss = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      const { error: dismissErr } = await supabase
        .from('agent_observer_queue')
        .update({ status: 'dismissed' })
        .eq('id', itemId);

      if (dismissErr) throw dismissErr;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      console.error('❌ Error dismissing item:', err);
      setError(err.message || 'Failed to dismiss item.');
    } finally {
      setProcessingId(null);
    }
  };

  // 💡 Map action type to icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'schedule_event':
      case 'auto_calendar':
        return <Calendar className="h-5 w-5 text-emerald-500" />;
      case 'create_task':
        return <ListTodo className="h-5 w-5 text-blue-500" />;
      case 'read_emails':
      case 'analyze_email':
        return <Mail className="h-5 w-5 text-amber-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  // 💡 Format Action Type string
  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Scanning background logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Proactive Suggestions ({items.length})
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchPendingItems}
          className="h-7 px-2 hover:bg-white/[0.05] text-[10px] font-bold uppercase text-slate-400"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/[0.05] rounded-2xl bg-white/[0.01]">
          <Brain className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-400">Clear Inbox</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
            GenieFlow background observer hasn't detected new email tasks or schedule requests yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
          {items.map((item) => {
            const isProcessing = processingId === item.id;
            const confidencePct = Math.round(item.confidence * 100);

            return (
              <div 
                key={item.id}
                className="group relative border border-white/[0.05] hover:border-white/[0.12] bg-[#0d0d15]/80 backdrop-blur-md rounded-xl p-4 transition-all duration-300 shadow-lg hover:shadow-indigo-500/[0.02]"
              >
                {/* Confidence Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <Badge 
                    className={`text-[9px] font-bold tracking-tight rounded-md border-0 ${
                      confidencePct >= 90 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : confidencePct >= 75 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {confidencePct}% Match
                  </Badge>
                </div>

                {/* Left Action Icon + Title */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    {getActionIcon(item.action_type)}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0 pr-16">
                    <h4 className="text-sm font-bold text-slate-200">
                      {formatActionType(item.action_type)}
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Source: {item.source}
                    </span>
                  </div>
                </div>

                {/* Parameter details display */}
                <div className="mt-3 bg-white/[0.01] border border-white/[0.03] p-3 rounded-lg space-y-2 text-xs">
                  {item.action_params.title && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-semibold shrink-0">Title:</span>
                      <span className="text-slate-200 font-medium">{item.action_params.title}</span>
                    </div>
                  )}
                  {item.action_params.description && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-semibold shrink-0">Description:</span>
                      <span className="text-slate-300 font-medium line-clamp-3">{item.action_params.description}</span>
                    </div>
                  )}
                  {item.action_params.startTime && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-semibold shrink-0">Start:</span>
                      <span className="text-emerald-400 font-medium">
                        {new Date(item.action_params.startTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {item.action_params.dueDate && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-semibold shrink-0">Due Date:</span>
                      <span className="text-blue-400 font-medium">
                        {new Date(item.action_params.dueDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {item.action_params.priority && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-semibold shrink-0">Priority:</span>
                      <Badge variant="outline" className="text-[9px] h-4 py-0 leading-none capitalize">
                        {item.action_params.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* AI Reasoning */}
                {item.reasoning && (
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400 leading-normal font-medium bg-indigo-500/[0.02] border border-indigo-500/[0.05] p-2.5 rounded-lg">
                    <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{item.reasoning}</span>
                  </div>
                )}

                {/* Approve/Dismiss actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-end gap-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(item.id)}
                    disabled={isProcessing}
                    className="h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-semibold px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Dismiss
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleApprove(item)}
                    disabled={isProcessing}
                    className="h-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-4 rounded-lg shadow-md border-0"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Approve & Execute
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
