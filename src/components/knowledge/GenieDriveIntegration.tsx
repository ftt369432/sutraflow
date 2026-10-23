import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Brain, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  FolderOpen, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Link2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { genieDriveKnowledgeBaseService } from '../../services/genieDriveKnowledgeBaseService';

interface GenieDriveIntegrationProps {
  className?: string;
}

export function GenieDriveIntegration({ className }: GenieDriveIntegrationProps) {
  const navigate = useNavigate();
  const { documents } = useKnowledgeBaseStore();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [linkedCount, setLinkedCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    checkLinkStatus();
  }, [documents]);

  const checkLinkStatus = async () => {
    try {
      const linked = documents.filter(doc => 
        doc.metadata?.source?.includes('geniedrive') || 
        (doc.metadata as any)?.driveFileId
      ).length;
      setLinkedCount(linked);
      
      // Mock available count - in real implementation, fetch from GenieDrive
      setAvailableCount(Math.max(linked + 5, 12));
    } catch (error) {
      console.error('Error checking link status:', error);
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      // Mock sync for now - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus('success');
      setLastSyncTime(new Date());
      await checkLinkStatus();
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const handleLinkMoreFiles = () => {
    navigate('/genie-drive');
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Sync now';
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <HardDrive className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">GenieDrive</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="p-1.5 hover:bg-primary/5"
        >
          {getSyncStatusIcon()}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Linked Files</span>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {linkedCount}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available</span>
          </div>
          <Badge variant="outline">
            {availableCount}
          </Badge>
        </div>
      </div>

      {/* Primary Action */}
      <Button 
        onClick={handleLinkMoreFiles}
        className="w-full bg-primary hover:bg-primary/90 text-white"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Link More Files
      </Button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/genie-drive')}
          className="text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          Browse
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          {getSyncStatusIcon()}
          <span className="ml-1">{getSyncStatusText()}</span>
        </Button>
      </div>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
          Last synced: {lastSyncTime.toLocaleString()}
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-primary/10 rounded">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-primary mb-1">
              AI-Powered Knowledge Base
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Files from GenieDrive are automatically processed and indexed for AI conversations. 
              Your assistants can reference and discuss these documents intelligently.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 