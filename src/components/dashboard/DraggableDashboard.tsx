import React, { useState } from 'react';
import GridLayout from 'react-grid-layout';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { AgentPerformanceDashboard } from './AgentPerformanceDashboard';
import { AgentMonitoringDashboard } from './AgentMonitoringDashboard';
import { MetricsGrid } from '../analytics/MetricsGrid';
import { ActivityTimeline } from '../analytics/ActivityTimeline';

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const defaultLayout: LayoutItem[] = [
  { i: 'performance', x: 0, y: 0, w: 6, h: 4 },
  { i: 'monitoring', x: 6, y: 0, w: 6, h: 4 },
  { i: 'metrics', x: 0, y: 4, w: 8, h: 3 },
  { i: 'activity', x: 8, y: 4, w: 4, h: 3 },
];

export function DraggableDashboard() {
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    return savedLayout ? JSON.parse(savedLayout) : defaultLayout;
  });

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  };

  const saveLayout = () => {
    localStorage.setItem('dashboardLayout', JSON.stringify(layout));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('dashboardLayout');
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4 gap-2">
        <Button 
          onClick={resetLayout} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Layout
        </Button>
        <Button 
          onClick={saveLayout} 
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Layout
        </Button>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={1200}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        <div key="performance" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="drag-handle p-2 border-b cursor-move bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            Performance Dashboard
          </div>
          <div className="p-4">
            <AgentPerformanceDashboard />
          </div>
        </div>

        <div key="monitoring" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="drag-handle p-2 border-b cursor-move bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            Agent Monitoring
          </div>
          <div className="p-4">
            <AgentMonitoringDashboard />
          </div>
        </div>

        <div key="metrics" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="drag-handle p-2 border-b cursor-move bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            Metrics Overview
          </div>
          <div className="p-4">
            <MetricsGrid />
          </div>
        </div>

        <div key="activity" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="drag-handle p-2 border-b cursor-move bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            Activity Timeline
          </div>
          <div className="p-4">
            <ActivityTimeline />
          </div>
        </div>
      </GridLayout>
    </div>
  );
} 