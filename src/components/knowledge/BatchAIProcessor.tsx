import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  FileText, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Clock,
  Tag,
  Sparkles,
  FolderPlus,
  Bot,
  Zap,
  Target,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { processDocuments } from '../../services/aiProcessingService';
import { BatchAIProcessingService } from '../../services/batchAIProcessingService';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { 
  AIProcessingOptions, 
  AIProcessingResult, 
  AIProcessingStats,
  ProcessingStep,
  ProcessingStatus
} from '../../types/aiProcessing';

interface BatchAIProcessorProps {
  onComplete?: (result: BatchProcessingResult) => void;
  onCreateFolder?: (name: string, parentId?: string) => Promise<void>;
  isPageContext?: boolean;
  onClose?: () => void; // Keep onClose for modal context, make it optional
  documentIds?: string[]; // Add support for specific documents to process
}

type ProcessingStep = 'analyze' | 'configure' | 'processing' | 'complete';

interface ProcessingConfig {
  includeEmbeddings: boolean;
  includeAIAnalysis: boolean;
  includeAiTags: boolean;
  forceReprocess: boolean;
  concurrency: number;
  selectedFolderId?: string;
  createFolder: boolean;
  folderName: string;
}

// Define the component first
const BatchAIProcessorComponent: React.FC<BatchAIProcessorProps> = ({
  onComplete,
  onCreateFolder,
  isPageContext = false,
  onClose,
  documentIds
}) => {
  // Initialize the BatchAIProcessingService as a ref so it doesn't get recreated on each render
  const batchProcessingService = useRef(new BatchAIProcessingService());
  
  // Log initialization only once when the component mounts
  useEffect(() => {
    console.log('[DEBUG] 🧠 BatchAIProcessor initializing');
    console.log('[DEBUG] 🛑 BatchAIProcessor onClose is', onClose ? 'defined' : 'undefined');
  }, []);
  
  // Add effect for cleanup only
  useEffect(() => {
    return () => {
      console.log('[DEBUG] 🛑 BatchAIProcessor unmounted');
    };
  }, []);
  const { user } = useAuth();
  // const { documents, folders } = useKnowledgeBaseStore(); // documents might not be needed directly
  const { folders, initializeFromSupabase } = useKnowledgeBaseStore(); // Import initializeFromSupabase
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('analyze');
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<string>('');
  const [result, setResult] = useState<BatchProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<ProcessingConfig>({
    includeEmbeddings: true,
    includeAIAnalysis: true,
    includeAiTags: true,
    forceReprocess: false,
    concurrency: 3,
    createFolder: true,
    folderName: `AI Processed - ${new Date().toLocaleDateString()}`
  });

  // Analyze documents on component mount
  useEffect(() => {
    if (user && currentStep === 'analyze') {
      analyzeDocuments();
    }
  }, [user, currentStep]);

  const analyzeDocuments = async () => {
    try {
      setError(null);
      const analysisStats = await batchProcessingService.current.analyzeProcessingNeeds(
        user!.id,
        documentIds // Pass documentIds if specified
      );
      setStats(analysisStats);
      
      if (analysisStats.total === 0) {
        setError('No documents found in your Knowledge Base');
      } else if (analysisStats.needsEmbedding === 0 && analysisStats.needsAIAnalysis === 0) {
        setCurrentStep('complete');
        setResult({
          stats: analysisStats,
          processedDocuments: [],
          errors: [],
          summary: '✅ All documents are already fully processed!'
        });
      } else {
        setCurrentStep('configure');
      }
    } catch (err) {
      console.error('Error analyzing documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze documents');
    }
  };

  const startProcessing = async () => {
    if (!user || !stats) return;

    try {
      setProcessing(true);
      setError(null);
      setCurrentStep('processing');
      setProgress(0);
      
      // Create folder if requested
      if (config.createFolder && config.folderName.trim()) {
        await onCreateFolder(config.folderName.trim(), config.selectedFolderId);
      }

      const options: ProcessingOptions = {
        forceReprocess: config.forceReprocess,
        includeEmbeddings: config.includeEmbeddings,
        includeAIAnalysis: config.includeAIAnalysis,
        includeAiTags: config.includeAiTags,
        concurrency: config.concurrency,
        progressCallback: (progressPercent, docName) => {
          if (!paused) {
            setProgress(progressPercent);
            setCurrentDocument(docName || '');
          }
        }
      };

      // Use the instantiated service
      const processingResult = await batchProcessingService.current.batchProcessDocuments(
        user.id, 
        options,
        documentIds // Pass documentIds if specified
      );
      
      setResult(processingResult);
      setCurrentStep('complete');
      
      // Refresh data from the database to show the updated AI processing
      if (user?.id) {
        console.log('[BatchAIProcessor] Processing complete, refreshing document list');
        await initializeFromSupabase(user.id);
      }
      
      if (onComplete) {
        onComplete(processingResult);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  const renderAnalyzeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analyzing Documents
        </h3>
        <p className="text-gray-600">
          Scanning your Knowledge Base to identify processing needs...
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Analysis Failed</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Analysis
        </h3>
        <p className="text-gray-600">
          Configure your AI processing options
        </p>
      </div>

      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.needsEmbedding}</div>
              <div className="text-sm text-gray-600">Need Vectors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.needsAIAnalysis}</div>
              <div className="text-sm text-gray-600">Need AI Analysis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.total - stats.needsEmbedding - stats.needsAIAnalysis + Math.min(stats.needsEmbedding, stats.needsAIAnalysis)}
              </div>
              <div className="text-sm text-gray-600">Already Processed</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Processing Options
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.includeEmbeddings}
                onChange={(e) => setConfig(prev => ({ ...prev, includeEmbeddings: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Generate Vector Embeddings</div>
                <div className="text-sm text-gray-600">Enable semantic search and similarity matching</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.includeAIAnalysis}
                onChange={(e) => setConfig(prev => ({ ...prev, includeAIAnalysis: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">AI Content Analysis</div>
                <div className="text-sm text-gray-600">Summaries, topics, entities, sentiment analysis</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.includeAiTags}
                onChange={(e) => setConfig(prev => ({ ...prev, includeAiTags: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Generate AI Tags</div>
                <div className="text-sm text-gray-600">Automatically create and apply relevant tags</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.forceReprocess}
                onChange={(e) => setConfig(prev => ({ ...prev, forceReprocess: e.target.checked }))}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Force Reprocess</div>
                <div className="text-sm text-gray-600">Re-analyze all documents, even processed ones.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            Organize AI-processed documents in a dedicated folder
          </h4>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.createFolder}
                onChange={(e) => setConfig(prev => ({ ...prev, createFolder: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="font-medium text-gray-900">Create a new folder for processed documents</div>
            </label>
            
            {config.createFolder && (
              <div className="pl-7 space-y-3">
                <div>
                  <label htmlFor="folderName" className="text-sm font-medium text-gray-700 block mb-1">Folder Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="folderName"
                      value={config.folderName}
                      onChange={(e) => setConfig(prev => ({ ...prev, folderName: e.target.value }))}
                      className="flex-grow p-2 border rounded-md"
                    />
                    <button 
                      onClick={() => { /* This should ideally check for existence and create */ }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      + Create
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="parentFolder" className="text-sm font-medium text-gray-700 block mb-1">Parent Folder (Optional)</label>
                  <select
                    id="parentFolder"
                    value={config.selectedFolderId || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, selectedFolderId: e.target.value || undefined }))}
                    className="w-full p-2 border rounded-md bg-white"
                  >
                    <option value="">Root Level</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Folder Preview:
                  </p>
                  <p className="text-gray-600 ml-6">
                    {config.selectedFolderId 
                      ? `${folders.find(f => f.id === config.selectedFolderId)?.name || '...'} / `
                      : 'Root / '
                    }
                    <strong>{config.folderName}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Advanced Settings
          </h4>
          <label htmlFor="concurrency" className="text-sm font-medium text-gray-700 block mb-1">
            Concurrency: {config.concurrency} parallel tasks
          </label>
          <input
            id="concurrency"
            type="range"
            min="1"
            max="10"
            value={config.concurrency}
            onChange={(e) => setConfig(prev => ({ ...prev, concurrency: parseInt(e.target.value, 10) }))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={isPageContext ? () => navigate(-1) : onClose}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          {isPageContext ? 'Back' : 'Cancel'}
        </button>
        <button
          onClick={startProcessing}
          disabled={!stats || processing || (!config.includeAIAnalysis && !config.includeEmbeddings)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Processing
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Processing in Progress...
      </h3>
      
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div 
          className="bg-blue-600 h-4 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-gray-600">
        <p className="font-medium">{Math.round(progress)}% Complete</p>
        {currentDocument && (
          <p className="text-sm truncate mt-2">
            <span className="font-semibold">Current:</span> {currentDocument}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setPaused(!paused)}
          className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2"
        >
          {paused ? <Play className="w-4 h-4"/> : <Pause className="w-4 h-4" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to cancel the processing?')) {
              // This should ideally have a more robust cancellation mechanism
              setProcessing(false);
              setCurrentStep('configure');
            }
          }}
          className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Processing Complete
      </h3>
      
      {result && (
        <div className="bg-gray-50 border rounded-lg p-4 text-left">
          <p className="text-gray-700 mb-4">{result.summary}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl font-bold text-green-600">{result.stats.processed}</div>
              <div className="text-sm text-gray-600">Documents Processed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{result.errors.length}</div>
              <div className="text-sm text-gray-600">Errors Encountered</div>
            </div>
          </div>
          
          {result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Error Details:</h4>
              <ul className="text-xs text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4">
        {isPageContext ? (
          <>
            <Button
              onClick={() => navigate('/knowledge')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Knowledge Base
            </Button>
            <Button
              onClick={() => {
                setCurrentStep('analyze');
                setResult(null);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Process More Documents
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setCurrentStep('analyze');
                setResult(null);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Run Again
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const Stepper = () => (
    <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base mb-8">
        <li className={cn("flex md:w-full items-center", currentStep === 'analyze' || currentStep === 'configure' || currentStep === 'processing' || currentStep === 'complete' ? 'text-blue-600 dark:text-blue-500' : '')}>
            <span className="flex items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                <span className="flex items-center sm:after:content-['/'] sm:after:mx-2 sm:after:text-gray-200 dark:sm:after:text-gray-500">
                  <Bot className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                  Analyze
                </span>
            </span>
        </li>
        <li className={cn("flex md:w-full items-center", currentStep === 'configure' || currentStep === 'processing' || currentStep === 'complete' ? 'text-blue-600 dark:text-blue-500' : '')}>
            <span className="flex items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                <span className="flex items-center sm:after:content-['/'] sm:after:mx-2 sm:after:text-gray-200 dark:sm:after:text-gray-500">
                  <Settings className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                  Configure
                </span>
            </span>
        </li>
        <li className={cn("flex md:w-full items-center", currentStep === 'processing' || currentStep === 'complete' ? 'text-blue-600 dark:text-blue-500' : '')}>
            <span className="flex items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                <span className="flex items-center sm:after:content-['/'] sm:after:mx-2 sm:after:text-gray-200 dark:sm:after:text-gray-500">
                  <Zap className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                  Process
                </span>
            </span>
        </li>
        <li className={cn("flex items-center", currentStep === 'complete' ? 'text-blue-600 dark:text-blue-500' : '')}>
            <CheckCircle className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
            Complete
        </li>
    </ol>
  );

  // Remove the main modal wrapper if isPageContext is true
  if (isPageContext) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <Stepper />
        {currentStep === 'analyze' && renderAnalyzeStep()}
        {currentStep === 'configure' && renderConfigureStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    );
  }

  // Render different UI based on context - page or modal
  return (
    <div className={isPageContext 
      ? "container mx-auto p-4" 
      : "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    }>
      <div className={isPageContext 
        ? "bg-white dark:bg-slate-800 rounded-xl shadow-md w-full" 
        : "bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full"
      }>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                AI Processing & Vectorization
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Enhance your documents with intelligent analysis and semantic search
              </p>
            </div>
            {isPageContext ? (
              <Button
                variant="outline"
                onClick={() => navigate('/knowledge')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Knowledge Base
              </Button>
            ) : (
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {"×"}
              </button>
            )}
          </div>
          
          <Stepper />

          <div className="min-h-[200px] flex items-center justify-center">
            {currentStep === 'analyze' && renderAnalyzeStep()}
            {currentStep === 'configure' && renderConfigureStep()}
            {currentStep === 'processing' && renderProcessingStep()}
            {currentStep === 'complete' && renderCompleteStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export a memoized version of the component to prevent unnecessary rerenders
export const BatchAIProcessor = React.memo(BatchAIProcessorComponent);