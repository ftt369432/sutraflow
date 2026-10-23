import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Activity,
  HardDrive,
  Mail,
  Calendar,
  Cloud,
  MessageSquare,
  Code,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Server,
  Zap,
  Radio
} from 'lucide-react';
import { connectorService, ConnectorInfo } from '../services/connectorService';
import IntegrationHub from '../components/integrations/IntegrationHub';
import { toast } from 'sonner';

export const DataSourcesPage: React.FC = () => {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'sources' | 'catalog'>('sources');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Initial load and subscription to connectorService
    const unsubscribe = connectorService.subscribe((list) => {
      setConnectors(list);
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await connectorService.updateStatus();
      toast.success('Connector statuses synchronized');
    } catch (err: any) {
      toast.error('Failed to sync statuses');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleConnect = async (connector: ConnectorInfo) => {
    setConnectingId(connector.id);
    try {
      if (connector.status === 'connected') {
        const ok = await connectorService.disconnect(connector.id);
        if (ok) {
          toast.success(`Disconnected from ${connector.name}`);
        } else {
          toast.error(`Failed to disconnect ${connector.name}`);
        }
      } else {
        const ok = await connectorService.connect(connector.id);
        if (ok) {
          toast.success(`Connected to ${connector.name}`);
        } else {
          toast.error(`Failed to connect ${connector.name}`);
        }
      }
    } catch (err: any) {
      toast.error(`Error configuring ${connector.name}: ${err?.message || 'Error'}`);
    } finally {
      setConnectingId(null);
    }
  };

  const getConnectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mail':
        return <Mail className="w-6 h-6 text-red-400" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6 text-blue-400" />;
      case 'Cloud':
        return <Cloud className="w-6 h-6 text-cyan-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-6 h-6 text-emerald-400" />;
      case 'Code':
        return <Code className="w-6 h-6 text-purple-400" />;
      default:
        return <Database className="w-6 h-6 text-amber-400" />;
    }
  };

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;

  const filteredConnectors = connectors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Data Sources & Ingestion Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  {connectedCount} Active Feeds
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Manage live connectors, data ingestion pipelines, and multi-tenant enterprise syncs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              Sync Feeds
            </button>

            {/* Tab switchers */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'sources'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Core Connectors
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Enterprise Catalog
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        {activeTab === 'sources' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Sync</div>
                <div className="text-xs font-bold text-white">{connectedCount} Channels Connected</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Storage Ingested</div>
                <div className="text-xs font-bold text-white">4.82 GB (Optimized)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Throughput</div>
                <div className="text-xs font-bold text-white">12.4 req/min</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <Shield className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Compliance</div>
                <div className="text-xs font-bold text-white">Zero-PHI Local Enclave</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'sources' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter data sources by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Displaying <span className="font-semibold text-slate-200">{filteredConnectors.length}</span> connectors
              </div>
            </div>

            {/* Connectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredConnectors.map((c) => {
                const isConnected = c.status === 'connected';
                const isBusy = connectingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner">
                          {getConnectorIcon(c.iconName)}
                        </div>
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Connected
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-500" />
                              Disconnected
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-slate-400" />
                        Auto-Sync 10s
                      </span>

                      <button
                        onClick={() => handleToggleConnect(c)}
                        disabled={isBusy}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isConnected
                            ? 'bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-slate-700'
                            : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        {isBusy ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Updating...
                          </>
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
        ) : (
          <div className="max-w-6xl mx-auto">
            <IntegrationHub />
          </div>
        )}
      </main>
    </div>
  );
};

export default DataSourcesPage;