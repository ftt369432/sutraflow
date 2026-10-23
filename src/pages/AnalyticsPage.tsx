import React from 'react';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { PageHeader } from '../components/layout/PageHeader';

export function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Analytics"
        description="Track your productivity and engagement metrics"
      />
      
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}