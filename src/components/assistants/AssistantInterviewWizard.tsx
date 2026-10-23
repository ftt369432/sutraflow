import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { Loader2, MessageSquare, ArrowRight, Check, Brain, UserCircle, Bot, Settings } from 'lucide-react';
import { assistantConversationService } from '../../services/ai/assistantConversationService';
import { v4 as uuidv4 } from 'uuid';

interface AssistantInterviewWizardProps {
  assistantName: string;
  assistantDescription?: string;
  systemPrompt?: string;
  onComplete: (result: {
    name: string;
    description: string;
    systemPrompt: string;
    suggestedFolders: string[];
    suggestedCapabilities: string[];
  }) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type InterviewStep = 'purpose' | 'capabilities' | 'tone' | 'knowledge' | 'review';

interface InterviewQuestion {
  question: string;
  hint?: string;
  placeholder?: string;
}

export function AssistantInterviewWizard({
  assistantName,
  assistantDescription,
  systemPrompt,
  onComplete
}: AssistantInterviewWizardProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('purpose');
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingResult, setIsGeneratingResult] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    name: string;
    description: string;
    systemPrompt: string;
    suggestedFolders: string[];
    suggestedCapabilities: string[];
  } | null>(null);

  // Interview questions for each step
  const interviewQuestions: Record<InterviewStep, InterviewQuestion> = {
    purpose: {
      question: "What's the primary purpose of this assistant? What problems should it solve?",
      hint: "Be specific about the assistant's main job and who it's helping",
      placeholder: "This assistant should help with..."
    },
    capabilities: {
      question: "What specific skills or capabilities should this assistant have?",
      hint: "List key functions or tasks it should perform well",
      placeholder: "It should be able to..."
    },
    tone: {
      question: "How should this assistant communicate? What tone and style should it use?",
      hint: "Consider formality, friendliness, brevity, etc.",
      placeholder: "The assistant should sound..."
    },
    knowledge: {
      question: "What specialized knowledge domains should this assistant have expertise in?",
      hint: "List specific subjects, industries, or technical areas",
      placeholder: "It needs expertise in..."
    },
    review: {
      question: "Let's finalize your assistant. Any last adjustments before we generate the configuration?",
      hint: "Review the conversation and add any missing details",
      placeholder: "Additionally, the assistant should..."
    }
  };

  // Step icons and titles
  const stepInfo: Record<InterviewStep, { icon: React.ReactNode; title: string }> = {
    purpose: { icon: <Brain className="h-5 w-5" />, title: "Purpose & Goals" },
    capabilities: { icon: <Bot className="h-5 w-5" />, title: "Capabilities" },
    tone: { icon: <MessageSquare className="h-5 w-5" />, title: "Tone & Style" },
    knowledge: { icon: <Brain className="h-5 w-5" />, title: "Knowledge Areas" },
    review: { icon: <Settings className="h-5 w-5" />, title: "Final Review" }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Start with a welcome message from the system
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: `Hi there! I'll help you configure your "${assistantName}" assistant. Let's start by understanding its core purpose.`
      }]);
      setCurrentStep('purpose');
      setUserInput('');
      setFinalResult(null);
    }
  }, [open, assistantName]);

  // Handle sending a message in the interview
  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsProcessing(true);

    try {
      // Determine next step
      let nextStep: InterviewStep = currentStep;
      switch (currentStep) {
        case 'purpose':
          nextStep = 'capabilities';
          break;
        case 'capabilities':
          nextStep = 'tone';
          break;
        case 'tone':
          nextStep = 'knowledge';
          break;
        case 'knowledge':
          nextStep = 'review';
          break;
        case 'review':
          // Stay on review for final adjustments
          break;
      }

      // Generate assistant response
      const assistantPrompt = `
You are interviewing the user to help configure an AI assistant named "${assistantName}".
${assistantDescription ? `The current description is: "${assistantDescription}"` : ''}

Current interview step: ${currentStep}
User's latest response: "${userInput}"

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Based on the user's response, provide:
1. An acknowledgment of their input
2. A thoughtful follow-up or clarification if needed
3. Introduce the next topic: ${nextStep !== currentStep ? interviewQuestions[nextStep].question : 'Ask for final adjustments'}

Keep your response conversational, helpful, and focused on creating the best assistant. Don't be too long.
`;

      const assistantResponse = await assistantConversationService.generateResponse(
        assistantPrompt,
        {
          name: 'Interview Assistant',
          description: 'Helps create AI assistants through conversational interview'
        },
        []
      );

      // Add assistant's response
      const responseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantResponse
      };

      setMessages(prev => [...prev, responseMessage]);
      
      // Update step
      setCurrentStep(nextStep);
    } catch (error) {
      console.error('Error in interview process:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'system',
        content: 'Sorry, I encountered an error processing your response. Let\'s continue.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Generate the final configuration
  const generateConfiguration = async () => {
    setIsGeneratingResult(true);
    
    try {
      const configPrompt = `
Based on the following interview conversation, create a comprehensive configuration for an AI assistant named "${assistantName}".
${assistantDescription ? `Current description: "${assistantDescription}"` : ''}
${systemPrompt ? `Current system prompt: "${systemPrompt}"` : ''}

CONVERSATION:
${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')}

Generate the following:
1. A concise but descriptive name (use the original name "${assistantName}" unless you have a better suggestion)
2. A detailed description paragraph explaining what this assistant does and who it serves
3. A comprehensive system prompt that will guide the assistant's behavior
4. A list of 3-5 suggested knowledge folders that would enhance this assistant's capabilities
5. A list of key capabilities this assistant should have (e.g., "Code generation", "Legal document analysis")

Format your response as JSON with the following structure:
{
  "name": "Assistant name",
  "description": "Detailed description",
  "systemPrompt": "Complete system prompt",
  "suggestedFolders": ["Folder 1", "Folder 2", "..."],
  "suggestedCapabilities": ["Capability 1", "Capability 2", "..."]
}
`;

      const configResponse = await assistantConversationService.generateResponse(
        configPrompt,
        {
          name: 'Configuration Assistant',
          description: 'Generates assistant configurations'
        },
        []
      );
      
      try {
        const parsedResult = JSON.parse(configResponse);
        setFinalResult(parsedResult);
        
        // Add a summary message
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: `Great! I've created a configuration for your "${parsedResult.name}" assistant. Here's a summary of what I've built:

• **Description**: ${parsedResult.description.substring(0, 100)}...
• **Capabilities**: ${parsedResult.suggestedCapabilities.join(', ')}
• **Suggested Knowledge**: ${parsedResult.suggestedFolders.join(', ')}

You can now apply this configuration or make further adjustments!`
        }]);
      } catch (error) {
        console.error('Error parsing configuration:', error);
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'system',
          content: 'Sorry, I encountered an error generating the configuration. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Error generating configuration:', error);
    } finally {
      setIsGeneratingResult(false);
    }
  };

  // Apply the configuration
  const handleApplyConfiguration = () => {
    if (finalResult) {
      onComplete(finalResult);
      setOpen(false);
    }
  };

  // Handle navigating to a specific step
  const jumpToStep = (step: InterviewStep) => {
    setCurrentStep(step);
    
    // Add a system message about changing the topic
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `Let's talk about ${stepInfo[step].title}. ${interviewQuestions[step].question}`
    }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCircle className="h-4 w-4 mr-2" />
          Interview Wizard
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Assistant with Guided Interview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Steps sidebar */}
          <div className="w-1/4 border-r pr-3">
            <div className="text-sm font-medium mb-2">Interview Progress</div>
            {(['purpose', 'capabilities', 'tone', 'knowledge', 'review'] as InterviewStep[]).map((step) => (
              <Button
                key={step}
                variant={currentStep === step ? "secondary" : "ghost"}
                className={`w-full justify-start text-left mb-1 ${currentStep === step ? 'font-medium' : ''}`}
                onClick={() => jumpToStep(step)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                    currentStep === step ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {stepInfo[step].icon}
                  </div>
                  <span className="text-xs">{stepInfo[step].title}</span>
                </div>
              </Button>
            ))}
            
            {currentStep === 'review' && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={generateConfiguration}
                disabled={isGeneratingResult}
              >
                {isGeneratingResult ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Generate Config
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Conversation area */}
          <div className="flex-1 flex flex-col h-[60vh] overflow-hidden">
            {/* Current question */}
            <Card className="p-3 mb-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{stepInfo[currentStep].title}</Badge>
                <h4 className="font-medium text-sm">{interviewQuestions[currentStep].question}</h4>
              </div>
              {interviewQuestions[currentStep].hint && (
                <p className="text-xs text-muted-foreground">{interviewQuestions[currentStep].hint}</p>
              )}
            </Card>
            
            {/* Message history */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg p-3 max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'system'
                          ? 'bg-muted border border-border'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-line">
                        {message.content}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <UserCircle className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 max-w-[85%]">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-150"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="flex gap-2 mt-3">
              <Input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isProcessing || isGeneratingResult}
                placeholder={interviewQuestions[currentStep].placeholder || "Type your answer..."}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isProcessing || isGeneratingResult}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          {finalResult ? (
            <div className="w-full flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Configuration generated successfully!
              </div>
              <Button onClick={handleApplyConfiguration} className="gap-1">
                <Check className="h-4 w-4" />
                Apply Configuration
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}