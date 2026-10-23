import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText, AlertTriangle, CheckCircle, XCircle, Loader2, Database, Cloud, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { documentRecoveryService, type RecoveryResult } from '../../services/documentRecoveryService';
import { useSupabase } from '../../providers/SupabaseProvider';
import { cn } from '../../lib/utils';

interface DocumentRecoveryProps {
  onClose?: () => void;
  onRecoveryComplete?: (recoveredCount: number) => void;
}

export function DocumentRecovery({ onClose, onRecoveryComplete }: DocumentRecoveryProps) {
  const { user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [preview, setPreview] = useState<{
    totalFiles: number;
    recoverableFiles: number;
    fileTypes: { [key: string]: number };
    estimatedSize: number;
    existingDuplicates: number;
  } | null>(null);
  const [step, setStep] = useState<'preview' | 'recovering' | 'complete'>('preview');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecoveryPreview();
    }
  }, [user?.id]);

  const loadRecoveryPreview = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const previewData = await documentRecoveryService.getRecoveryPreview(user.id);
      setPreview(previewData);
    } catch (error) {
      console.error('Error loading recovery preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecovery = async () => {
    if (!user?.id) return;

    setStep('recovering');
    setIsLoading(true);

    try {
      const result = await documentRecoveryService.recoverAllDocuments(user.id, {
        skipDuplicates
      });
      setRecoveryResult(result);
      setStep('complete');
      
      if (onRecoveryComplete && result.success) {
        onRecoveryComplete(result.recoveredCount);
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      setRecoveryResult({
        success: false,
        recoveredCount: 0,
        errors: [`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        documents: []
      });
      setStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Recovery</h3>
          <p className="text-sm text-gray-600">Restore your documents from cloud storage</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">What happened?</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your documents are safe in cloud storage, but the Knowledge Base lost track of them when local storage was cleared. 
              This recovery tool will restore the references to your uploaded files.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Scanning cloud storage...</span>
        </div>
      ) : preview ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Files Found</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{preview.totalFiles}</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Recoverable Documents</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{preview.recoverableFiles}</div>
            </div>
          </div>

          {Object.keys(preview.fileTypes).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">File Types Found</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(preview.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">{type}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.existingDuplicates > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Duplicate Files Detected</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Found {preview.existingDuplicates} files that already exist in your Knowledge Base.
              </p>
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">Skip duplicate files</span>
                </label>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              <strong>Total Size:</strong> {formatFileSize(preview.estimatedSize)}
              {preview.existingDuplicates > 0 && (
                <div className="mt-1">
                  <strong>Will recover:</strong> {skipDuplicates 
                    ? preview.recoverableFiles - preview.existingDuplicates 
                    : preview.recoverableFiles} documents
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recovery data available
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={startRecovery}
          disabled={!preview || preview.recoverableFiles === 0 || isLoading}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Recover {preview?.recoverableFiles || 0} Documents
        </Button>
      </div>
    </div>
  );

  const renderRecoveringStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Recovering Documents...</h3>
        <p className="text-sm text-gray-600 mt-1">
          Please wait while we restore your documents from cloud storage
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>Restoring references...</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={cn(
          "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
          recoveryResult?.success ? "bg-green-100" : "bg-red-100"
        )}>
          {recoveryResult?.success ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {recoveryResult?.success ? 'Recovery Complete!' : 'Recovery Failed'}
        </h3>
        
        <p className="text-sm text-gray-600 mt-1">
          {recoveryResult?.success
            ? `Successfully recovered ${recoveryResult.recoveredCount} documents`
            : 'There was an error during the recovery process'
          }
        </p>
      </div>

      {recoveryResult?.success && recoveryResult.recoveredCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Documents Restored</h4>
              <p className="text-sm text-green-700 mt-1">
                Your {recoveryResult.recoveredCount} documents have been restored to the Knowledge Base. 
                You can now search, organize, and work with them as before.
              </p>
            </div>
          </div>
        </div>
      )}

      {recoveryResult?.errors && recoveryResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Errors Encountered</h4>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {recoveryResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        {recoveryResult?.success && recoveryResult.recoveredCount > 0 && (
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        )}
        
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      {step === 'preview' && renderPreviewStep()}
      {step === 'recovering' && renderRecoveringStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
} 