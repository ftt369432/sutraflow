import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import type { LegalCase } from '../../../types/legal';
import { useLegalStore } from '../../../store/legalStore';

interface CaseFormProps {
  onSubmit: (caseData: Partial<LegalCase>) => void;
  onCancel: () => void;
  initialData?: Partial<LegalCase>;
}

export function CaseForm({ onSubmit, onCancel, initialData }: CaseFormProps) {
  const [caseData, setCaseData] = useState<Partial<LegalCase>>({
    title: initialData?.title || '',
    caseNumber: initialData?.caseNumber || '',
    court: initialData?.court || '',
    status: initialData?.status || 'pending',
    type: initialData?.type || '',
    filingDate: initialData?.filingDate || new Date(),
    parties: initialData?.parties || { plaintiff: '', defendant: '' },
    description: initialData?.description || '',
    tags: initialData?.tags || [],
  });

  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !caseData.tags?.includes(newTag)) {
      setCaseData({
        ...caseData,
        tags: [...(caseData.tags || []), newTag],
      });
      setNewTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...caseData,
      id: initialData?.id || crypto.randomUUID(),
      documents: initialData?.documents || [],
      events: initialData?.events || [],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {initialData ? 'Edit Case' : 'New Case'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Case Title
            </label>
            <input
              type="text"
              value={caseData.title}
              onChange={(e) => setCaseData({ ...caseData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Case Number
            </label>
            <input
              type="text"
              value={caseData.caseNumber}
              onChange={(e) => setCaseData({ ...caseData, caseNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Court
            </label>
            <input
              type="text"
              value={caseData.court}
              onChange={(e) => setCaseData({ ...caseData, court: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={caseData.status}
              onChange={(e) => setCaseData({
                ...caseData,
                status: e.target.value as LegalCase['status']
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filing Date
            </label>
            <input
              type="date"
              value={caseData.filingDate?.toISOString().split('T')[0]}
              onChange={(e) => setCaseData({
                ...caseData,
                filingDate: new Date(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Case Type
            </label>
            <input
              type="text"
              value={caseData.type}
              onChange={(e) => setCaseData({ ...caseData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plaintiff
            </label>
            <input
              type="text"
              value={caseData.parties?.plaintiff}
              onChange={(e) => setCaseData({
                ...caseData,
                parties: { ...caseData.parties!, plaintiff: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Defendant
            </label>
            <input
              type="text"
              value={caseData.parties?.defendant}
              onChange={(e) => setCaseData({
                ...caseData,
                parties: { ...caseData.parties!, defendant: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={caseData.description}
            onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Plus size={20} />
            </button>
          </div>
          {caseData.tags && caseData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {caseData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                >
                  <Tag size={12} className="mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => setCaseData({
                      ...caseData,
                      tags: caseData.tags?.filter(t => t !== tag)
                    })}
                    className="ml-1 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {initialData ? 'Save Changes' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}