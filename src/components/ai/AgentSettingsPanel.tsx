import { useState } from 'react';
import { Settings, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface AgentSettings {
  id: string;
  name: string;
  type: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  allowedAPIs: string[];
  rateLimit: number;
  isActive: boolean;
}

interface AgentSettingsPanelProps {
  settings: AgentSettings;
  onSave: (settings: AgentSettings) => void;
  onDelete: (id: string) => void;
}

export function AgentSettingsPanel({ settings: initialSettings, onSave, onDelete }: AgentSettingsPanelProps) {
  const [settings, setSettings] = useState<AgentSettings>(initialSettings);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: keyof AgentSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(settings);
    setIsEditing(false);
  };

  return (
    <div className="bg-cyberpunk-dark/50 border border-cyberpunk-neon/30 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-cyberpunk-neon" />
          <h2 className="text-lg font-bold text-white">Agent Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDelete(settings.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-cyberpunk-neon">Basic Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-md px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Type</label>
              <select
                value={settings.type}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-md px-3 py-2 text-white"
              >
                <option value="analysis">Analysis</option>
                <option value="support">Support</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-cyberpunk-neon">Model Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Model</label>
              <select
                value={settings.model}
                onChange={(e) => handleChange('model', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-md px-3 py-2 text-white"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Temperature</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                disabled={!isEditing}
                className="w-full"
              />
              <div className="text-sm text-gray-400 text-right">{settings.temperature}</div>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-cyberpunk-neon">System Prompt</h3>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
            disabled={!isEditing}
            rows={6}
            className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-md px-3 py-2 text-white resize-none"
          />
        </div>

        {/* API Access */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-cyberpunk-neon">API Access</h3>
          <div className="grid grid-cols-3 gap-4">
            {['OpenAI', 'Anthropic', 'HuggingFace', 'Custom API'].map(api => (
              <label key={api} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowedAPIs.includes(api)}
                  onChange={(e) => {
                    const newAPIs = e.target.checked
                      ? [...settings.allowedAPIs, api]
                      : settings.allowedAPIs.filter(a => a !== api);
                    handleChange('allowedAPIs', newAPIs);
                  }}
                  disabled={!isEditing}
                  className="rounded border-cyberpunk-neon/20"
                />
                <span className="text-sm text-gray-400">{api}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-cyberpunk-neon">Rate Limiting</h3>
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">High rate limits may impact performance</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={settings.rateLimit}
              onChange={(e) => handleChange('rateLimit', parseInt(e.target.value))}
              disabled={!isEditing}
              min={1}
              max={100}
              className="w-32 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-md px-3 py-2 text-white"
            />
            <span className="text-sm text-gray-400">requests per minute</span>
          </div>
        </div>
      </div>
    </div>
  );
} 