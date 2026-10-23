import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  FolderOpen, 
  Link,
  RefreshCw,
  Wrench 
} from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';

// Legal Eagle assistant ID
const LEGAL_ASSISTANT_ID = '6060b777-66f1-42c9-aa5c-80c91145a9c8';

// Keywords to identify legal documents
const LEGAL_KEYWORDS = [
  'wcab', 'workers compensation', 'labor code', 'opinion and order',
  'petition for reconsideration', 'decision after reconsideration',
  'applicant', 'defendant', 'workers comp', 'case no', 'adj',
  'appeal', 'trial brief', 'adjudication', 'hearing',
  'verdeja', 'rebollo', 'natalie', 'medvin', 'juarez', 'osuna',
  'nava', 'young', 'lee', 'grosch', 'ledezma', 'luque',
  'hernandez', 'alcaraz', 'costa', 'hardy', 'petty',
  'gilliland', 'moreno', 'cuevas', 'silva',
  'brief', 'motion', 'petition', 'application', 'order',
  'decision', 'opinion', 'reconsideration', 'grant',
  'deny', 'award', 'compensation', 'disability'
];

interface DocumentAssignmentToolsProps {
  className?: string;
}

export function DocumentAssignmentTools({ className }: DocumentAssignmentToolsProps) {
  const { documents, folders, addFolder, moveDocument } = useKnowledgeBaseStore();
  const { getAssistantById, assignFolderToAssistant, getAssistantFolders } = useAssistantStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Check if document is legal
  const isLegalDocument = (doc: any): boolean => {
    const title = (doc.metadata?.title || doc.title || '').toLowerCase();
    const content = doc.content.toLowerCase();
    
    return LEGAL_KEYWORDS.some(keyword => 
      title.includes(keyword) || content.includes(keyword)
    );
  };

  // Get current status
  const getCurrentStatus = () => {
    const assistant = getAssistantById(LEGAL_ASSISTANT_ID);
    const assignedFolders = getAssistantFolders(LEGAL_ASSISTANT_ID);
    const legalDocs = documents.filter(doc => isLegalDocument(doc));
    const linkedLegalDocs = legalDocs.filter(doc => 
      doc.folderId && assignedFolders.includes(doc.folderId)
    );

    return {
      assistantFound: !!assistant,
      assistantName: assistant?.name || 'Not found',
      assignedFolders: assignedFolders.length,
      totalLegalDocs: legalDocs.length,
      linkedLegalDocs: linkedLegalDocs.length,
      unlinkeddocs: legalDocs.length - linkedLegalDocs.length
    };
  };

  const currentStatus = getCurrentStatus();

  // Main fix function
  const handleFixAssignments = async () => {
    setIsProcessing(true);
    setStatus('idle');
    setResults(null);

    try {
      // Step 1: Verify assistant exists
      const assistant = getAssistantById(LEGAL_ASSISTANT_ID);
      if (!assistant) {
        throw new Error('Legal Eagle assistant not found');
      }

      // Step 2: Create or find legal folder
      let legalFolder = folders.find(folder => 
        folder.name.toLowerCase().includes('legal') || 
        folder.name.toLowerCase().includes('workers') ||
        folder.name.toLowerCase().includes('comp') ||
        folder.name.toLowerCase().includes('wcab')
      );

      if (!legalFolder) {
        const newFolderId = `legal-docs-${Date.now()}`;
        legalFolder = {
          id: newFolderId,
          name: 'Legal Documents',
          description: 'Legal cases, decisions, and workers compensation documents',
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null
        };
        
        addFolder(legalFolder);
      }

      // Step 3: Assign folder to assistant if needed
      const assignedFolders = getAssistantFolders(LEGAL_ASSISTANT_ID);
      if (!assignedFolders.includes(legalFolder.id)) {
        assignFolderToAssistant(LEGAL_ASSISTANT_ID, legalFolder.id);
      }

      // Step 4: Move legal documents
      const legalDocuments = documents.filter(doc => isLegalDocument(doc));
      const documentsToMove = legalDocuments.filter(doc => doc.folderId !== legalFolder.id);
      
      let movedCount = 0;
      for (const doc of documentsToMove) {
        try {
          moveDocument(doc.id, legalFolder.id);
          movedCount++;
        } catch (error) {
          console.error(`Error moving document ${doc.id}:`, error);
        }
      }

      setResults({
        totalLegalDocs: legalDocuments.length,
        movedDocuments: movedCount,
        legalFolderId: legalFolder.id,
        legalFolderName: legalFolder.name
      });
      
      setStatus('success');

    } catch (error) {
      console.error('Error fixing assignments:', error);
      setResults({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Chat References Fix</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          This tool fixes the issue where AI chat references aren't showing up at the bottom of conversations.
          It assigns legal documents to the Legal Eagle assistant's folder so they can be properly referenced.
        </p>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Current Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {currentStatus.assistantFound ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Assistant: {currentStatus.assistantName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-500" />
              <span>Assigned Folders: {currentStatus.assignedFolders}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>Legal Documents: {currentStatus.totalLegalDocs}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {currentStatus.unlinkeddocs === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span>Linked: {currentStatus.linkedLegalDocs}/{currentStatus.totalLegalDocs}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleFixAssignments}
            disabled={isProcessing || currentStatus.unlinkeddocs === 0}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Fix Document Assignments'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className={`rounded-lg p-4 ${
            status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {status === 'success' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-green-800">Fix Applied Successfully!</h4>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Processed {results.totalLegalDocs} legal documents</p>
                  <p>• Moved {results.movedDocuments} documents to "{results.legalFolderName}"</p>
                  <p>• Documents are now linked to Legal Eagle assistant</p>
                  <p className="font-medium mt-2">✨ AI chat references should now work properly!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Try asking about "Verdeja case" or other legal matters to test the fix.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium text-red-800">Fix Failed</h4>
                </div>
                <p className="text-sm text-red-700">{results.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">How This Fix Works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Identifies legal documents using keywords (WCAB, workers comp, case names, etc.)</li>
            <li>• Creates or finds a "Legal Documents" folder</li>
            <li>• Assigns the folder to the Legal Eagle assistant</li>
            <li>• Moves all legal documents to the assigned folder</li>
            <li>• Enables AI to reference these documents in chat conversations</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
