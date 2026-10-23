// Enhanced Assistant Interview System with Knowledge Base Integration
// Automatically creates MD files from interview sessions

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { Loader2, MessageSquare, ArrowRight, Check, Brain, UserCircle, Bot, Settings, FileText, Save } from 'lucide-react';
import { assistantConversationService } from '../../services/ai/assistantConversationService';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedInterviewWizardProps {
  assistantName: string;
  assistantDescription?: string;
  systemPrompt?: string;
  profession?: 'legal' | 'medical' | 'business' | 'technical' | 'general';
  onComplete: (result: {
    name: string;
    description: string;
    systemPrompt: string;
    suggestedFolders: string[];
    suggestedCapabilities: string[];
    knowledgeBaseFiles: InterviewKnowledgeFile[];
  }) => void;
}

interface InterviewKnowledgeFile {
  filename: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  profession: string;
  interviewStep: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  step?: InterviewStep;
}

type InterviewStep = 'purpose' | 'capabilities' | 'tone' | 'knowledge' | 'clients' | 'documents' | 'ethics' | 'review';

interface ProfessionTemplate {
  steps: InterviewStep[];
  questions: Record<InterviewStep, {
    question: string;
    hint: string;
    placeholder: string;
    followUps: string[];
  }>;
  knowledgeTemplates: {
    step: InterviewStep;
    filename: string;
    title: string;
    template: string;
  }[];
}

export function EnhancedInterviewWizard({
  assistantName,
  assistantDescription,
  systemPrompt,
  profession = 'general',
  onComplete
}: EnhancedInterviewWizardProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('purpose');
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingResult, setIsGeneratingResult] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<InterviewKnowledgeFile[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);

  // Professional interview templates
  const professionTemplates: Record<string, ProfessionTemplate> = {
    legal: {
      steps: ['purpose', 'clients', 'documents', 'ethics', 'capabilities', 'knowledge', 'review'],
      questions: {
        purpose: {
          question: "What specific legal services will this assistant provide? (e.g., estate planning, contract review, legal research)",
          hint: "Focus on the primary legal practice area and client needs",
          placeholder: "This legal assistant should help with...",
          followUps: [
            "What types of clients will you primarily serve?",
            "Are there any practice areas you want to avoid?",
            "Do you need state-specific guidance?"
          ]
        },
        clients: {
          question: "Describe your typical clients and their legal needs. What client intake process do you follow?",
          hint: "Consider demographics, common issues, communication preferences",
          placeholder: "My clients typically need help with...",
          followUps: [
            "How do you currently screen potential clients?",
            "What information do you gather during initial consultations?",
            "Are there any red flags or conflicts you watch for?"
          ]
        },
        documents: {
          question: "What legal documents does this assistant need to help prepare, review, or manage?",
          hint: "List document types, templates, compliance requirements",
          placeholder: "The assistant should help with documents like...",
          followUps: [
            "What document execution requirements must be followed?",
            "Are there state-specific formatting requirements?",
            "Do you need help with legal citations and research?"
          ]
        },
        ethics: {
          question: "What ethical boundaries and professional limitations should this assistant observe?",
          hint: "Consider unauthorized practice, confidentiality, attorney supervision",
          placeholder: "The assistant must always...",
          followUps: [
            "When should the assistant recommend attorney consultation?",
            "How should confidential information be handled?",
            "What disclaimers are needed in communications?"
          ]
        },
        tone: {
          question: "How should this legal assistant communicate with clients and colleagues?",
          hint: "Consider professionalism, accessibility, formality for legal context",
          placeholder: "The assistant should communicate in a...",
          followUps: [
            "Should it use plain English or legal terminology?",
            "How formal should interactions be?",
            "What tone is appropriate for different client types?"
          ]
        },
        capabilities: {
          question: "What specific legal research and analysis capabilities should this assistant have?",
          hint: "Legal databases, citation formats, case law analysis",
          placeholder: "The assistant should be able to...",
          followUps: []
        },
        knowledge: {
          question: "What specialized legal knowledge domains should this assistant master?",
          hint: "Practice areas, jurisdictions, court rules, statutes",
          placeholder: "It needs deep expertise in...",
          followUps: []
        },
        review: {
          question: "Let's review your legal assistant configuration. Any additional requirements or modifications?",
          hint: "Consider malpractice insurance, professional standards, technology rules",
          placeholder: "Additionally, the assistant should...",
          followUps: []
        }
      },
      knowledgeTemplates: [
        {
          step: 'clients',
          filename: 'client-intake-procedures.md',
          title: 'Client Intake and Screening Procedures',
          template: `# Client Intake and Screening Procedures

## Initial Client Contact
- Conflict check procedures
- Preliminary assessment criteria
- Intake form requirements
- Confidentiality agreements

## Client Interview Process
{{CLIENT_INTERVIEW_DETAILS}}

## Documentation Requirements
- Required client information
- Asset and liability inventory
- Family structure documentation
- Previous legal documents review`
        },
        {
          step: 'documents',
          filename: 'legal-document-templates.md',
          title: 'Legal Document Preparation Guidelines',
          template: `# Legal Document Preparation Guidelines

## Document Types and Requirements
{{DOCUMENT_TYPES}}

## Execution Requirements
- Witness requirements
- Notarization needs
- State-specific compliance
- Filing procedures

## Quality Control Checklist
- Content accuracy verification
- Legal compliance review
- Client approval process
- Final execution procedures`
        },
        {
          step: 'ethics',
          filename: 'professional-ethics-guidelines.md',
          title: 'Professional Ethics and Compliance',
          template: `# Professional Ethics and Compliance

## Ethical Boundaries
{{ETHICAL_GUIDELINES}}

## Unauthorized Practice Prevention
- Clear scope limitations
- Attorney supervision requirements
- When to refer to attorney

## Confidentiality Protocols
- Information protection standards
- Client communication security
- Document retention policies`
        }
      ]
    },
    general: {
      steps: ['purpose', 'capabilities', 'tone', 'knowledge', 'review'],
      questions: {
        purpose: {
          question: "What's the primary purpose of this assistant? What problems should it solve?",
          hint: "Be specific about the assistant's main job and who it's helping",
          placeholder: "This assistant should help with...",
          followUps: []
        },
        capabilities: {
          question: "What specific skills or capabilities should this assistant have?",
          hint: "List key functions or tasks it should perform well",
          placeholder: "It should be able to...",
          followUps: []
        },
        tone: {
          question: "How should this assistant communicate? What tone and style should it use?",
          hint: "Consider formality, friendliness, brevity, etc.",
          placeholder: "The assistant should sound...",
          followUps: []
        },
        knowledge: {
          question: "What specialized knowledge domains should this assistant have expertise in?",
          hint: "List specific subjects, industries, or technical areas",
          placeholder: "It needs expertise in...",
          followUps: []
        },
        review: {
          question: "Let's finalize your assistant. Any last adjustments before we generate the configuration?",
          hint: "Review the conversation and add any missing details",
          placeholder: "Additionally, the assistant should...",
          followUps: []
        },
        clients: {
          question: "Who are the target users for this assistant?",
          hint: "Consider demographics, skill levels, and needs",
          placeholder: "This assistant is designed for...",
          followUps: []
        },
        documents: {
          question: "What documents or files will this assistant work with?",
          hint: "Consider input/output formats and processing needs",
          placeholder: "The assistant should handle...",
          followUps: []
        },
        ethics: {
          question: "What ethical considerations or limitations apply to this assistant?",
          hint: "Consider privacy, accuracy, and appropriate use",
          placeholder: "The assistant must...",
          followUps: []
        }
      },
      knowledgeTemplates: []
    }
  };

  const currentTemplate = professionTemplates[profession] || professionTemplates.general;

  // Generate knowledge base file from interview step
  const generateKnowledgeFile = async (step: InterviewStep, userResponse: string, assistantResponse: string): Promise<InterviewKnowledgeFile | null> => {
    const template = currentTemplate.knowledgeTemplates.find(t => t.step === step);
    if (!template) return null;

    // Process the template with interview data
    let content = template.template;
    
    // Replace placeholders with interview responses
    const placeholderMap: Record<string, string> = {
      'CLIENT_INTERVIEW_DETAILS': userResponse,
      'DOCUMENT_TYPES': userResponse,
      'ETHICAL_GUIDELINES': userResponse,
      'ASSISTANT_ANALYSIS': assistantResponse
    };

    Object.entries(placeholderMap).forEach(([placeholder, replacement]) => {
      content = content.replace(`{{${placeholder}}}`, replacement);
    });

    // Add metadata header
    const frontMatter = `---
title: "${template.title}"
profession: "${profession}"
interview_step: "${step}"
created_at: "${new Date().toISOString()}"
assistant_name: "${assistantName}"
category: "${step}"
tags: ["${profession}", "${step}", "interview-generated", "assistant-setup"]
---

`;

    const knowledgeFile: InterviewKnowledgeFile = {
      filename: template.filename,
      title: template.title,
      content: frontMatter + content,
      category: step,
      tags: [profession, step, 'interview-generated'],
      profession,
      interviewStep: step
    };

    return knowledgeFile;
  };

  // Handle sending a message in the interview
  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      step: currentStep
    };

    setMessages(prev => [...prev, userMessage]);
    const currentUserInput = userInput;
    setUserInput('');
    setIsProcessing(true);

    try {
      // Determine next step
      const currentStepIndex = currentTemplate.steps.indexOf(currentStep);
      const nextStep = currentStepIndex < currentTemplate.steps.length - 1 
        ? currentTemplate.steps[currentStepIndex + 1] 
        : currentStep;

      // Generate assistant response
      const assistantPrompt = `
You are interviewing the user to help configure a ${profession} AI assistant named "${assistantName}".
${assistantDescription ? `Current description: "${assistantDescription}"` : ''}

Current step: ${currentStep} (${profession} profession)
User's response: "${currentUserInput}"

Based on the user's response, provide:
1. An acknowledgment of their input with professional expertise
2. A thoughtful follow-up or clarification if needed
3. ${nextStep !== currentStep ? `Introduce the next topic: ${currentTemplate.questions[nextStep].question}` : 'Ask for final adjustments'}

Keep your response conversational, professional, and focused on creating the best ${profession} assistant.
`;

      const assistantResponse = await assistantConversationService.generateResponse(
        assistantPrompt,
        {
          name: `${profession} Interview Assistant`,
          description: `Helps create ${profession} AI assistants through professional interview`
        },
        []
      );

      // Add assistant's response
      const responseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        step: currentStep
      };

      setMessages(prev => [...prev, responseMessage]);

      // Generate knowledge base file for this step
      const knowledgeFile = await generateKnowledgeFile(currentStep, currentUserInput, assistantResponse);
      if (knowledgeFile) {
        setKnowledgeFiles(prev => {
          const filtered = prev.filter(f => f.interviewStep !== currentStep);
          return [...filtered, knowledgeFile];
        });
      }
      
      // Update step
      setCurrentStep(nextStep);
    } catch (error) {
      console.error('Error in interview process:', error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'system',
        content: 'Sorry, I encountered an error. Let\'s continue.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate final configuration with knowledge base files
  const generateConfiguration = async () => {
    setIsGeneratingResult(true);
    
    try {
      const configPrompt = `
Create a comprehensive ${profession} assistant configuration based on this interview:

Assistant Name: "${assistantName}"
Profession: ${profession}

INTERVIEW CONVERSATION:
${messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n\n')}

Generate JSON with:
1. Enhanced name (improve "${assistantName}" if needed)
2. Professional description for ${profession} assistant
3. Comprehensive system prompt with ${profession}-specific guidelines
4. Suggested knowledge folders for ${profession} practice
5. Professional capabilities list

Format as JSON: {name, description, systemPrompt, suggestedFolders, suggestedCapabilities}
`;

      const configResponse = await assistantConversationService.generateResponse(
        configPrompt,
        {
          name: 'Configuration Assistant',
          description: 'Generates professional assistant configurations'
        },
        []
      );
      
      try {
        const parsedResult = JSON.parse(configResponse);
        
        // Add knowledge base files to result
        const finalResult = {
          ...parsedResult,
          knowledgeBaseFiles: knowledgeFiles
        };
        
        setFinalResult(finalResult);
        
        // Add summary message
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: `🎉 Configuration complete! I've created:

📋 **${parsedResult.name}** - ${profession} assistant
📁 **${knowledgeFiles.length} Knowledge Base Files** auto-generated from our interview
🔧 **${parsedResult.suggestedCapabilities.length} Professional Capabilities**
📚 **${parsedResult.suggestedFolders.length} Suggested Knowledge Folders**

Knowledge files created:
${knowledgeFiles.map(f => `• ${f.title}`).join('\n')}`,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error parsing configuration:', error);
      }
    } catch (error) {
      console.error('Error generating configuration:', error);
    } finally {
      setIsGeneratingResult(false);
    }
  };

  const handleApplyConfiguration = () => {
    if (finalResult) {
      onComplete(finalResult);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          Professional Interview
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {profession.charAt(0).toUpperCase() + profession.slice(1)} Assistant Interview
            <Badge variant="outline">{knowledgeFiles.length} KB Files</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Steps and Knowledge Files sidebar */}
          <div className="w-1/3 border-r pr-4 flex flex-col">
            <div className="text-sm font-medium mb-2">Interview Progress</div>
            <div className="space-y-1 mb-4">
              {currentTemplate.steps.map((step, index) => {
                const isCompleted = currentTemplate.steps.indexOf(currentStep) > index;
                const isCurrent = currentStep === step;
                
                return (
                  <div key={step} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    isCurrent ? 'bg-primary/10 border border-primary/20' : 
                    isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/30'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className={isCurrent ? 'font-medium' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
            
            {knowledgeFiles.length > 0 && (
              <>
                <div className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Generated Knowledge Files
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {knowledgeFiles.map((file, index) => (
                      <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                        <div className="font-medium text-blue-800 dark:text-blue-200">{file.title}</div>
                        <div className="text-blue-600 dark:text-blue-400">{file.filename}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs py-0">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
            
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
                    <Save className="h-4 w-4 mr-2" />
                    Generate Config
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Conversation area */}
          <div className="flex-1 flex flex-col h-[60vh] overflow-hidden">
            {/* Current question */}
            <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{profession}</Badge>
                <Badge variant="outline">{currentStep}</Badge>
              </div>
              <h4 className="font-medium mb-1">{currentTemplate.questions[currentStep].question}</h4>
              <p className="text-sm text-muted-foreground">{currentTemplate.questions[currentStep].hint}</p>
            </Card>
            
            {/* Message history */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
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
                          : 'bg-card border border-border'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-line">
                        {message.content}
                      </div>
                      {message.step && (
                        <div className="mt-1 text-xs opacity-70">
                          Step: {message.step}
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <UserCircle className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3">
                      <div className="text-sm">Processing your response...</div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="flex gap-2 mt-4">
              <Input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                disabled={isProcessing || isGeneratingResult}
                placeholder={currentTemplate.questions[currentStep].placeholder}
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
                ✅ Configuration ready with {knowledgeFiles.length} knowledge base files
              </div>
              <Button onClick={handleApplyConfiguration} className="gap-1">
                <Check className="h-4 w-4" />
                Apply Configuration & Save KB Files
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

export default EnhancedInterviewWizard;