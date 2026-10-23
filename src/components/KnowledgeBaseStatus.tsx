import React, { useState, useEffect } from 'react';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { knowledgeBaseInitService } from '../services/knowledgeBaseInitService';
import { AlertCircle, CheckCircle, RefreshCw, Database, Folder, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface KnowledgeBaseStatusProps {
  showDetails?: boolean;
  onStatusChange?: (status: 'loading' | 'connected' | 'error') => void;
}

export function KnowledgeBaseStatus({ showDetails = false, onStatusChange }: KnowledgeBaseStatusProps) {
  const { 
    folders, 
    documents, 
    loading, 
    error, 
    connectionStatus, 
    initialized,
    syncWithSupabase,
    loadDocuments 
  } = useKnowledgeBaseStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [initStatus, setInitStatus] = useState<any>(null);

  // Update parent component when status changes
  useEffect(() => {
    if (onStatusChange) {
      if (loading) {
        onStatusChange('loading');
      } else if (error) {
        onStatusChange('error');
      } else {
        onStatusChange('connected');
      }
    }
  }, [loading, error, onStatusChange]);

  // Monitor initialization status
  useEffect(() => {
    const updateStatus = () => {
      setInitStatus(knowledgeBaseInitService.getStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithSupabase();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceInit = async () => {
    setRefreshing(true);
    try {
      await knowledgeBaseInitService.forceRefresh();
    } catch (error) {
      console.error('Force init failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    if (loading || refreshing) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (connectionStatus === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Database className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (loading || refreshing) return 'Loading...';
    if (error) return 'Error';
    if (connectionStatus === 'connected') return 'Connected';
    if (connectionStatus === 'disconnected') return 'Offline';
    return 'Unknown';
  };

  const getStatusColor = () => {
    if (loading || refreshing) return 'blue';
    if (error) return 'red';
    if (connectionStatus === 'connected') return 'green';
    return 'yellow';
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant="outline" className={`text-${getStatusColor()}-600 border-${getStatusColor()}-200`}>
          KB: {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Knowledge Base Status</h3>
            {getStatusIcon()}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Folders</span>
              <Badge variant="secondary">{folders.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Documents</span>
              <Badge variant="secondary">{documents.length}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <Badge className={`ml-1 bg-${getStatusColor()}-100 text-${getStatusColor()}-800`}>
                {getStatusText()}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">Initialized:</span>{' '}
              <Badge variant={initialized ? "default" : "secondary"}>
                {initialized ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <Button 
              onClick={handleForceInit}
              size="sm"
              variant="outline"
              className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
            >
              Retry Initialization
            </Button>
          </div>
        )}

        {initStatus && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Init Status: {initStatus.initialized ? 'Complete' : 'Pending'}</div>
            <div>Retry Count: {initStatus.retryCount}</div>
            <div>Connection: {initStatus.storeStatus.connectionStatus}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Simple hook for checking knowledge base status
export function useKnowledgeBaseStatus() {
  const { loading, error, connectionStatus, initialized, folders, documents } = useKnowledgeBaseStore();

  return {
    isLoading: loading,
    hasError: !!error,
    isConnected: connectionStatus === 'connected',
    isInitialized: initialized,
    foldersCount: folders.length,
    documentsCount: documents.length,
    status: loading ? 'loading' : error ? 'error' : connectionStatus === 'connected' ? 'connected' : 'disconnected'
  };
}
