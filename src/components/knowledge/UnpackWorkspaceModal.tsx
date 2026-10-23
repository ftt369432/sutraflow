import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Play, CheckCircle2, AlertTriangle, RefreshCw, Scroll, BookOpen, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WorkspaceUnpackerService, UnpackLog } from '../../services/manifest/WorkspaceUnpackerService';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';

interface UnpackWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UnpackWorkspaceModal({
  isOpen,
  onClose,
  onSuccess
}: UnpackWorkspaceModalProps) {
  const [workspacePath, setWorkspacePath] = useState('c:\\SovereignWorkspace');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncResult, setSyncResult] = useState<UnpackLog | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const loadDocuments = useKnowledgeBaseStore(state => state.loadDocuments);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    const bridge = (window as any).electronBridge;
    if (!bridge || !bridge.dialog) {
      alert('Local folder selection is only available in the Electron desktop app.');
      return;
    }
    
    try {
      const res = await bridge.dialog.openFolder();
      if (res.success && res.paths && res.paths.length > 0) {
        setWorkspacePath(res.paths[0]);
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  };

  const handleStartSync = async () => {
    if (!workspacePath.trim()) return;

    setIsSyncing(true);
    setSyncLogs(['🔄 Initializing Workspace Unpacker...']);
    setSyncResult(null);

    try {
      // Run the unpacker
      const result = await WorkspaceUnpackerService.unpackLocalWorkspace(workspacePath.trim());
      setSyncLogs(result.log);
      setSyncResult(result);

      if (result.success) {
        // Refresh knowledge base store documents
        await loadDocuments();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      setSyncLogs(prev => [...prev, `❌ Unexpected system error: ${error.message || error}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    if (isSyncing) return;
    setSyncLogs([]);
    setSyncResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Antigravity Workspace Unpacker
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sync local markdown hierarchy to unified cloud storage and configure agent prompts.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSyncing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Path Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Local Workspace Root Path
            </label>
            <div className="flex space-x-2">
              <Input
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                placeholder="e.g. c:\SovereignWorkspace"
                disabled={isSyncing}
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleBrowse}
                disabled={isSyncing}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <FolderOpen className="h-4 w-4" />
                Browse...
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Must contain <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">MASTER_MANIFEST.md</code> to index Cardinal Rules and template mappings.
            </p>
          </div>

          {/* Sync Progress / Console Logs */}
          {(syncLogs.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Scroll className="h-3.5 w-3.5" />
                  Synchronisation Logs
                </span>
                {isSyncing && <span className="text-blue-500 animate-pulse">Processing...</span>}
              </div>
              <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-slate-800 shadow-inner">
                {syncLogs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.startsWith('❌')) colorClass = 'text-red-400 font-bold';
                  else if (log.startsWith('⚠️')) colorClass = 'text-yellow-400';
                  else if (log.startsWith('✅') || log.startsWith('🎉') || log.startsWith('✨')) colorClass = 'text-emerald-400';
                  else if (log.startsWith('🚀') || log.startsWith('🤖') || log.startsWith('📖')) colorClass = 'text-blue-400';

                  return (
                    <div key={index} className={`py-0.5 leading-relaxed break-all ${colorClass}`}>
                      {log}
                    </div>
                  );
                })}
                {isSyncing && (
                  <div className="flex items-center gap-2 mt-2 text-blue-400 animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Streaming updates from filesystem bridge...</span>
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Parsed Manifest Summary details */}
          {syncResult && syncResult.success && syncResult.parsedManifest && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span>Workspace Successfully Unpacked to Cloud</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Cardinal Rules info */}
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                    <span>Cardinal Rules Applied ({syncResult.parsedManifest.cardinalRules.length})</span>
                  </div>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-0.5">
                    {syncResult.parsedManifest.cardinalRules.slice(0, 3).map((rule, idx) => (
                      <li key={idx} className="truncate" title={rule}>{rule}</li>
                    ))}
                    {syncResult.parsedManifest.cardinalRules.length > 3 && (
                      <li className="text-[10px] text-slate-400 italic">+{syncResult.parsedManifest.cardinalRules.length - 3} more rules</li>
                    )}
                  </ul>
                </div>

                {/* Templates info */}
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                    <span>Templates Synchronised</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Synced {syncResult.parsedManifest.files.filter(f => f.category === 'template').length} master document templates to your Cloud AI Drive.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSyncing}
          >
            {syncResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!syncResult?.success && (
            <Button
              onClick={handleStartSync}
              disabled={isSyncing || !workspacePath.trim()}
              className="flex items-center gap-1.5"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Ingestion
                </>
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
