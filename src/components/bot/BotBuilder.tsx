import React, { useState } from 'react';
import { Plus, Save, ChevronDown, ChevronRight, Link, Play, Settings } from 'lucide-react';

interface BotAction {
  id: string;
  name: string;
  prompt: string;
  linkedData?: string[];
  isExpanded?: boolean;
}

interface BotBuilderProps {
  onSave?: (bot: { name: string; actions: BotAction[] }) => void;
  previousData?: { id: string; content: string }[];
}

export function BotBuilder({ onSave, previousData = [] }: BotBuilderProps) {
  const [botName, setBotName] = useState('');
  const [actions, setActions] = useState<BotAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const addAction = () => {
    const newAction: BotAction = {
      id: crypto.randomUUID(),
      name: `Action ${actions.length + 1}`,
      prompt: '',
      linkedData: [],
      isExpanded: true
    };
    setActions([...actions, newAction]);
    setSelectedAction(newAction.id);
  };

  const updateAction = (id: string, updates: Partial<BotAction>) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  const toggleActionExpand = (id: string) => {
    setActions(actions.map(action =>
      action.id === id ? { ...action, isExpanded: !action.isExpanded } : action
    ));
  };

  const handleSave = () => {
    if (botName && actions.length > 0 && onSave) {
      onSave({ name: botName, actions });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Bot Builder</h2>
        <input
          type="text"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          placeholder="Enter bot name..."
          className="w-full p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer"
              onClick={() => toggleActionExpand(action.id)}
            >
              <div className="flex items-center space-x-2">
                {action.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <input
                  type="text"
                  value={action.name}
                  onChange={(e) => updateAction(action.id, { name: e.target.value })}
                  className="bg-transparent border-none focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAction(action.id);
                  }}
                >
                  <Settings size={16} />
                </button>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle play action
                  }}
                >
                  <Play size={16} />
                </button>
              </div>
            </div>

            {action.isExpanded && (
              <div className="p-3 space-y-3">
                <textarea
                  value={action.prompt}
                  onChange={(e) => updateAction(action.id, { prompt: e.target.value })}
                  placeholder="Enter prompt..."
                  className="w-full h-24 p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Link size={16} />
                    <span className="text-sm">Linked Data</span>
                  </div>
                  {previousData.map((data) => (
                    <label
                      key={data.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={action.linkedData?.includes(data.id)}
                        onChange={(e) => {
                          const linkedData = e.target.checked
                            ? [...(action.linkedData || []), data.id]
                            : action.linkedData?.filter(id => id !== data.id);
                          updateAction(action.id, { linkedData });
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span>{data.content.substring(0, 50)}...</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t dark:border-gray-700 space-x-2 flex justify-between">
        <button
          onClick={addAction}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Action</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          disabled={!botName || actions.length === 0}
        >
          <Save size={16} />
          <span>Save Bot</span>
        </button>
      </div>
    </div>
  );
} 