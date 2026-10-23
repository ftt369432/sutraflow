import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { useAI } from '../../contexts/AIContext';
import { useAIStore } from '../../store/aiStore';

interface AIAssistantProps {
  mode?: 'chat' | 'task' | 'email';
}

export function AIAssistant({ mode = 'chat' }: AIAssistantProps) {
  const { messages } = useAIStore();
  const [input, setInput] = useState('');
  const [_isLoading, /*setIsLoading*/] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useAI();
  const [currentMode, setCurrentMode] = useState<'chat' | 'task' | 'email'>(mode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageToSend = input;
    setInput('');

    try {
      await sendMessage([{ text: messageToSend }], currentMode);
    } catch (error) {
      console.error(`Error sending message in ${currentMode} mode:`, error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background_color text-text_color">
      <header className="p-4 border-b border-border_color">
        <h2 className="text-xl font-semibold">AI Assistant ({currentMode})</h2>
        <div className="mt-2">
          <Button variant={currentMode === 'chat' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentMode('chat') } className="mr-2">Chat Mode</Button>
          <Button variant={currentMode === 'task' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentMode('task')} className="mr-2">Task Mode</Button>
          <Button variant={currentMode === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentMode('email')} >Email Mode</Button>
        </div>
      </header>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary_color text-primary_text_color'
                    : 'bg-secondary_color text-secondary_text_color'
                }`}
              >
                {msg.content}
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()} 
                  {msg.metadata?.tokens && `(${msg.metadata.tokens} tokens)`}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border_color">
        <div className="flex items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type your message for ${currentMode} assistance...`}
            className="flex-grow resize-none bg-input_bg_color border-input_border_color focus:ring-primary_color"            
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={_isLoading} className="bg-button_primary_color hover:bg-button_primary_hover_color">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}