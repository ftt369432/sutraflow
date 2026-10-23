import React from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../ui/Button';

interface QualityMetric {
  name: string;
  value: number;
  target: number;
  description: string;
}

interface DataQualityProps {
  metrics?: QualityMetric[];
  className?: string;
}

export function DataQualityAssessment({ metrics, className = "" }: DataQualityProps) {
  // Default mock metrics if none provided
  const qualityMetrics: QualityMetric[] = metrics || [
    { 
      name: 'Embedding Quality', 
      value: 92, 
      target: 90, 
      description: 'Quality of vector embeddings based on semantic coherence'
    },
    { 
      name: 'Content Extraction', 
      value: 97, 
      target: 95, 
      description: 'Effectiveness of extracting text content from documents'
    },
    { 
      name: 'OCR Accuracy', 
      value: 84, 
      target: 90, 
      description: 'Accuracy of Optical Character Recognition for images and scanned documents'
    },
    { 
      name: 'Metadata Completeness', 
      value: 90, 
      target: 85, 
      description: 'Completeness of document metadata fields (title, author, date)'
    },
    { 
      name: 'Processing Completion Rate', 
      value: 99, 
      target: 99, 
      description: 'Percentage of documents that complete the entire processing pipeline'
    }
  ];
  
  const getMetricStatus = (metric: QualityMetric) => {
    if (metric.value >= metric.target) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        color: 'text-green-600',
        progressColor: 'bg-green-500',
        message: 'Meeting target'
      };
    } else if (metric.value >= metric.target * 0.9) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        color: 'text-amber-600',
        progressColor: 'bg-amber-500',
        message: 'Near target'
      };
    } else {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        color: 'text-red-600',
        progressColor: 'bg-red-500',
        message: 'Below target'
      };
    }
  };
  
  // Calculate overall quality score as average of all metrics
  const overallScore = Math.round(
    qualityMetrics.reduce((sum, metric) => sum + metric.value, 0) / qualityMetrics.length
  );
  
  // Count issues that need attention
  const issuesCount = qualityMetrics.filter(m => m.value < m.target).length;
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-700">Data Quality Assessment</h4>
          <p className="text-sm text-slate-500">Monitor and improve document processing quality</p>
        </div>
        <div className="flex items-center">
          <div className="text-3xl font-bold text-blue-600 mr-2">{overallScore}%</div>
          <div className="text-sm text-slate-500">Overall<br/>Quality</div>
        </div>
      </div>
      
      {issuesCount > 0 && (
        <div className="mb-6 p-3 bg-amber-50 rounded-md border border-amber-200">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-amber-800">Quality Issues Detected</h5>
              <p className="text-xs text-amber-700 mt-1">
                {issuesCount} metric{issuesCount > 1 ? 's' : ''} below target threshold. 
                Review recommendations and consider adjusting processing parameters.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {qualityMetrics.map((metric, index) => {
          const status = getMetricStatus(metric);
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  {status.icon}
                  <span className="text-sm font-medium ml-2">{metric.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${status.color}`}>{metric.value}%</span>
                  <span className="text-xs text-slate-400 ml-1">/ {metric.target}%</span>
                </div>
              </div>
              <div className="relative mt-1">
                <Progress 
                  value={metric.value} 
                  className={`h-2 bg-slate-100 ${status.progressColor}`}
                />
                <div 
                  className="absolute top-0 h-4 w-0.5 bg-slate-300" 
                  style={{ left: `${metric.target}%`, marginTop: '-4px' }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex justify-between">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <Button variant="default" size="sm">
            Generate Quality Report
          </Button>
        </div>
      </div>
    </Card>
  );
}
