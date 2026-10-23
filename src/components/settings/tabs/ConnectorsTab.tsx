import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Cloud, MessageSquare, Code, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { connectorService, ConnectorInfo } from '../../../services/connectorService';
import { toast } from 'sonner';

const ICON_MAP = {
  Mail,
  Calendar,
  Cloud,
  MessageSquare,
  Code
};

export const ConnectorsTab: React.FC = () => {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = connectorService.subscribe((list) => {
      setConnectors(list);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (id: string, currentStatus: 'connected' | 'disconnected') => {
    setLoadingId(id);
    try {
      if (currentStatus === 'connected') {
        const success = await connectorService.disconnect(id);
        if (success) {
          toast.success(`Disconnected from ${id.toUpperCase()}`);
        } else {
          toast.error(`Failed to disconnect from ${id.toUpperCase()}`);
        }
      } else {
        const success = await connectorService.connect(id);
        if (success) {
          toast.success(`Connection process started for ${id.toUpperCase()}`);
        } else {
          toast.error(`Failed to connect to ${id.toUpperCase()}`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred during connector toggle');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Integrations & Connectors</h3>
        <p className="text-slate-400 text-xs mt-1">Expose external databases, mail clients, and file system hubs to the AI Soul.</p>
      </div>

      <div className="grid gap-3">
        {connectors.map((c) => {
          const Icon = ICON_MAP[c.iconName] || Code;
          const isConnected = c.status === 'connected';
          const isLoading = loadingId === c.id;

          return (
            <div key={c.id} className="flex items-center justify-between p-4 bg-[#0d0d12]/50 border border-white/10 rounded-xl hover:border-white/15 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isConnected ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border border-white/5 text-slate-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{c.name}</h4>
                  <p className="text-slate-500 text-[10px] mt-0.5">{c.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-900 border-white/5 text-slate-500'
                }`}>
                  {isConnected ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <button
                  onClick={() => handleAction(c.id, c.status)}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 min-w-[85px] justify-center ${
                    isConnected
                      ? 'border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40'
                      : 'border-emerald-500/30 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : isConnected ? (
                    'Disconnect'
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
