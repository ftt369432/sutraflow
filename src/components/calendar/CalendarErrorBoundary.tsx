import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface CalendarErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface CalendarErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 🛡️ Calendar Error Boundary
 * 
 * Catches and handles errors in calendar-related components gracefully.
 * Provides fallback UI and error recovery options.
 */
export class CalendarErrorBoundary extends Component<CalendarErrorBoundaryProps, CalendarErrorBoundaryState> {
  constructor(props: CalendarErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CalendarErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Calendar Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services like Sentry here
      console.error('Production calendar error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Calendar Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2">
                Something went wrong with the calendar functionality. This error has been logged.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development Mode)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-xs mt-1 overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Common solutions:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check your internet connection</li>
                <li>Clear your browser cache and reload</li>
                <li>Try disabling browser extensions</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 🎯 Functional wrapper for easier usage with hooks
 */
export const withCalendarErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <CalendarErrorBoundary fallback={errorFallback}>
      <Component {...props} ref={ref} />
    </CalendarErrorBoundary>
  ));
};

export default CalendarErrorBoundary;
