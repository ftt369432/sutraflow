import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AI Component Error:', error, errorInfo);
    // Here you could send error reports to your error tracking service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-medium">AI Service Error</h3>
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {this.state.error?.message || 'An error occurred while processing your request.'}
          </p>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 