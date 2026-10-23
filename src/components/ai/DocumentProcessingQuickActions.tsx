/**
 * Document Processing Quick Actions Panel
 * 
 * Provides easy-to-use controls for document processing operations
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Upload,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Zap,
  Brain,
  FileText,
  Folder,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

interface ProcessingSettings {
  batchSize: number;
  enableEmbedding: boolean;
  enableSummary: boolean;
  enableAutoTagging: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const DocumentProcessingQuickActions: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [settings, setSettings] = useState<ProcessingSettings>({
    batchSize: 3,
    enableEmbedding: true,
    enableSummary: true,
    enableAutoTagging: true,
    priority: 'medium'
  });

  const [quickStats] = useState({
    queueSize: 12,
    processing: 3,
    completed: 8,
    failed: 1
  });

  const handleBulkUpload = () => {
    console.log('🚀 Starting bulk document upload...');
    // This would trigger file picker for multiple documents
  };

  const handleProcessAll = () => {
    console.log('⚡ Processing all queued documents...');
    setIsProcessing(true);
  };

  const handlePauseAll = () => {
    console.log('⏸️ Pausing all document processing...');
    setIsProcessing(false);
  };

  const handleRetryFailed = () => {
    console.log('🔄 Retrying failed documents...');
  };

  const handleClearCompleted = () => {
    console.log('🧹 Clearing completed documents...');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-xs text-slate-600">Queue</p>
            <p className="font-bold text-slate-800">{quickStats.queueSize}</p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
          <div>
            <p className="text-xs text-blue-600">Processing</p>
            <p className="font-bold text-blue-800">{quickStats.processing}</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-xs text-green-600">Completed</p>
            <p className="font-bold text-green-800">{quickStats.completed}</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-xs text-red-600">Failed</p>
            <p className="font-bold text-red-800">{quickStats.failed}</p>
          </div>
        </div>
      </div>

      {/* Main Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={handleBulkUpload}
                className="btn-genie-primary flex items-center gap-2 h-12"
              >
                <Upload className="w-5 h-5" />
                Bulk Upload Documents
              </Button>
              
              <Button
                onClick={isProcessing ? handlePauseAll : handleProcessAll}
                variant={isProcessing ? "destructive" : "default"}
                className="flex items-center gap-2 h-12"
              >
                {isProcessing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isProcessing ? 'Pause All' : 'Process All'}
              </Button>
              
              <Button
                onClick={handleRetryFailed}
                variant="outline"
                className="flex items-center gap-2 h-12"
                disabled={quickStats.failed === 0}
              >
                <RotateCcw className="w-5 h-5" />
                Retry Failed ({quickStats.failed})
              </Button>
            </div>

            {/* Processing Templates */}
            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Processing Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto flex-col"
                  onClick={() => console.log('🏛️ Legal Document Processing')}
                >
                  <FileText className="w-6 h-6 text-blue-500" />
                  <div className="text-center">
                    <div className="font-medium">Legal Documents</div>
                    <div className="text-xs text-slate-500">Contracts, Petitions, Filings</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto flex-col"
                  onClick={() => console.log('🏥 Medical Records Processing')}
                >
                  <Plus className="w-6 h-6 text-green-500" />
                  <div className="text-center">
                    <div className="font-medium">Medical Records</div>
                    <div className="text-xs text-slate-500">Reports, Lab Results, Notes</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto flex-col"
                  onClick={() => console.log('📊 Research Papers Processing')}
                >
                  <Brain className="w-6 h-6 text-purple-500" />
                  <div className="text-center">
                    <div className="font-medium">Research Papers</div>
                    <div className="text-xs text-slate-500">Studies, Articles, Analysis</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Processing Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Batch Size */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-slate-700">Batch Size</label>
                <p className="text-sm text-slate-500">Documents processed simultaneously</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, batchSize: Math.max(1, prev.batchSize - 1) }))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-bold">{settings.batchSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, batchSize: Math.min(10, prev.batchSize + 1) }))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Priority Setting */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-slate-700">Default Priority</label>
                <p className="text-sm text-slate-500">Processing priority for new documents</p>
              </div>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <Button
                    key={priority}
                    variant={settings.priority === priority ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, priority }))}
                  >
                    <Badge className={getPriorityColor(priority)}>
                      {priority}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">AI Features</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Embedding</span>
                  </div>
                  <Button
                    variant={settings.enableEmbedding ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, enableEmbedding: !prev.enableEmbedding }))}
                  >
                    {settings.enableEmbedding ? 'ON' : 'OFF'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Summary</span>
                  </div>
                  <Button
                    variant={settings.enableSummary ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, enableSummary: !prev.enableSummary }))}
                  >
                    {settings.enableSummary ? 'ON' : 'OFF'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Auto-Tag</span>
                  </div>
                  <Button
                    variant={settings.enableAutoTagging ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, enableAutoTagging: !prev.enableAutoTagging }))}
                  >
                    {settings.enableAutoTagging ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleClearCompleted}
                variant="outline"
                className="flex-1"
                disabled={quickStats.completed === 0}
              >
                Clear Completed
              </Button>
              <Button
                onClick={() => console.log('💾 Settings saved:', settings)}
                className="btn-genie-primary flex-1"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 