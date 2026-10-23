import React, { useState, useEffect } from 'react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  scanAllDocumentEmbeddings, 
  repairDocumentEmbeddings, 
  EmbeddingStatus 
} from '../../services/embeddingMonitorService';

/**
 * A component that helps users monitor and fix embedding issues in their knowledge base
 */
const EmbeddingHealthMonitor: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    missing: 0,
    invalid: 0
  });
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairResults, setRepairResults] = useState<string[]>([]);
  
  const documents = useKnowledgeBaseStore(state => state.documents);
  
  // Initial scan on component mount
  useEffect(() => {
    handleScan();
  }, [documents.length]); // Re-scan when document count changes
  
  const handleScan = async () => {
    setScanning(true);
    try {
      const results = await scanAllDocumentEmbeddings();
      setScanResults(results);
      
      // Calculate stats
      setStats({
        total: results.length,
        valid: results.filter(r => r.status === EmbeddingStatus.VALID).length,
        missing: results.filter(r => r.status === EmbeddingStatus.MISSING).length,
        invalid: results.filter(r => r.status === EmbeddingStatus.INVALID).length
      });
    } catch (error) {
      console.error('Error scanning document embeddings:', error);
    } finally {
      setScanning(false);
    }
  };
  
  const handleRepair = async () => {
    if (stats.missing === 0 && stats.invalid === 0) return;
    
    setRepairing(true);
    setRepairProgress(0);
    setRepairResults([]);
    
    try {
      const docsToRepair = scanResults
        .filter(r => r.status === EmbeddingStatus.MISSING || r.status === EmbeddingStatus.INVALID)
        .map(r => r.documentId);
      
      const repaired = await repairDocumentEmbeddings(
        docsToRepair,
        (current, total) => {
          setRepairProgress(Math.round((current / total) * 100));
        }
      );
      
      setRepairResults(repaired);
      
      // Re-scan to update stats
      await handleScan();
    } catch (error) {
      console.error('Error repairing document embeddings:', error);
    } finally {
      setRepairing(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Knowledge Base Embedding Health</CardTitle>
        <CardDescription>
          Monitor and repair document embeddings to ensure optimal semantic search
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Embedding Health Status</span>
            <span className="text-sm text-muted-foreground">
              {stats.valid} of {stats.total} documents have valid embeddings
            </span>
          </div>
          
          <Progress 
            value={(stats.valid / Math.max(stats.total, 1)) * 100} 
            className="h-2" 
          />
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="text-green-800 font-medium">Valid</div>
              <div className="text-2xl font-bold text-green-700">{stats.valid}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              <div className="text-yellow-800 font-medium">Missing</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.missing}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <div className="text-red-800 font-medium">Invalid</div>
              <div className="text-2xl font-bold text-red-700">{stats.invalid}</div>
            </div>
          </div>
        </div>
        
        {repairing && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Repair Progress</span>
              <span className="text-sm text-muted-foreground">{repairProgress}%</span>
            </div>
            <Progress value={repairProgress} className="h-2" />
          </div>
        )}
        
        {repairResults.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-green-800 font-medium">
              Successfully repaired {repairResults.length} documents
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning...' : 'Scan Documents'}
        </Button>
        
        <Button 
          variant="default"
          onClick={handleRepair}
          disabled={repairing || (stats.missing === 0 && stats.invalid === 0)}
        >
          {repairing ? 'Repairing...' : 'Repair All Issues'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmbeddingHealthMonitor;
