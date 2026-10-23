/**
 * 🌟 Universal Multi-Canvas Industry Demo
 * 
 * Demonstrates how the multi-canvas system works across different industries
 */

import React, { useState, useEffect } from 'react';
import { multiCanvasOrchestrator, IndustryProfile, DetectedTask } from '../../services/canvas/MultiCanvasTaskOrchestrator';

interface IndustryDemoProps {
  onIndustryChange?: (industry: string) => void;
}

export const UniversalMultiCanvasDemo: React.FC<IndustryDemoProps> = ({ onIndustryChange }) => {
  const [currentIndustry, setCurrentIndustry] = useState<IndustryProfile>();
  const [availableIndustries, setAvailableIndustries] = useState<IndustryProfile[]>([]);
  const [sampleInput, setSampleInput] = useState('');
  const [detectedTasks, setDetectedTasks] = useState<DetectedTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sample inputs for different industries
  const sampleInputs = {
    legal: "I need to: 1. Draft a motion for summary judgment 2. Research case precedents for contract disputes 3. Prepare a legal brief for the appellate court 4. Review discovery documents",
    medical: "Please help me: 1. Create a patient treatment plan for diabetes 2. Write a medical consultation report 3. Research latest treatments for hypertension 4. Document patient follow-up procedures",
    business: "I need to: 1. Develop a market strategy for Q4 2. Create a business proposal for new clients 3. Analyze competitor pricing 4. Prepare financial projections",
    technology: "I need to: 1. Write technical documentation for the new API 2. Review code for the authentication module 3. Create system architecture diagrams 4. Plan the deployment strategy"
  };

  useEffect(() => {
    // Load available industries
    const industries = multiCanvasOrchestrator.getAvailableIndustries();
    setAvailableIndustries(industries);
    setCurrentIndustry(multiCanvasOrchestrator.getCurrentIndustry());
  }, []);

  const handleIndustryChange = (industryId: string) => {
    const success = multiCanvasOrchestrator.setIndustry(industryId);
    if (success) {
      setCurrentIndustry(multiCanvasOrchestrator.getCurrentIndustry());
      setSampleInput(sampleInputs[industryId as keyof typeof sampleInputs] || '');
      onIndustryChange?.(industryId);
    }
  };

  const analyzeTasks = async () => {
    if (!sampleInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const tasks = await multiCanvasOrchestrator.detectTasksFromInput(sampleInput);
      setDetectedTasks(tasks);
    } catch (error) {
      console.error('Error analyzing tasks:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoDetectIndustry = () => {
    const detected = multiCanvasOrchestrator.autoDetectIndustry(sampleInput);
    setCurrentIndustry(multiCanvasOrchestrator.getCurrentIndustry());
  };

  return (
    <div className="universal-multi-canvas-demo p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🌟 Universal Multi-Canvas System
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This system automatically adapts to any industry. Switch between industries to see how 
          task detection, templates, and priorities change based on context.
        </p>
        
        {/* Industry Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏭 Select Industry:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableIndustries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustryChange(industry.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentIndustry?.id === industry.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {industry.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Industry Info */}
        {currentIndustry && (
          <div className="bg-white p-4 rounded border mb-4">
            <h3 className="font-medium text-gray-800 mb-2">
              Current Industry: {currentIndustry.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Task Types:</strong>
                <ul className="list-disc list-inside text-gray-600">
                  {currentIndustry.taskTypes.slice(0, 4).map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {currentIndustry.taskTypes.length > 4 && (
                    <li>... and {currentIndustry.taskTypes.length - 4} more</li>
                  )}
                </ul>
              </div>
              <div>
                <strong>Key Keywords:</strong>
                <div className="text-gray-600">
                  {currentIndustry.keywords.slice(0, 6).join(', ')}
                  {currentIndustry.keywords.length > 6 && '...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Multi-Task Input:
          </label>
          <textarea
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            placeholder="Enter multiple tasks here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setSampleInput(sampleInputs[currentIndustry?.id as keyof typeof sampleInputs] || '')}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Load Sample
            </button>
            <button
              onClick={autoDetectIndustry}
              className="px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
            >
              Auto-Detect Industry
            </button>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeTasks}
          disabled={!sampleInput.trim() || isAnalyzing}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '🔍 Analyzing Tasks...' : '🎯 Analyze Multi-Tasks'}
        </button>
      </div>

      {/* Results */}
      {detectedTasks.length > 0 && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium text-gray-800 mb-3">
            ✅ Detected {detectedTasks.length} Tasks for {currentIndustry?.name}:
          </h3>
          <div className="space-y-3">
            {detectedTasks.map((task, index) => (
              <div key={task.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {index + 1}. {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className={`px-2 py-1 rounded ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </div>
                    <div className="mt-1">⏱️ {task.estimatedTime}m</div>
                    <div className="mt-1 font-medium">📄 {task.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              🎨 <strong>Next Step:</strong> Each task would create a separate canvas with industry-specific 
              templates. The system automatically adapts content structure, priority keywords, and estimated 
              times based on the {currentIndustry?.name} industry context.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
