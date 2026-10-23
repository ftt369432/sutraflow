import React, { useState, useEffect } from 'react';
import { VoiceTrigger } from '../utils/location';
import {
  getAllAssistantTriggers,
  addAssistantTrigger,
  updateAssistantTrigger,
  removeAssistantTrigger
} from '../utils/location';

interface TriggerSettingsProps {
  onTriggersChanged?: () => void;
}

const TriggerWordSettings: React.FC<TriggerSettingsProps> = ({ onTriggersChanged }) => {
  const [triggers, setTriggers] = useState<VoiceTrigger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VoiceTrigger>>({});
  const [assistantTypes, setAssistantTypes] = useState<string[]>([
    'general', 'research', 'creative', 'task', 'custom'
  ]);
  const [selectedType, setSelectedType] = useState<string>('general');
  const [customType, setCustomType] = useState<string>('');

  // Load all triggers on component mount
  useEffect(() => {
    loadTriggers();
  }, []);

  // Load triggers from storage
  const loadTriggers = async () => {
    setLoading(true);
    try {
      const loadedTriggers = await getAllAssistantTriggers();
      setTriggers(loadedTriggers);
    } catch (error) {
      console.error('Error loading triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for trigger editing
  const handleInputChange = (field: keyof VoiceTrigger, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add a new alternative trigger phrase
  const handleAddAlternativeTrigger = () => {
    const alternatives = formData.alternativeTriggers || [];
    setFormData(prev => ({
      ...prev,
      alternativeTriggers: [...alternatives, '']
    }));
  };

  // Update an alternative trigger phrase
  const handleUpdateAlternativeTrigger = (index: number, value: string) => {
    if (!formData.alternativeTriggers) return;
    
    const updated = [...formData.alternativeTriggers];
    updated[index] = value;
    
    setFormData(prev => ({
      ...prev,
      alternativeTriggers: updated
    }));
  };

  // Remove an alternative trigger phrase
  const handleRemoveAlternativeTrigger = (index: number) => {
    if (!formData.alternativeTriggers) return;
    
    const updated = [...formData.alternativeTriggers];
    updated.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      alternativeTriggers: updated
    }));
  };

  // Start editing a trigger
  const handleEditTrigger = (assistantId: string) => {
    const triggerToEdit = triggers.find(t => t.assistantId === assistantId);
    if (triggerToEdit) {
      setFormData({ ...triggerToEdit });
      setEditMode(assistantId);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData({});
    setEditMode(null);
  };

  // Save an edited trigger
  const handleSaveTrigger = async () => {
    if (!formData.assistantId || !formData.assistantType) return;
    
    try {
      if (editMode) {
        // Update existing trigger
        await updateAssistantTrigger(formData.assistantId, formData);
      } else {
        // Add new trigger with assistantId and type
        const assistantType = selectedType === 'custom' ? customType : selectedType;
        await addAssistantTrigger(
          `assistant-${Date.now()}`, 
          assistantType,
          formData
        );
      }
      
      // Reload triggers and reset form
      await loadTriggers();
      setFormData({});
      setEditMode(null);
      if (onTriggersChanged) onTriggersChanged();
    } catch (error) {
      console.error('Error saving trigger:', error);
    }
  };

  // Delete a trigger
  const handleDeleteTrigger = async (assistantId: string) => {
    try {
      await removeAssistantTrigger(assistantId);
      await loadTriggers();
      if (onTriggersChanged) onTriggersChanged();
    } catch (error) {
      console.error('Error deleting trigger:', error);
    }
  };

  // Start adding a new trigger
  const handleAddNew = () => {
    setEditMode('new');
    setFormData({
      enabled: true,
      primaryTrigger: '',
      alternativeTriggers: [],
      sensitivity: 75,
      requireConfirmation: false
    });
  };

  return (
    <div className="voice-trigger-settings p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Assistant Trigger Words</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* List of existing triggers */}
          {triggers.length > 0 ? (
            <div className="mb-6 space-y-4">
              {triggers.map(trigger => (
                <div 
                  key={trigger.assistantId}
                  className={`p-3 border rounded-lg ${trigger.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{trigger.assistantName || trigger.assistantType} Assistant</div>
                      <div className="text-sm text-gray-600">
                        Primary: &quot;<span className="font-medium">{trigger.primaryTrigger}</span>&quot;
                      </div>
                      {trigger.alternativeTriggers && trigger.alternativeTriggers.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Also responds to: {trigger.alternativeTriggers.map(alt => `&quot;${alt}&quot;`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditTrigger(trigger.assistantId)}
                        className="p-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTrigger(trigger.assistantId)}
                        className="p-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500 mb-6">
              No assistant triggers configured. Add one to get started.
            </div>
          )}

          {/* Add new trigger button */}
          {!editMode && (
            <button 
              onClick={handleAddNew}
              className="mb-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Add New Assistant Trigger
            </button>
          )}
          
          {/* Edit/create form */}
          {editMode && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-4">
                {editMode === 'new' ? 'Add New Assistant Trigger' : 'Edit Assistant Trigger'}
              </h3>
              
              {/* Assistant Type Selection - Only for new triggers */}
              {editMode === 'new' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assistant Type</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {assistantTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  
                  {selectedType === 'custom' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter custom assistant type"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Assistant Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Assistant Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="My Assistant"
                  value={formData.assistantName || ''}
                  onChange={(e) => handleInputChange('assistantName', e.target.value)}
                />
              </div>
              
              {/* Primary Trigger */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Primary Trigger Phrase</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="hey assistant"
                  value={formData.primaryTrigger || ''}
                  onChange={(e) => handleInputChange('primaryTrigger', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">This is what users will say to activate this assistant</p>
              </div>
              
              {/* Alternative Triggers */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Alternative Trigger Phrases</label>
                {formData.alternativeTriggers && formData.alternativeTriggers.map((trigger, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-grow p-2 border border-gray-300 rounded-l"
                      placeholder={`Alternative ${index + 1}`}
                      value={trigger}
                      onChange={(e) => handleUpdateAlternativeTrigger(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAlternativeTrigger(index)}
                      className="bg-red-500 text-white px-3 rounded-r"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAlternativeTrigger}
                  className="mt-2 py-1 px-3 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  + Add Alternative Phrase
                </button>
              </div>
              
              {/* Sensitivity */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Sensitivity: {formData.sensitivity || 75}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  className="w-full"
                  value={formData.sensitivity || 75}
                  onChange={(e) => handleInputChange('sensitivity', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Sensitive</span>
                  <span>More Sensitive</span>
                </div>
              </div>
              
              {/* Enabled/Disabled */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled !== false}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>Enabled</span>
                </label>
              </div>
              
              {/* Custom Response */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Custom Response (Optional)</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="I'm listening..."
                  value={formData.customResponseToTrigger || ''}
                  onChange={(e) => handleInputChange('customResponseToTrigger', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">What the assistant says when activated</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTrigger}
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!formData.primaryTrigger}
                >
                  {editMode === 'new' ? 'Add Trigger' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TriggerWordSettings;
