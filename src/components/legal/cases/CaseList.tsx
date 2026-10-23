import React from 'react';
import { Scale, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import type { LegalCase } from '../../../types/legal';
import { useLegalStore } from '../../../store/legalStore';

interface CaseListProps {
  onSelect: (legalCase: LegalCase) => void;
}

export function CaseList({ onSelect }: CaseListProps) {
  const { cases } = useLegalStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cases.map((legalCase) => (
        <div
          key={legalCase.id}
          onClick={() => onSelect(legalCase)}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Scale className="text-blue-500 dark:text-blue-400" size={20} />
              <h3 className="ml-2 font-medium text-gray-900 dark:text-white">
                {legalCase.title}
              </h3>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              legalCase.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : legalCase.status === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {legalCase.status.charAt(0).toUpperCase() + legalCase.status.slice(1)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Case #{legalCase.caseNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {legalCase.court}
            </p>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            {format(legalCase.filingDate, 'MMM d, yyyy')}
          </div>

          {legalCase.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {legalCase.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                >
                  <Tag size={12} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}