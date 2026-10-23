import React from 'react';
import { Card } from '../ui/Card';

interface DocumentTypeData {
  type: string;
  percentage: number;
  color: string;
}

interface DocumentTypeDistributionProps {
  data?: DocumentTypeData[];
  className?: string;
}

export function DocumentTypeDistribution({ 
  data, 
  className = ""
}: DocumentTypeDistributionProps) {
  // Default mock data if none is provided
  const typeData = data || [
    { type: 'PDF', percentage: 68, color: 'bg-blue-500' },
    { type: 'DOCX', percentage: 15, color: 'bg-indigo-500' },
    { type: 'TXT', percentage: 10, color: 'bg-green-500' },
    { type: 'HTML', percentage: 5, color: 'bg-orange-500' },
    { type: 'Other', percentage: 2, color: 'bg-purple-500' }
  ];
  
  return (
    <Card className={`p-6 ${className}`}>
      <h4 className="text-lg font-semibold text-slate-700 mb-4">Document Type Distribution</h4>
      
      <div className="space-y-4">
        {typeData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                <span className="text-sm font-medium">{item.type}</span>
              </div>
              <span className="text-sm font-medium">{item.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className={`${item.color} h-2 rounded-full`} 
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Documents:</span>
          <span className="font-semibold">1,352</span>
        </div>
      </div>
    </Card>
  );
}
