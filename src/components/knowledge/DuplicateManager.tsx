import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { duplicateCleanupService, type DuplicateGroup, type DuplicateCleanupResult } from '../../services/duplicateCleanupService';
import { Copy, Trash2, CheckCircle, AlertTriangle, Loader2, Search } from 'lucide-react';

interface DuplicateManagerProps {
  onClose?: () => void;
}

export function DuplicateManager({ onClose }: DuplicateManagerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DuplicateCleanupResult | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [step, setStep] = useState<'scan' | 'review' | 'complete'>('scan');

  const scanForDuplicates = async () => {
    setIsScanning(true);
    try {
      const result = duplicateCleanupService.findDuplicates();
      setScanResult(result);
      setStep('review');
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const removeDuplicates = async () => {
    if (!scanResult) return;

    setIsRemoving(true);
    try {
      const cleanupResult = duplicateCleanupService.removeDuplicates(scanResult.duplicateGroups);
      setScanResult(cleanupResult);
      setStep('complete');
    } catch (error) {
      console.error('Error removing duplicates:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const renderScanStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Copy className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Duplicate Document Scanner</h3>
          <p className="text-sm text-gray-600">Find and remove duplicate documents in your Knowledge Base</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Scans all documents for potential duplicates</li>
          <li>• Groups documents by name and source similarity</li>
          <li>• Keeps the best version (most content, newest, has embeddings)</li>
          <li>• Safely removes inferior duplicate copies</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          onClick={scanForDuplicates}
          disabled={isScanning}
          className="flex-1"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Scan for Duplicates
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Copy className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Duplicate Review</h3>
          <p className="text-sm text-gray-600">Review found duplicates before removal</p>
        </div>
      </div>

      {scanResult && scanResult.totalDuplicates === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found!</h4>
          <p className="text-gray-600">Your Knowledge Base is clean and organized.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Duplicates Found</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Found {scanResult?.totalDuplicates} duplicate documents in {scanResult?.duplicateGroups.length} groups.
                  The best version of each will be kept.
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3">
            {scanResult?.duplicateGroups.map((group, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  Group {index + 1}: {group.documents.length} similar documents
                </h5>
                <div className="space-y-2">
                  {group.documents.map((doc, docIndex) => {
                    const isKeeping = doc.id === group.keepDocument?.id;
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          isKeeping 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        {isKeeping ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                        <span className={isKeeping ? 'text-green-800' : 'text-red-800'}>
                          {isKeeping ? 'Keep:' : 'Remove:'} {doc.title || doc.metadata.title}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          {doc.content?.length || 0} chars
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setStep('scan')} className="flex-1">
          Back to Scan
        </Button>
        
        {scanResult && scanResult.totalDuplicates > 0 && (
          <Button
            onClick={removeDuplicates}
            disabled={isRemoving}
            className="flex-1"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove {scanResult.totalDuplicates} Duplicates
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Cleanup Complete!</h3>
        <p className="text-sm text-gray-600 mt-1">
          Successfully removed {scanResult?.removedCount} duplicate documents
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm text-green-800">
          <div className="font-medium mb-2">Summary:</div>
          <div>• Removed: {scanResult?.removedCount} duplicates</div>
          <div>• Kept: {scanResult?.keptCount} best versions</div>
          <div>• Your Knowledge Base is now optimized!</div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setStep('scan');
            setScanResult(null);
          }}
          className="flex-1"
        >
          Scan Again
        </Button>
        
        {onClose && (
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      {step === 'scan' && renderScanStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
} 