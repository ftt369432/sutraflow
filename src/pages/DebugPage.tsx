import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { EmailDebugPanel } from '../components/debug/EmailDebugPanel';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, Settings } from 'lucide-react';

export function DebugPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/email')}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Email
              </Button>
              <div className="flex items-center gap-2">
                <Bug className="h-6 w-6 text-orange-500" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Debug Panel
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Development Tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email System Debug Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This debug panel provides tools for testing email functionality, managing teams, 
                and diagnosing system issues. Use these tools to troubleshoot problems with 
                email authentication, account management, and team configurations.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This page is only available in development mode. 
                  Debug tools will not be accessible in production.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Panel Component */}
        <EmailDebugPanel />
      </div>
    </div>
  );
}

export default DebugPage;
