import React, { useState } from 'react';
import { useEnhancedEmailCalendarIntegration } from '../../hooks/useEnhancedEmailCalendarIntegration';
import { IndustryType } from '../../types/autoCalendar.types';

/**
 * Auto Calendar Configuration Component
 * Provides UI for configuring the enhanced auto calendar engine
 */

interface AutoCalendarConfigProps {
  className?: string;
  onClose?: () => void;
  currentIndustry?: 'legal' | 'medical' | 'mortgage';
  onIndustryChange?: (industry: any) => void;
}

export const AutoCalendarConfig: React.FC<AutoCalendarConfigProps> = ({ 
  className = '', 
  onClose,
  currentIndustry,
  onIndustryChange 
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(currentIndustry || 'legal');
  const [testEmailContent, setTestEmailContent] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  const {
    switchIndustry,
    switchWorkflow,
    processEmailContent,
    getConfiguration,
    getProcessingStats,
    clearProcessingHistory,
    isProcessing,
    processingHistory,
    currentConfiguration
  } = useEnhancedEmailCalendarIntegration({
    industryType: selectedIndustry,
    enableAutoProcessing: true,
    minimumConfidence: 0.5
  });

  const handleIndustryChange = (industry: IndustryType) => {
    setSelectedIndustry(industry);
    switchIndustry(industry);
    onIndustryChange?.(industry);
  };

  const handleTestProcessing = async () => {
    if (!testEmailContent.trim()) return;

    try {
      const result = await processEmailContent(testEmailContent, testEmailSubject);
      setTestResults(result);
    } catch (error) {
      console.error('Test processing failed:', error);
      setTestResults({ error: error.message });
    }
  };

  const stats = getProcessingStats();

  return (
    <div className={`auto-calendar-config ${className}`}>
      <div className="config-header">
        <h3>🤖 Auto Calendar Configuration</h3>
        <p>Configure automated calendar event processing from emails</p>
      </div>

      {/* Industry Selection */}
      <div className="config-section">
        <h4>Industry Configuration</h4>
        <div className="industry-selector">
          <label>
            <input
              type="radio"
              value="legal"
              checked={selectedIndustry === 'legal'}
              onChange={(e) => handleIndustryChange(e.target.value as IndustryType)}
            />
            <span className="industry-option">
              ⚖️ Legal Practice
              <small>WCAB hearings, depositions, deadlines</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              value="medical"
              checked={selectedIndustry === 'medical'}
              onChange={(e) => handleIndustryChange(e.target.value as IndustryType)}
            />
            <span className="industry-option">
              🏥 Medical Practice
              <small>Appointments, surgeries, consultations</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              value="mortgage"
              checked={selectedIndustry === 'mortgage'}
              onChange={(e) => handleIndustryChange(e.target.value as IndustryType)}
            />
            <span className="industry-option">
              🏠 Mortgage Services
              <small>Closings, appraisals, inspections</small>
            </span>
          </label>
        </div>
      </div>

      {/* Current Configuration Display */}
      {currentConfiguration && (
        <div className="config-section">
          <h4>Current Configuration</h4>
          <div className="config-details">
            <div className="config-item">
              <strong>Industry:</strong> {currentConfiguration.currentIndustry}
            </div>
            <div className="config-item">
              <strong>Active Workflow:</strong> {currentConfiguration.activeWorkflow}
            </div>
            <div className="config-item">
              <strong>Search Terms:</strong> 
              <span className="term-counts">
                {currentConfiguration.searchTermsCount.primary} primary, 
                {currentConfiguration.searchTermsCount.secondary} secondary, 
                {currentConfiguration.searchTermsCount.eventTypes} event types
              </span>
            </div>
            <div className="config-item">
              <strong>Processing Rules:</strong> {currentConfiguration.rulesCount}
            </div>
            <div className="config-item">
              <strong>Reminder Templates:</strong> {currentConfiguration.reminderTemplatesCount}
            </div>
          </div>
        </div>
      )}

      {/* Test Processing */}
      <div className="config-section">
        <h4>Test Email Processing</h4>
        <div className="test-section">
          <div className="test-inputs">
            <input
              type="text"
              placeholder="Email Subject"
              value={testEmailSubject}
              onChange={(e) => setTestEmailSubject(e.target.value)}
              className="test-subject"
            />
            <textarea
              placeholder="Email Content (paste email content here to test processing)"
              value={testEmailContent}
              onChange={(e) => setTestEmailContent(e.target.value)}
              className="test-content"
              rows={6}
            />
            <button
              onClick={handleTestProcessing}
              disabled={isProcessing || !testEmailContent.trim()}
              className="test-button"
            >
              {isProcessing ? 'Processing...' : 'Test Processing'}
            </button>
          </div>

          {testResults && (
            <div className="test-results">
              <h5>Processing Results</h5>
              {testResults.error ? (
                <div className="error-result">
                  <strong>Error:</strong> {testResults.error}
                </div>
              ) : (
                <div className="success-result">
                  <div className="result-item">
                    <strong>Confidence:</strong> {(testResults.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="result-item">
                    <strong>Events Found:</strong> {testResults.events.length}
                  </div>
                  <div className="result-item">
                    <strong>Matched Terms:</strong> {testResults.matchedTerms.join(', ')}
                  </div>
                  <div className="result-item">
                    <strong>Applied Rules:</strong> {testResults.appliedRules.join(', ')}
                  </div>
                  <div className="result-item">
                    <strong>Processing Time:</strong> {testResults.processingTime}ms
                  </div>
                  
                  {testResults.events.length > 0 && (
                    <div className="extracted-events">
                      <h6>Extracted Events:</h6>
                      {testResults.events.map((event, index) => (
                        <div key={index} className="event-preview">
                          <div><strong>Title:</strong> {event.title}</div>
                          <div><strong>Date:</strong> {event.startDate?.toLocaleDateString()}</div>
                          <div><strong>Time:</strong> {event.startTime}</div>
                          <div><strong>Type:</strong> {event.eventType}</div>
                          {event.location && <div><strong>Location:</strong> {event.location}</div>}
                          {event.caseNumber && <div><strong>Case:</strong> {event.caseNumber}</div>}
                          {event.reminders && event.reminders.length > 0 && (
                            <div><strong>Reminders:</strong> {event.reminders.length} scheduled</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Processing Statistics */}
      <div className="config-section">
        <h4>Processing Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.totalProcessed}</div>
            <div className="stat-label">Total Processed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-label">Events Created</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.averageConfidence.toFixed(2)}</div>
            <div className="stat-label">Avg Confidence</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.averageProcessingTime.toFixed(0)}ms</div>
            <div className="stat-label">Avg Processing Time</div>
          </div>
        </div>
        
        {processingHistory.length > 0 && (
          <button
            onClick={clearProcessingHistory}
            className="clear-history-button"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Processing History */}
      {processingHistory.length > 0 && (
        <div className="config-section">
          <h4>Recent Processing History</h4>
          <div className="history-list">
            {processingHistory.slice(0, 5).map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-summary">
                  <span className="confidence-badge" 
                        style={{ 
                          backgroundColor: item.confidence > 0.7 ? '#4caf50' : 
                                         item.confidence > 0.4 ? '#ff9800' : '#f44336' 
                        }}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="events-count">{item.events.length} events</span>
                  <span className="processing-time">{item.processingTime}ms</span>
                </div>
                {item.matchedTerms.length > 0 && (
                  <div className="matched-terms">
                    <small>Matched: {item.matchedTerms.slice(0, 3).join(', ')}
                    {item.matchedTerms.length > 3 && '...'}</small>
                  </div>
                )}
                {item.errors && (
                  <div className="error-message">
                    <small>Error: {item.errors[0]}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .auto-calendar-config {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .config-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .config-header h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }

        .config-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .config-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }

        .config-section h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .industry-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .industry-selector label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          padding: 10px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .industry-selector label:hover {
          background-color: #e9ecef;
        }

        .industry-option {
          display: flex;
          flex-direction: column;
        }

        .industry-option small {
          color: #666;
          font-size: 12px;
          margin-top: 2px;
        }

        .config-details {
          display: grid;
          gap: 8px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .config-item:last-child {
          border-bottom: none;
        }

        .term-counts {
          font-size: 12px;
          color: #666;
        }

        .test-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .test-inputs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .test-subject, .test-content {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
        }

        .test-content {
          resize: vertical;
          min-height: 100px;
        }

        .test-button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .test-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .test-results {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .test-results h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .error-result {
          color: #dc3545;
          font-size: 14px;
        }

        .success-result {
          font-size: 14px;
        }

        .result-item {
          margin-bottom: 8px;
          padding: 4px 0;
        }

        .extracted-events {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
        }

        .event-preview {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .event-preview div {
          margin-bottom: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .stat-item {
          text-align: center;
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .clear-history-button {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .history-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .history-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }

        .confidence-badge {
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
          font-size: 11px;
          font-weight: bold;
        }

        .events-count {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          color: #333;
        }

        .processing-time {
          font-size: 11px;
          color: #666;
        }

        .matched-terms {
          font-size: 11px;
          color: #666;
        }

        .error-message {
          color: #dc3545;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};
