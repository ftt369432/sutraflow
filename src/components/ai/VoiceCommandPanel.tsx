import React from 'react';
import { Button } from '../ui/Button';
import { 
  Mic, 
  MicOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Command,
  Zap
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  description: string;
  isEnabled: boolean;
}

interface VoiceSettings {
  isListening: boolean;
  isSpeaking: boolean;
  volume: number;
  speed: number;
  voice: string;
}

export function VoiceCommandPanel() {
  const [commands, setCommands] = React.useState<VoiceCommand[]>([
    {
      id: '1',
      phrase: 'Hey Genie, generate code for...',
      action: 'GENERATE_CODE',
      description: 'Triggers code generation with the specified requirements',
      isEnabled: true
    },
    {
      id: '2',
      phrase: 'Hey Genie, explain this code',
      action: 'EXPLAIN_CODE',
      description: 'Provides an explanation of the currently selected code',
      isEnabled: true
    },
    {
      id: '3',
      phrase: 'Hey Genie, optimize this function',
      action: 'OPTIMIZE_CODE',
      description: 'Suggests optimizations for the selected function',
      isEnabled: true
    }
  ]);

  const [settings, setSettings] = React.useState<VoiceSettings>({
    isListening: false,
    isSpeaking: true,
    volume: 80,
    speed: 1,
    voice: 'en-US-Neural2-F'
  });

  const [selectedCommand, setSelectedCommand] = React.useState<VoiceCommand | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const toggleListening = () => {
    setSettings(prev => ({
      ...prev,
      isListening: !prev.isListening
    }));
  };

  const toggleSpeaking = () => {
    setSettings(prev => ({
      ...prev,
      isSpeaking: !prev.isSpeaking
    }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      volume: parseInt(e.target.value)
    }));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      speed: parseFloat(e.target.value)
    }));
  };

  const toggleCommand = (id: string) => {
    setCommands(commands.map(cmd => 
      cmd.id === id ? { ...cmd, isEnabled: !cmd.isEnabled } : cmd
    ));
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Panel */}
      <div className="flex items-center justify-between p-4 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant={settings.isListening ? 'default' : 'ghost'}
            size="lg"
            onClick={toggleListening}
            className={settings.isListening ? 'bg-cyberpunk-neon text-black' : ''}
          >
            {settings.isListening ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {settings.isListening ? 'Listening...' : 'Voice Control Inactive'}
            </div>
            <div className="text-xs text-gray-400">
              Say &quot;Hey Genie&quot; to activate
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSpeaking}
          >
            {settings.isSpeaking ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="space-y-4 p-4 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Voice Settings
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Volume</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={handleVolumeChange}
                className="flex-1"
              />
              <span className="text-xs w-8">{settings.volume}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Speed</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speed}
                onChange={handleSpeedChange}
                className="flex-1"
              />
              <span className="text-xs w-8">{settings.speed}x</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Voice</label>
            <select
              value={settings.voice}
              onChange={(e) => setSettings(prev => ({ ...prev, voice: e.target.value }))}
              className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded p-2 text-sm"
            >
              <option value="en-US-Neural2-F">Neural Voice (Female)</option>
              <option value="en-US-Neural2-M">Neural Voice (Male)</option>
              <option value="en-US-Standard-F">Standard Voice (Female)</option>
              <option value="en-US-Standard-M">Standard Voice (Male)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Commands */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Command className="h-4 w-4" />
            Voice Commands
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {commands.map(command => (
            <div
              key={command.id}
              className="p-3 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyberpunk-neon" />
                    {command.phrase}
                  </div>
                  <div className="text-xs text-gray-400">
                    {command.description}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCommand(command.id)}
                >
                  {command.isEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recognition Status */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        {settings.isListening && (
          <div className="px-4 py-2 bg-cyberpunk-dark/90 border border-cyberpunk-neon rounded-full text-sm animate-pulse">
            Listening for commands...
          </div>
        )}
      </div>
    </div>
  );
} 