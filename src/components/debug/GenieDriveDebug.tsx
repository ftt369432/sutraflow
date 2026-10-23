import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useAiDriveService } from '../../hooks/useAiDriveService';
import { RefreshCw, Database, CheckCircle, XCircle, Search } from 'lucide-react';

export const GenieDriveDebug: React.FC = () => {
  const { user } = useAuth();
  const aiDriveService = useAiDriveService();
  const [debugResults, setDebugResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDatabaseCheck = async () => {
    if (!aiDriveService || !user?.id) {
      setDebugResults(prev => ({
        ...prev,
        dbCheck: { success: false, message: 'No service or user available' }
      }));
      return;
    }

    try {
      setIsLoading(true);
      const files = await aiDriveService.listFiles(user.id, null);
      
      setDebugResults(prev => ({
        ...prev,
        dbCheck: { 
          success: true, 
          message: `Database connected. Found ${files.length} items in root.`,
          data: files
        }
      }));
    } catch (error) {
      console.error('Database check failed:', error);
      setDebugResults(prev => ({
        ...prev,
        dbCheck: { 
          success: false, 
          message: 'Database check failed', 
          error 
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const searchForFile = async (fileName: string = 'test2') => {
    if (!aiDriveService || !user?.id) {
      setDebugResults(prev => ({
        ...prev,
        fileSearch: { success: false, message: 'No service or user available' }
      }));
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await aiDriveService.searchFiles(user.id, fileName);
      
      setDebugResults(prev => ({
        ...prev,
        fileSearch: { 
          success: true, 
          message: `Search for "${fileName}" returned ${searchResults.length} results`,
          data: searchResults
        }
      }));
    } catch (error) {
      console.error('File search failed:', error);
      setDebugResults(prev => ({
        ...prev,
        fileSearch: { 
          success: false, 
          message: 'File search failed', 
          error 
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllFiles = async () => {
    if (!aiDriveService || !user?.id) {
      setDebugResults(prev => ({
        ...prev,
        allFiles: { success: false, message: 'No service or user available' }
      }));
      return;
    }

    try {
      setIsLoading(true);
      const allFiles = await aiDriveService.listFiles(user.id, null, { include_trashed: true });
      const nonTrashedFiles = await aiDriveService.listFiles(user.id, null, { include_trashed: false });
      
      setDebugResults(prev => ({
        ...prev,
        allFiles: { 
          success: true, 
          message: `Found ${allFiles.length} total files (${nonTrashedFiles.length} non-trashed)`,
          data: { allFiles, nonTrashedFiles, trashedCount: allFiles.length - nonTrashedFiles.length }
        }
      }));
    } catch (error) {
      console.error('All files check failed:', error);
      setDebugResults(prev => ({
        ...prev,
        allFiles: { 
          success: false, 
          message: 'All files check failed', 
          error 
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    await runDatabaseCheck();
    setTimeout(async () => {
      await searchForFile('test2');
      setTimeout(async () => {
        await checkAllFiles();
      }, 1000);
    }, 1000);
  };

  const getStatusIcon = (result?: any) => {
    if (!result) return <Database className="w-4 h-4 text-gray-400" />;
    if (result.success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>AI Drive Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to debug AI Drive.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Drive Debug Dashboard
            <Button onClick={runAllTests} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run All Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Information</h3>
            <p>Email: {user.email}</p>
            <p>User ID: {user.id}</p>
            <p>Service Available: {aiDriveService ? '✅ Yes' : '❌ No'}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Debug Results</h3>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(debugResults.dbCheck)}
                <div>
                  <p className="font-medium">Database Connection</p>
                  <p className="text-sm text-muted-foreground">
                    {debugResults.dbCheck?.message || 'Not tested'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={runDatabaseCheck} 
                disabled={isLoading}
              >
                Test DB
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(debugResults.fileSearch)}
                <div>
                  <p className="font-medium">Search for "test2"</p>
                  <p className="text-sm text-muted-foreground">
                    {debugResults.fileSearch?.message || 'Not tested'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => searchForFile('test2')} 
                disabled={isLoading}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(debugResults.allFiles)}
                <div>
                  <p className="font-medium">All Files Check</p>
                  <p className="text-sm text-muted-foreground">
                    {debugResults.allFiles?.message || 'Not tested'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkAllFiles} 
                disabled={isLoading}
              >
                Check All
              </Button>
            </div>
          </div>

          {Object.keys(debugResults).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Detailed Results</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenieDriveDebug; 