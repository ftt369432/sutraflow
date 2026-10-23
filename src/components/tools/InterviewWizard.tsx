import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useAIServices } from '../../hooks/useAIServices';
import { Loader2, Send, CornerDownLeft, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  feedback?: string; // Optional feedback for user answers
  score?: number; // Optional score for user answers (1-10)
}

type InterviewTopic = {
  id: string;
  name: string;
  description: string;
}

const INTERVIEW_TOPICS: InterviewTopic[] = [
  { id: 'javascript', name: 'JavaScript', description: 'Core concepts, ES6+, async programming' },
  { id: 'react', name: 'React', description: 'Hooks, components, state management' },
  { id: 'node', name: 'Node.js', description: 'Server-side JS, Express, APIs' },
  { id: 'python', name: 'Python', description: 'Python fundamentals and best practices' },
  { id: 'java', name: 'Java', description: 'OOP, Java 8+, Spring framework' },
  { id: 'system-design', name: 'System Design', description: 'Architecture, scalability, database design' },
  { id: 'algorithms', name: 'Algorithms & Data Structures', description: 'Common algorithms and problem-solving' },
  { id: 'devops', name: 'DevOps', description: 'CI/CD, Docker, Kubernetes, cloud platforms' }
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'expert', name: 'Expert' }
];

export function InterviewWizard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<string>('intermediate');
  const [interviewStarted, setInterviewStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { assistantConversationService } = useAIServices();

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    if (!selectedTopic) {
      setError('Please select an interview topic');
      return;
    }

    setLoading(true);
    setError(null);
    setMessages([]);
    
    try {
      // Initial system message to set up the context
      const systemMessage: Message = {
        role: 'system',
        content: `You are an expert technical interviewer for ${selectedTopic} at ${difficultyLevel} level. Ask one technical question at a time, evaluate the candidate's answer, provide feedback, and then ask the next question. Give a score from 1-10 for each answer.`
      };

      // First message from the assistant to start the interview
      const response = await assistantConversationService.generateResponse(
        [systemMessage], 
        `Start a technical interview for ${selectedTopic} at ${difficultyLevel} level. Introduce yourself briefly, then ask your first question.`
      );

      setMessages([
        systemMessage,
        { role: 'assistant', content: response }
      ]);
      setInterviewStarted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start the interview');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);
    
    try {
      // Generate AI response with evaluation
      const response = await assistantConversationService.generateResponse(
        [...messages, userMessage],
        "Evaluate the candidate's answer, provide detailed feedback, give a score from 1-10, and ask the next question."
      );
      
      // Parse the response for structured feedback
      const processedResponse = response;
      const feedback = '';
      let score: number | undefined = undefined;

      // Try to extract score if present in format like "Score: 7/10"
      const scoreMatch = response.match(/score:?\s*(\d+)(?:\/10)?/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
      }

      // Add the assistant response to the messages
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: processedResponse,
        feedback,
        score
      }]);
    } catch (err: any) {
      setError(err.message || 'Failed to get a response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetInterview = () => {
    setMessages([]);
    setInterviewStarted(false);
    setSelectedTopic('');
    setError(null);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle>Technical Interview Wizard</CardTitle>
          <CardDescription>
            Practice technical interviews with AI feedback
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col overflow-hidden">
          {!interviewStarted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 font-medium">Interview Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TOPICS.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <div className="flex flex-col">
                          <span>{topic.name}</span>
                          <span className="text-xs text-muted-foreground">{topic.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm mb-1 font-medium">Difficulty Level</label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={startInterview} 
                disabled={loading || !selectedTopic} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="outline" className="mr-2">
                    {INTERVIEW_TOPICS.find(t => t.id === selectedTopic)?.name}
                  </Badge>
                  <Badge variant="secondary">
                    {DIFFICULTY_LEVELS.find(d => d.id === difficultyLevel)?.name}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={resetInterview}>
                  <RefreshCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>
              
              <Separator className="mb-4" />
              
              <ScrollArea className="flex-grow pr-4">
                <div className="space-y-4">
                  {messages.filter(m => m.role !== 'system').map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[80%] rounded-lg p-3
                          ${msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              {msg.role === 'user' ? 'U' : 'AI'}
                            </div>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {msg.role === 'user' ? 'You' : 'Interviewer'}
                          </span>
                          {msg.score && (
                            <Badge 
                              variant={msg.score >= 8 ? "success" : msg.score >= 6 ? "default" : "destructive"}
                              className="ml-auto text-xs"
                            >
                              Score: {msg.score}/10
                            </Badge>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
        
        {interviewStarted && (
          <CardFooter className="border-t p-4">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                placeholder="Type your answer..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow"
                disabled={loading}
              />
              <Button disabled={loading || !currentMessage.trim()} onClick={sendMessage}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Press <kbd className="bg-muted rounded px-1">Enter</kbd> to send, <kbd className="bg-muted rounded px-1">Shift+Enter</kbd> for new line
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}