import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Label } from '../ui/Label';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { 
  Bot, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  HelpCircle,
  BrainCircuit,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { geminiSimplifiedService } from '../../services/gemini-simplified';
import { ImageGeneratorModal } from './ImageGeneratorModal';

interface AssistantSetupInterviewProps {
  onComplete: (data: {
    name: string;
    description: string;
    systemPrompt: string;
    suggestedFolders?: string[];
    avatarUrl?: string;
    iconUrl?: string;
  }) => void;
}

type AssistantType = 'legal' | 'customer-service' | 'research' | 'knowledge-base' | 'writing' | 'custom';
type AssistantExpertise = string[];
type AssistantTone = 'professional' | 'friendly' | 'technical' | 'conversational' | 'concise';
type AssistantPrimaryUse = 'advising' | 'research' | 'drafting' | 'qa' | 'client-interaction';

interface InterviewQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'radio' | 'checkbox' | 'avatar-select';
  options?: string[];
  answer?: string | string[];
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

// Standard avatar options
const avatarOptions = [
  { src: './images/avatar-male-1.svg', name: 'Male Avatar 1' },
  { src: './images/avatar-female-1.svg', name: 'Female Avatar 1' },
  { src: './images/avatar-female-2.svg', name: 'Female Avatar 2' },
  { src: './images/default-avatar.svg', name: 'Default Avatar' },
];

export function AssistantSetupInterview({ onComplete }: AssistantSetupInterviewProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assistantName, setAssistantName] = useState('');
  const [assistantType, setAssistantType] = useState<AssistantType | ''>('');
  const [expertise, setExpertise] = useState<AssistantExpertise>([]);
  const [tone, setTone] = useState<AssistantTone>('professional');
  const [primaryUse, setPrimaryUse] = useState<AssistantPrimaryUse | ''>('');
  const [limitations, setLimitations] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  
  // Generated results
  const [generatedName, setGeneratedName] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatedSystemPrompt, setGeneratedSystemPrompt] = useState('');
  const [suggestedFolders, setSuggestedFolders] = useState<string[]>([]);
  
  // Interview process steps
  const steps = [
    { title: "Basic Information", description: "Let's start with the basics about your assistant" },
    { title: "Expertise & Focus", description: "Define what your assistant specializes in" },
    { title: "Tone & Approach", description: "How should your assistant communicate?" },
    { title: "Appearance", description: "Choose an avatar for your assistant" },
    { title: "Limitations", description: "What should your assistant avoid?" },
    { title: "Review & Generate", description: "Create your customized assistant" }
  ];
  
  // Dynamic interview questions based on the selected assistant type
  const [currentQuestions, setCurrentQuestions] = useState<InterviewQuestion[]>([]);
  
  useEffect(() => {
    // Set up questions based on the current step
    switch(step) {
      case 0:
        setCurrentQuestions([
          {
            id: 'assistant-name',
            question: 'What would you like to name your assistant?',
            type: 'text',
            placeholder: 'e.g., Legal Advisor, Customer Support Bot',
            required: false,
            helpText: 'You can leave this blank and we can suggest a name later'
          },
          {
            id: 'assistant-type',
            question: 'What type of assistant are you creating?',
            type: 'select',
            options: ['legal', 'customer-service', 'research', 'knowledge-base', 'writing', 'custom'],
            required: true,
            helpText: 'This helps us tailor the assistant to your needs'
          }
        ]);
        break;
      case 1:
        // Different questions based on assistant type
        if (assistantType === 'legal') {
          setCurrentQuestions([
            {
              id: 'legal-expertise',
              question: 'What legal areas should the assistant specialize in?',
              type: 'multi-select',
              options: [
                'Personal Injury', 
                'Workers Compensation', 
                'Employment Law', 
                'Family Law', 
                'Criminal Defense',
                'Corporate Law',
                'Intellectual Property',
                'Real Estate Law',
                'Immigration Law',
                'General Practice'
              ],
              required: true
            },
            {
              id: 'primary-use',
              question: 'What will be the primary use of this assistant?',
              type: 'select',
              options: [
                'advising', 
                'research', 
                'drafting', 
                'qa', 
                'client-interaction'
              ],
              required: true,
              helpText: 'This helps determine what capabilities to prioritize'
            }
          ]);
        } else if (assistantType === 'customer-service') {
          setCurrentQuestions([
            {
              id: 'product-knowledge',
              question: 'What products or services will this assistant support?',
              type: 'textarea',
              required: true,
              placeholder: 'List the main products/services the assistant should know about'
            },
            {
              id: 'primary-use',
              question: 'What will be the primary use of this assistant?',
              type: 'select',
              options: [
                'Basic Information', 
                'Troubleshooting', 
                'Order Status', 
                'Returns & Refunds',
                'Policy Questions'
              ],
              required: true
            }
          ]);
        } else {
          // Generic questions for other types
          setCurrentQuestions([
            {
              id: 'expertise-areas',
              question: 'What specific areas should this assistant specialize in?',
              type: 'textarea',
              required: true,
              placeholder: 'List the main topics, skills, or knowledge areas'
            },
            {
              id: 'primary-use',
              question: 'What will be the primary use of this assistant?',
              type: 'textarea',
              required: true,
              placeholder: 'Describe how users will primarily interact with this assistant'
            }
          ]);
        }
        break;
      case 2:
        setCurrentQuestions([
          {
            id: 'tone',
            question: 'What tone should the assistant use?',
            type: 'select',
            options: ['professional', 'friendly', 'technical', 'conversational', 'concise'],
            required: true,
            helpText: 'This affects how the assistant communicates'
          },
          {
            id: 'approach',
            question: 'How should the assistant approach problems?',
            type: 'checkbox',
            options: [
              'Provide detailed explanations',
              'Offer multiple options when possible',
              'Ask clarifying questions when needed',
              'Focus on brevity and quick answers',
              'Include relevant legal citations (if applicable)',
              'Use plain language rather than technical terms'
            ],
            required: false
          }
        ]);
        break;
      case 3:
        // Avatar selection step
        setCurrentQuestions([
          {
            id: 'avatar-selection',
            question: 'Choose an avatar for your assistant',
            type: 'avatar-select',
            required: false,
            helpText: 'This avatar will represent your assistant in conversations'
          }
        ]);
        break;
      case 4:
        setCurrentQuestions([
          {
            id: 'limitations',
            question: 'What should the assistant avoid or be careful about?',
            type: 'checkbox',
            options: [
              'Avoid giving specific legal advice (only general information)',
              'Do not handle sensitive personal information',
              'Do not discuss specific pricing or fees',
              'Avoid making guarantees about case outcomes',
              'Do not attempt to diagnose medical conditions',
              'Always refer complex questions to a human',
              'Do not process payments or financial transactions'
            ],
            required: false,
            helpText: 'Setting clear boundaries helps the assistant know what to avoid'
          },
          {
            id: 'additional-info',
            question: 'Is there anything else we should know about this assistant?',
            type: 'textarea',
            required: false,
            placeholder: 'Add any other details that will help us create your perfect assistant'
          }
        ]);
        break;
      default:
        setCurrentQuestions([]);
    }
  }, [step, assistantType]);

  // Handle answering questions
  const handleTextAnswer = (questionId: string, answer: string) => {
    if (questionId === 'assistant-name') {
      setAssistantName(answer);
    } else if (questionId === 'additional-info') {
      setAdditionalInfo(answer);
    }
    
    setCurrentQuestions(questions => 
      questions.map(q => 
        q.id === questionId ? { ...q, answer: answer } : q
      )
    );
  };
  
  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (questionId === 'assistant-type') {
      setAssistantType(answer as AssistantType);
    } else if (questionId === 'tone') {
      setTone(answer as AssistantTone);
    } else if (questionId === 'primary-use') {
      setPrimaryUse(answer as AssistantPrimaryUse);
    }
    
    setCurrentQuestions(questions => 
      questions.map(q => 
        q.id === questionId ? { ...q, answer: answer } : q
      )
    );
  };
  
  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    
    setCurrentQuestions(questions => 
      questions.map(q => 
        q.id === 'avatar-selection' ? { ...q, answer: avatarUrl } : q
      )
    );
  };
  
  const handleMultiSelectAnswer = (questionId: string, answers: string[]) => {
    if (questionId === 'legal-expertise' || questionId === 'expertise-areas') {
      setExpertise(answers);
    } else if (questionId === 'limitations') {
      setLimitations(answers);
    } else if (questionId === 'approach') {
      // Store approach choices
    }
    
    setCurrentQuestions(questions => 
      questions.map(q => 
        q.id === questionId ? { ...q, answer: answers } : q
      )
    );
  };
  
  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const question = currentQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    const currentAnswers = question.answer as string[] || [];
    let newAnswers: string[];
    
    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter(item => item !== option);
    }
    
    handleMultiSelectAnswer(questionId, newAnswers);
  };

  // Generate the assistant configuration based on the interview answers
  const generateAssistantConfig = async () => {
    setLoading(true);
    try {
      // Prompt for generating the assistant config
      const systemPrompt = `
You are an expert AI assistant configuration generator. Based on the following interview responses, 
create a complete assistant configuration including name (if not provided), description, and system prompt.

USER RESPONSES:
Name: ${assistantName || '(not specified)'}
Type of assistant: ${assistantType}
Areas of expertise: ${expertise.join(', ') || '(not specified)'}
Tone: ${tone}
Primary use case: ${primaryUse || '(not specified)'}
Limitations/boundaries: ${limitations.join(', ') || '(none specified)'}
Additional notes: ${additionalInfo || '(none provided)'}

Please generate:
1. A suitable name (if not already provided)
2. A concise but comprehensive description (2-3 sentences)
3. A detailed system prompt that covers:
   - The assistant's role and purpose
   - Key areas of expertise
   - Communication style/tone
   - Limitations and boundaries
   - How to handle unclear requests
4. A list of knowledge folder names that would be helpful for this assistant (3-5 folder names)

Format your response exactly as follows (with no additional text):
NAME: [assistant name]
DESCRIPTION: [description]
SYSTEM PROMPT: [system prompt]
KNOWLEDGE FOLDERS: [folder name 1], [folder name 2], [folder name 3]
`;

      const response = await geminiSimplifiedService.getCompletion([{ text: systemPrompt }], {
        temperature: 0.7,
        maxTokens: 1500
      });
      
      // Parse the response
      const nameMatch = response.match(/NAME: (.*?)(?:\n|$)/);
      const descriptionMatch = response.match(/DESCRIPTION: (.*?)(?:\n|$)/);
      const systemPromptMatch = response.match(/SYSTEM PROMPT: ([\s\S]*?)(?:\nKNOWLEDGE FOLDERS:|$)/);
      const foldersMatch = response.match(/KNOWLEDGE FOLDERS: (.*?)(?:\n|$)/);
      
      if (nameMatch && nameMatch[1]) {
        setGeneratedName(assistantName || nameMatch[1].trim());
      }
      
      if (descriptionMatch && descriptionMatch[1]) {
        setGeneratedDescription(descriptionMatch[1].trim());
      }
      
      if (systemPromptMatch && systemPromptMatch[1]) {
        setGeneratedSystemPrompt(systemPromptMatch[1].trim());
      }
      
      if (foldersMatch && foldersMatch[1]) {
        setSuggestedFolders(
          foldersMatch[1].split(',').map(folder => folder.trim())
        );
      }
    } catch (err) {
      console.error('Error generating assistant config:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = async () => {
    // Validate current step
    const requiredQuestions = currentQuestions.filter(q => q.required);
    const allAnswered = requiredQuestions.every(q => q.answer);
    
    if (!allAnswered) {
      // Show some validation error
      alert("Please answer all required questions before continuing");
      return;
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Final step - generate the assistant config
      await generateAssistantConfig();
    }
  };
  
  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  const handleComplete = () => {
    onComplete({
      name: generatedName,
      description: generatedDescription,
      systemPrompt: generatedSystemPrompt,
      suggestedFolders,
      avatarUrl: selectedAvatar || undefined
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <BrainCircuit className="h-4 w-4 mr-2" />
          AI Setup Interview
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step < steps.length ? `Assistant Setup: ${steps[step].title}` : "Your Assistant Configuration"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Indicator */}
        {step < steps.length && (
          <div className="flex justify-between mb-6">
            {steps.map((s, i) => (
              <div 
                key={i} 
                className={`flex flex-col items-center ${i === step ? 'text-primary' : i < step ? 'text-muted-foreground' : 'text-muted'}`}
                style={{ width: `${100 / steps.length}%` }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 
                  ${i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20' : 'bg-muted'}`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <p className="text-xs text-center">{s.title}</p>
              </div>
            ))}
          </div>
        )}
        
        {/* Interview questions */}
        {step < steps.length && (
          <div className="space-y-6 py-2">
            <p className="text-muted-foreground text-sm">
              {steps[step].description}
            </p>
            
            {currentQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <div className="flex items-start">
                  <Label htmlFor={q.id} className="text-sm font-medium">
                    {q.question} 
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {q.helpText && (
                    <div className="relative ml-1 group">
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      <div className="absolute left-full top-0 ml-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-md hidden group-hover:block z-10">
                        {q.helpText}
                      </div>
                    </div>
                  )}
                </div>
                
                {q.type === 'text' && (
                  <Input 
                    id={q.id}
                    value={(q.answer as string) || ''}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                  />
                )}
                
                {q.type === 'textarea' && (
                  <Textarea 
                    id={q.id}
                    value={(q.answer as string) || ''}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={3}
                  />
                )}
                
                {q.type === 'select' && (
                  <Select
                    onValueChange={(value: string) => handleSelectAnswer(q.id, value)}
                    value={(q.answer as string) || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {q.type === 'checkbox' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <div key={option} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`${q.id}-${option}`} 
                          checked={((q.answer as string[]) || []).includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(q.id, option, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`${q.id}-${option}`}
                          className="text-sm font-normal leading-tight"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                
                {q.type === 'avatar-select' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {avatarOptions.map((avatar) => (
                      <div 
                        key={avatar.src} 
                        className={`flex flex-col items-center p-2 rounded-md cursor-pointer transition-all
                          ${selectedAvatar === avatar.src 
                            ? 'border-2 border-primary bg-primary/5' 
                            : 'border border-muted hover:border-primary/50 hover:bg-muted/10'
                          }`}
                        onClick={() => handleAvatarSelect(avatar.src)}
                      >
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={avatar.src} alt={avatar.name} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-center">{avatar.name}</span>
                      </div>
                    ))}
                    <ImageGeneratorModal 
                      assistantName={assistantName || "New Assistant"}
                      assistantDescription={additionalInfo} 
                      onImageGenerated={(imageUrl, type) => {
                        if (type === 'avatar') {
                          setSelectedAvatar(imageUrl);
                          handleAvatarSelect(imageUrl);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Review configuration */}
        {step === steps.length && (
          <div className="space-y-6 py-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">
                  Generating your assistant configuration...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    {selectedAvatar ? (
                      <AvatarImage src={selectedAvatar} alt="Assistant avatar" />
                    ) : (
                      <AvatarFallback>
                        <Bot className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{generatedName || assistantName || "Your New Assistant"}</h3>
                    <p className="text-muted-foreground text-sm">{generatedDescription}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">System Prompt</h4>
                  <Card className="p-3 text-sm bg-muted/10">
                    <pre className="whitespace-pre-wrap font-sans">
                      {generatedSystemPrompt}
                    </pre>
                  </Card>
                </div>
                
                {suggestedFolders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Suggested Knowledge Folders</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestedFolders.map((folder) => (
                        <Badge key={folder} variant="secondary">
                          {folder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between">
          <div>
            {step > 0 && step < steps.length && (
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
            )}
          </div>
          <div>
            {step < steps.length - 1 && (
              <Button onClick={handleNext}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === steps.length - 1 && (
              <Button onClick={handleNext}>
                Generate Configuration
                <BrainCircuit className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === steps.length && (
              <Button onClick={handleComplete} disabled={loading}>
                Complete Setup
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}