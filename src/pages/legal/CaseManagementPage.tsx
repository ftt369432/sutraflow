import React, { useState } from 'react';
import { CaseList } from '../../components/legal/cases/CaseList';
import { CaseDetail } from '../../components/legal/cases/CaseDetail';
import { CaseForm } from '../../components/legal/cases/CaseForm';
import { Plus } from 'lucide-react';
import type { LegalCase } from '../../types/legal';

export function CaseManagementPage() {
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Case Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your legal cases and documents</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            New Case
          </button>
        </div>
      </div>

      {showForm ? (
        <CaseForm
          onSubmit={(caseData) => {
            console.log('New case:', caseData);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : selectedCase ? (
        <CaseDetail
          case={selectedCase}
          onBack={() => setSelectedCase(null)}
        />
      ) : (
        <CaseList onSelect={setSelectedCase} />
      )}
    </div>
  );
}