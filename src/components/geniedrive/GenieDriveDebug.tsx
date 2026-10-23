import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
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
      
      // Test database connection by listing files
      const files = await aiDriveService.listFiles(null);
      
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
      
      // Search for the specific file
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
      
      // Get all files for the user (including trashed)
      const allFiles = await aiDriveService.listFiles(null, { include_trashed: true });
      
      // Group by folder
      const filesByFolder = allFiles.reduce((acc, file) => {
        const folderId = file.parent_id || 'root';
        if (!acc[folderId]) acc[folderId] = [];
        acc[folderId].push(file);
        return acc;
      }, {} as Record<string, any[]>);
      
      setDebugResults(prev => ({
        ...prev,
        allFiles: { 
          success: true, 
          message: `Found ${allFiles.length} total files across ${Object.keys(filesByFolder).length} locations`,
          data: { allFiles, filesByFolder }
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

  const testUpload = async () => {
    if (!aiDriveService || !user?.id) {
      setDebugResults(prev => ({
        ...prev,
        testUpload: { success: false, message: 'No service or user available' }
      }));
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a test file
      const testContent = `Test file created at ${new Date().toISOString()}`;
      const testFile = new File([testContent], 'debug-test-file.txt', {
        type: 'text/plain'
      });
      
      const uploadedFile = await aiDriveService.uploadFile(testFile, null);
      
      setDebugResults(prev => ({
        ...prev,
        testUpload: { 
          success: true, 
          message: `Test file uploaded successfully: ${uploadedFile.name}`,
          data: uploadedFile
        }
      }));
    } catch (error) {
      console.error('Test upload failed:', error);
      setDebugResults(prev => ({
        ...prev,
        testUpload: { 
          success: false, 
          message: 'Test upload failed', 
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
          {/* User Info */}
          <div>
            <h3 className="font-semibold mb-2">User Information</h3>
            <p>Email: {user.email}</p>
            <p>User ID: {user.id}</p>
            <p>Service Available: {aiDriveService ? '✅ Yes' : '❌ No'}</p>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Debug Results</h3>
            
            {/* Database Check */}
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

            {/* File Search */}
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

            {/* All Files Check */}
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

            {/* Test Upload */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(debugResults.testUpload)}
                <div>
                  <p className="font-medium">Test Upload</p>
                  <p className="text-sm text-muted-foreground">
                    {debugResults.testUpload?.message || 'Not tested'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testUpload} 
                disabled={isLoading}
              >
                Test Upload
              </Button>
            </div>
          </div>

          {/* Detailed Results */}
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