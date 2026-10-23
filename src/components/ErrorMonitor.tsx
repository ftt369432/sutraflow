import React, { useState, useEffect } from 'react';
import { errorRecoverySystem, ErrorInfo } from '../services/ErrorRecoverySystem';

interface ErrorMonitorProps {
  showResolved?: boolean;
  maxErrors?: number;
  autoHide?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ErrorMonitor: React.FC<ErrorMonitorProps> = ({
  showResolved = false,
  maxErrors = 10,
  autoHide = true,
  position = 'top-right'
}) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateErrors = () => {
      const allErrors = showResolved 
        ? errorRecoverySystem.getErrors() 
        : errorRecoverySystem.getUnresolvedErrors();
      setErrors(allErrors.slice(0, maxErrors));
    };

    // Initial load
    updateErrors();

    // Listen for new errors
    const unsubscribe = errorRecoverySystem.onError((error) => {
      setLastErrorTime(new Date());
      updateErrors();
      
      // Auto-expand on new critical errors
      if (error.severity === 'critical' || error.severity === 'high') {
        setIsExpanded(true);
      }
    });

    // Update every 30 seconds
    const interval = setInterval(updateErrors, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [showResolved, maxErrors]);

  // Auto-hide after 10 seconds if enabled
  useEffect(() => {
    if (autoHide && lastErrorTime && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, lastErrorTime, isExpanded]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auth': return '🔐';
      case 'storage': return '💾';
      case 'quota': return '📦';
      case 'api': return '🌐';
      case 'network': return '📡';
      default: return '⚠️';
    }
  };

  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'top-right': return `${base} top-4 right-4`;
      case 'top-left': return `${base} top-4 left-4`;
      case 'bottom-right': return `${base} bottom-4 right-4`;
      case 'bottom-left': return `${base} bottom-4 left-4`;
      default: return `${base} top-4 right-4`;
    }
  };

  const handleRetryError = async (errorId: string) => {
    console.log(`[ErrorMonitor] Retrying error ${errorId}`);
    const success = await errorRecoverySystem.attemptRecovery(errorId);
    if (success) {
      // Update the errors list
      const allErrors = showResolved 
        ? errorRecoverySystem.getErrors() 
        : errorRecoverySystem.getUnresolvedErrors();
      setErrors(allErrors.slice(0, maxErrors));
    }
  };

  const handleDismissError = (errorId: string) => {
    errorRecoverySystem.markResolved(errorId);
    const allErrors = showResolved 
      ? errorRecoverySystem.getErrors() 
      : errorRecoverySystem.getUnresolvedErrors();
    setErrors(allErrors.slice(0, maxErrors));
  };

  const unresolvedCount = errors.filter(e => !e.resolved).length;

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      {/* Error indicator */}
      <div 
        className={`
          cursor-pointer transition-all duration-200 
          ${unresolvedCount > 0 ? 'animate-pulse' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border
          ${unresolvedCount > 0 
            ? 'bg-red-100 border-red-300 text-red-700' 
            : 'bg-green-100 border-green-300 text-green-700'
          }
        `}>
          <span className="text-lg">
            {unresolvedCount > 0 ? '⚠️' : '✅'}
          </span>
          <span className="font-medium">
            {unresolvedCount > 0 
              ? `${unresolvedCount} Error${unresolvedCount > 1 ? 's' : ''}`
              : 'All Clear'
            }
          </span>
          <span className={`
            transform transition-transform duration-200
            ${isExpanded ? 'rotate-180' : ''}
          `}>
            ▼
          </span>
        </div>
      </div>

      {/* Error details panel */}
      {isExpanded && (
        <div className="mt-2 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Error Monitor</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {errors.map((error) => (
              <div 
                key={error.id}
                className={`
                  p-3 border-b border-gray-100 last:border-b-0
                  ${error.resolved ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(error.type)}</span>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded border
                        ${getSeverityColor(error.severity)}
                      `}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {error.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 mb-1">
                      {error.message}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {error.timestamp.toLocaleTimeString()} • 
                      Attempts: {error.attempts}/{error.maxAttempts}
                      {error.resolved && ' • ✅ Resolved'}
                    </div>

                    {error.context && Object.keys(error.context).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Context
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1 ml-3">
                    {!error.resolved && error.attempts < error.maxAttempts && (
                      <button
                        onClick={() => handleRetryError(error.id)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Retry
                      </button>
                    )}
                    
                    {!error.resolved && (
                      <button
                        onClick={() => handleDismissError(error.id)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No errors to display</p>
            </div>
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>
                Showing {errors.length} of {
                  showResolved 
                    ? errorRecoverySystem.getErrors().length 
                    : errorRecoverySystem.getUnresolvedErrors().length
                } errors
              </span>
              <button
                onClick={() => errorRecoverySystem.clearOldErrors()}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear Old
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitor;
