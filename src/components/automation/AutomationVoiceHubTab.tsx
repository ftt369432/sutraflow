import React from 'react';
import {
  Mic,
  Play,
  Activity,
  FileText,
  Calendar,
  Workflow,
  Plus,
  Zap,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface AutomationVoiceHubTabProps {
  voiceInput: string;
  setVoiceInput: (val: string) => void;
  isListening: boolean;
  currentTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onProcessVoiceCommand: (cmd: string) => void;
  newAgentForm: {
    name: string;
    description: string;
    capabilities: string;
    voiceTriggers: string;
    requiredServices: string;
  };
  setNewAgentForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      capabilities: string;
      voiceTriggers: string;
      requiredServices: string;
    }>
  >;
  showNewAgentForm: boolean;
  setShowNewAgentForm: (val: boolean) => void;
  onAddNewAgent: () => void;
}

export const AutomationVoiceHubTab: React.FC<AutomationVoiceHubTabProps> = ({
  voiceInput,
  setVoiceInput,
  isListening,
  currentTranscript,
  onStartListening,
  onStopListening,
  onProcessVoiceCommand,
  newAgentForm,
  setNewAgentForm,
  showNewAgentForm,
  setShowNewAgentForm,
  onAddNewAgent,
}) => {
  return (
    <div className="space-y-6">
      {/* Voice Command Interface */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
              <Mic className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              Voice Command Center
            </span>
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300 font-medium">
            Speak naturally to orchestrate multi-agent workflows and professional document generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Voice Input */}
            <div className="flex gap-4">
              <Textarea
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Type a command or use voice input..."
                className="flex-1"
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={isListening ? onStopListening : onStartListening}
                  className={`h-12 w-12 rounded-full ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => onProcessVoiceCommand(voiceInput)}
                  disabled={!voiceInput.trim()}
                  className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Live Transcript */}
            {isListening && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">Listening...</span>
                </div>
                <p className="text-blue-600">{currentTranscript}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceInput('Draft a demand letter for payment')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Legal Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceInput('Create medical report')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Medical Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceInput('Schedule meeting tomorrow')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceInput('Create workflow automation')}
              >
                <Workflow className="h-4 w-4 mr-2" />
                Workflow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Expansion Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-purple-600" />
            Expand Agent Network
          </CardTitle>
          <CardDescription>
            Easily add new AI agents to expand orchestration capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showNewAgentForm ? (
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Add new capabilities to your agent network</p>
              <Button
                onClick={() => setShowNewAgentForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Agent Name"
                value={newAgentForm.name}
                onChange={(e) =>
                  setNewAgentForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Textarea
                placeholder="Agent Description"
                value={newAgentForm.description}
                onChange={(e) =>
                  setNewAgentForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <Input
                placeholder="Capabilities (comma-separated)"
                value={newAgentForm.capabilities}
                onChange={(e) =>
                  setNewAgentForm((prev) => ({ ...prev, capabilities: e.target.value }))
                }
              />
              <Input
                placeholder="Voice Triggers (comma-separated)"
                value={newAgentForm.voiceTriggers}
                onChange={(e) =>
                  setNewAgentForm((prev) => ({ ...prev, voiceTriggers: e.target.value }))
                }
              />
              <Input
                placeholder="Required Services (comma-separated)"
                value={newAgentForm.requiredServices}
                onChange={(e) =>
                  setNewAgentForm((prev) => ({ ...prev, requiredServices: e.target.value }))
                }
              />

              <div className="flex gap-2">
                <Button
                  onClick={onAddNewAgent}
                  disabled={!newAgentForm.name.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewAgentForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
