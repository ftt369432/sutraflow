import React, { useState } from 'react';
import { ResearchForm } from '../../components/legal/research/ResearchForm';
import { ResearchResults } from '../../components/legal/research/ResearchResults';
import { SavedResearch } from '../../components/legal/research/SavedResearch';
import type { ResearchQuery, ResearchResult } from '../../types/legal';

export function LegalResearchPage() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: ResearchQuery) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResults([
        {
          id: '1',
          title: 'Example v. Case',
          citation: '123 F.3d 456',
          summary: 'Example case summary...',
          relevance: 0.95,
          date: new Date('2023-01-01')
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Research</h1>
        <p className="text-gray-600 dark:text-gray-300">Search and analyze legal precedents</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ResearchForm onSubmit={handleSearch} />
          <ResearchResults results={results} loading={loading} />
        </div>
        <div>
          <SavedResearch />
        </div>
      </div>
    </div>
  );
}