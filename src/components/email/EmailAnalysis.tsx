import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { EmailAnalysis } from '../../services/ai/emailAnalyzer';

interface EmailAnalysisProps {
  analysis: EmailAnalysis;
  onCreateTask?: (task: { title: string; priority: string; dueDate?: Date }) => void;
}

export function EmailAnalysisPanel({ analysis, onCreateTask }: EmailAnalysisProps) {
  return (
    <div className="border-t border-gray-200 mt-6 pt-6">
      <h3 className="text-lg font-medium mb-4">AI Analysis</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${
            analysis.category === 'important'
              ? 'bg-red-100 text-red-600'
              : analysis.category === 'task'
              ? 'bg-blue-100 text-blue-600'
              : analysis.category === 'follow-up'
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <AlertCircle size={20} />
          </div>
          <span className="ml-2 text-sm font-medium capitalize">
            {analysis.category} Email
          </span>
        </div>

        {analysis.extractedTasks && analysis.extractedTasks.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Extracted Tasks</h4>
            <div className="space-y-2">
              {analysis.extractedTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                >
                  <div className="flex items-center">
                    <CheckCircle2 size={16} className="text-green-500 mr-2" />
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {task.dueDate.toLocaleDateString()}
                      </div>
                    )}
                    <button
                      onClick={() => onCreateTask?.(task)}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.suggestedResponse && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Suggested Response</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {analysis.suggestedResponse}
            </p>
            <button className="mt-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              Use This Response
            </button>
          </div>
        )}
      </div>
    </div>
  );
}