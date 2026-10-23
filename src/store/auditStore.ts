import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditLog {
  id: string;
  actionType: string;
  sourceType: string;
  sourceId: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'completed' | 'failed';
  details?: Record<string, unknown>;
  userId?: string;
}

interface AuditState {
  auditLogs: AuditLog[];
  pendingActions: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id'>) => string;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  markActionCompleted: (id: string, result?: unknown) => void;
  getPendingActionsCount: () => number;
  clearOldLogs: (daysToKeep: number) => void;
  bulkApprove: (ids: string[]) => void;
  bulkReject: (ids: string[]) => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      auditLogs: [],
      pendingActions: [],
      
      addAuditLog: (log) => {
        const id = crypto.randomUUID();
        const newLog = { ...log, id };
        
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
          pendingActions: log.status === 'pending' 
            ? [newLog, ...state.pendingActions]
            : state.pendingActions
        }));
        
        return id;
      },
      
      approveAction: (id) => {
        set((state) => ({
          auditLogs: state.auditLogs.map(log => 
            log.id === id ? { ...log, status: 'approved' } : log
          ),
          pendingActions: state.pendingActions.filter(action => action.id !== id)
        }));
      },
      
      rejectAction: (id) => {
        set((state) => ({
          auditLogs: state.auditLogs.map(log => 
            log.id === id ? { ...log, status: 'rejected' } : log
          ),
          pendingActions: state.pendingActions.filter(action => action.id !== id)
        }));
      },
      
      markActionCompleted: (id, result) => {
        set((state) => ({
          auditLogs: state.auditLogs.map(log => 
            log.id === id ? { 
              ...log, 
              status: 'completed',
              details: { ...log.details, result }
            } : log
          )
        }));
      },
      
      getPendingActionsCount: () => {
        return get().pendingActions.length;
      },
      
      clearOldLogs: (daysToKeep) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        set((state) => ({
          auditLogs: state.auditLogs.filter(log => 
            new Date(log.timestamp) >= cutoffDate
          )
        }));
      },
      
      bulkApprove: (ids) => {
        set((state) => ({
          auditLogs: state.auditLogs.map(log => 
            ids.includes(log.id) ? { ...log, status: 'approved' } : log
          ),
          pendingActions: state.pendingActions.filter(action => !ids.includes(action.id))
        }));
      },
      
      bulkReject: (ids) => {
        set((state) => ({
          auditLogs: state.auditLogs.map(log => 
            ids.includes(log.id) ? { ...log, status: 'rejected' } : log
          ),
          pendingActions: state.pendingActions.filter(action => !ids.includes(action.id))
        }));
      }
    }),
    {
      name: 'genieflow-audit-storage'
    }
  )
); 