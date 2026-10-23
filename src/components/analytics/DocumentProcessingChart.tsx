import React from 'react';
import { Card } from '../ui/Card';

interface ChartProps {
  title: string;
  description?: string;
  className?: string;
  height?: number;
}

// This is a placeholder component that would use a real chart library in production
// like Chart.js, Recharts, or similar
export function DocumentProcessingChart({ 
  title, 
  description,
  className = "",
  height = 300
}: ChartProps) {
  // Mock data for the chart - in a real app, this would be passed in as props
  const mockData = [
    { date: '2025-06-30', processed: 42, failed: 2 },
    { date: '2025-07-01', processed: 53, failed: 1 },
    { date: '2025-07-02', processed: 62, failed: 3 },
    { date: '2025-07-03', processed: 48, failed: 2 },
    { date: '2025-07-04', processed: 57, failed: 1 },
    { date: '2025-07-05', processed: 64, failed: 0 },
    { date: '2025-07-06', processed: 38, failed: 1 },
  ];

  // Calculate the maximum value to set the height of bars
  const maxValue = Math.max(...mockData.map(d => d.processed));
  
  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Chart visualization */}
        <div className="flex items-end justify-between h-[220px] mt-8">
          {mockData.map((day, i) => (
            <div key={i} className="flex flex-col items-center group relative">
              <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {day.processed} processed, {day.failed} failed
              </div>
              <div className="flex items-end">
                <div 
                  className="w-8 bg-blue-500 rounded-t-sm mr-1 transition-all group-hover:bg-blue-600" 
                  style={{ height: `${(day.processed / maxValue) * 100}%` }}
                ></div>
                {day.failed > 0 && (
                  <div 
                    className="w-2 bg-red-500 rounded-t-sm transition-all group-hover:bg-red-600" 
                    style={{ height: `${(day.failed / maxValue) * 20}%` }}
                  ></div>
                )}
              </div>
              <span className="text-xs mt-2 text-slate-600">{day.date.slice(-2)}</span>
            </div>
          ))}
        </div>
        
        {/* Chart legend */}
        <div className="flex items-center justify-end mt-4 text-xs text-slate-600">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
            <span>Processed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
            <span>Failed</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
