import React from 'react';
import { DocumentStructureService, DocumentStructure } from '../../services/DocumentStructureService';
import { CheckCircle, XCircle, FileText, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface StructureValidatorProps {
  content: string;
  onStructureChange: (structure: DocumentStructure) => void;
  className?: string;
}

export const StructureValidator: React.FC<StructureValidatorProps> = ({ 
  content, 
  onStructureChange,
  className 
}) => {
  const [structure, setStructure] = React.useState<DocumentStructure | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  React.useEffect(() => {
    if (content && content.length > 50) {
      console.log('🔍 VALIDATOR: Analyzing content structure...');
      const analyzed = DocumentStructureService.analyzeDocumentStructure(content);
      setStructure(analyzed);
      onStructureChange(analyzed);
      console.log('📋 VALIDATOR: Structure analysis complete:', analyzed);
    }
  }, [content, onStructureChange]);
  
  if (!structure || content.length < 50) return null;
  
  const getIndicator = (hasFeature: boolean) => (
    hasFeature ? (
      <CheckCircle className="h-3 w-3 text-green-600" />
    ) : (
      <XCircle className="h-3 w-3 text-gray-400" />
    )
  );
  
  const structureScore = [
    structure.formatting.hasStatementOfFacts,
    structure.formatting.hasArguments,
    structure.formatting.hasInstructions,
    structure.formatting.hasCitations
  ].filter(Boolean).length;
  
  const getScoreColor = (score: number) => {
    if (score >= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  return (
    <div className={cn("structure-validator border rounded-lg mb-4", getScoreColor(structureScore), className)}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h4 className="font-semibold text-sm">Document Structure Analysis</h4>
          <span className="text-xs bg-white px-2 py-1 rounded border">
            Score: {structureScore}/4
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
          title={isCollapsed ? "Expand analysis" : "Collapse analysis"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-xs">
            <strong>Title:</strong> {structure.title}
          </div>
          
          <div className="text-xs">
            <strong>Sections:</strong> {structure.sections.length} identified
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {getIndicator(structure.formatting.hasStatementOfFacts)}
              <span>Statement of Facts</span>
            </div>
            
            <div className="flex items-center gap-1">
              {getIndicator(structure.formatting.hasArguments)}
              <span>Legal Arguments</span>
            </div>
            
            <div className="flex items-center gap-1">
              {getIndicator(structure.formatting.hasInstructions)}
              <span>Fill-in Instructions</span>
            </div>
            
            <div className="flex items-center gap-1">
              {getIndicator(structure.formatting.hasCitations)}
              <span>Legal Citations</span>
            </div>
          </div>
          
          {structureScore < 2 && (
            <div className="flex items-center gap-1 text-xs mt-2 p-2 bg-white bg-opacity-50 rounded border">
              <AlertTriangle className="h-3 w-3" />
              <span>Consider adding more structural elements for a complete legal document</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StructureValidator;
