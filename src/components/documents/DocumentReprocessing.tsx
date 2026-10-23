import React, { useState } from 'react';
import { useLearningSystem } from '../../hooks/useLearningSystem';
import { AIDocument } from '../../types/ai';

interface DocumentReprocessingProps {
  assistantId: string;
  documents: AIDocument[];
}

/**
 * Component for document reprocessing functionality
 * Shows reprocessing status and allows triggering manual reprocessing
 */
const DocumentReprocessing: React.FC<DocumentReprocessingProps> = ({ assistantId, documents }) => {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    processed?: number;
    skipped?: number;
    errors?: string[];
  }>({});

  // Use the learning system hook
  const { 
    reprocessDocuments, 
    isProcessing, 
    insights 
  } = useLearningSystem(assistantId);

  // Handle reprocessing documents
  const handleReprocessDocuments = async (deduplicateContent: boolean = true) => {
    setIsReprocessing(true);
    try {
      const reprocessResult = await reprocessDocuments(documents, {
        forceReprocess: true,
        deduplicateContent,
      });
      setResult(reprocessResult);
    } catch (error) {
      console.error('Error reprocessing documents:', error);
      setResult({
        success: false,
        errors: [`Error reprocessing documents: ${error}`]
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <div className="document-reprocessing">
      <div className="status-section">
        <h3>Document Processing Status</h3>
        <div className="status-info">
          <p>
            <strong>Last processed:</strong> {insights.lastProcessedAt 
              ? new Date(insights.lastProcessedAt).toLocaleString() 
              : 'Never'}
          </p>
          <p>
            <strong>Documents tracked:</strong> {insights.documentsTracked}
          </p>
          <p>
            <strong>Reprocessing needed:</strong> {insights.reprocessingNeeded ? 'Yes' : 'No'}
          </p>
          {(insights.reprocessedDocuments ?? 0) > 0 && (
            <p>
              <strong>Documents reprocessed:</strong> {insights.reprocessedDocuments}
            </p>
          )}
        </div>
      </div>

      <div className="actions-section">
        <button
          onClick={() => handleReprocessDocuments(true)}
          disabled={isReprocessing || isProcessing}
          className="primary-button"
        >
          {isReprocessing ? 'Reprocessing...' : 'Reprocess Documents'}
        </button>
        
        <button
          onClick={() => handleReprocessDocuments(false)}
          disabled={isReprocessing || isProcessing}
          className="secondary-button"
        >
          Reprocess (Include Duplicates)
        </button>
      </div>

      {result.success !== undefined && (
        <div className={`result-section ${result.success ? 'success' : 'error'}`}>
          <h4>{result.success ? 'Reprocessing Complete' : 'Reprocessing Issues'}</h4>
          {result.processed !== undefined && (
            <p>Processed {result.processed} documents</p>
          )}
          {result.skipped !== undefined && result.skipped > 0 && (
            <p>Skipped {result.skipped} duplicate documents</p>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="error-list">
              <p>Errors:</p>
              <ul>
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentReprocessing;
