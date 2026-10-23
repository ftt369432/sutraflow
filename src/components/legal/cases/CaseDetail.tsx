import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FileText, ArrowLeft, Plus, Tag
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { cleanDocumentTitle } from '../../../utils/documentUtils';
import type { LegalCase } from '../../../types/legal';

interface CaseDetailProps {
  case: LegalCase;
  onBack: () => void;
}

export function CaseDetail({ case: legalCase, onBack }: CaseDetailProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
            {legalCase.title}
          </h2>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          legalCase.status === 'active'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : legalCase.status === 'pending'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {legalCase.status.charAt(0).toUpperCase() + legalCase.status.slice(1)}
        </span>
      </div>

      <div className="p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Case Information
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Case Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {legalCase.caseNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Court
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {legalCase.court}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Filing Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(legalCase.filingDate, 'PPP')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Case Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {legalCase.type}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Parties
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Plaintiff
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {legalCase.parties.plaintiff}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Defendant
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {legalCase.parties.defendant}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {legalCase.description}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Documents
              </h3>
              <button className="flex items-center px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50">
                <Plus size={16} className="mr-1" />
                Add Document
              </button>
            </div>
            <div className="space-y-3">
              {legalCase.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText size={20} className="text-gray-400 dark:text-gray-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cleanDocumentTitle(doc.title)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(doc.filingDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              {legalCase.events.map((event) => (
                <div key={event.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(event.date, 'MMM d, yyyy')}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}