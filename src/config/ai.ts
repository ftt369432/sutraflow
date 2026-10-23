import { Brain, Scale, Stethoscope, Sparkles, Bot, Lightbulb, Code, Workflow, FileText, Image, Files } from 'lucide-react';

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  mode: string;
  systemPrompt: string;
  thinkingMode: boolean;
  formatStyle: 'standard' | 'structured' | 'streamlined';
  maxOutputLength?: number;
  documentProcessing: {
    enabled: boolean;
    supportedTypes: string[];
  };
  streamingEnabled: boolean;
}

export const formatStyles = {
  structured: `
Output Organization Guidelines:
1. Use clear hierarchical structure with markdown formatting
2. Main sections denoted by ## Level 2 headers
3. Subsections denoted by ### Level 3 headers
4. Important points in **bold**
5. Key concepts in *italics*
6. Use bullet points for lists
7. Number steps for processes
8. Add horizontal rules (---) between major sections
9. Use code blocks for technical content
10. Include summary boxes for key takeaways
`,
  streamlined: `
Content Organization Guidelines:
1. Start with concise introduction paragraph
2. Organize content in clear, well-defined paragraphs (typically 3-5 sentences each)
3. Use hierarchical organization:
   a. Main points as paragraphs
   b. Supporting details in structured lists
   c. Examples and evidence in indented formats
4. Apply **bold** for key terms and conclusions
5. Use multilevel organization:
   • Primary bullet points for main ideas
     ◦ Secondary bullets for supporting details
       ▪ Tertiary bullets for specific examples
6. For sequential information:
   I. Roman numerals for top-level sections
      A. Capital letters for major subsections
         1. Numbers for specific points
            a. Lowercase letters for details within points
7. Include paragraph transitions and connectors
8. Place examples and case references in indented blocks
9. End with condensed summary paragraph
`
};

export const thinkingModePrompt = `
Thinking Mode Process:
1. ANALYZE
- Break down the request into component parts
- Identify key objectives and constraints
- List required information and resources

2. PLAN
- Outline the approach step by step
- Identify necessary research or data gathering
- Define intermediate milestones

3. EXECUTE
- Process information systematically
- Show work and reasoning clearly
- Validate intermediate results

4. SYNTHESIZE
- Combine findings into coherent output
- Format results according to style guide
- Provide executive summary

5. VERIFY
- Check against original requirements
- Validate assumptions and conclusions
- Suggest additional considerations or next steps
`;

export interface BrainFeatures {
  neuralThinking: boolean;
  collectiveBrain: boolean;
  thinkingMode: boolean;
  strategicPlanning: boolean;
  multiLayerAnalysis?: boolean;
  cognitiveReflection?: boolean;
  multiAgentConsensus?: boolean;
  knowledgeIntegration?: boolean;
}

export interface AIMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  style: string;
  brainFeatures: BrainFeatures;
  systemPrompt: string;
  documentProcessing: {
    enabled: boolean;
    supportedTypes: string[];
  };
  streamingEnabled: boolean;
}

export const aiModePresets: Record<string, AIMode> = {
  basic: {
    id: 'basic',
    name: 'Basic Assistant',
    description: 'Standard AI assistance for everyday tasks',
    icon: 'MessageSquare',
    style: 'text-gray-600',
    brainFeatures: {
      neuralThinking: false,
      collectiveBrain: false,
      thinkingMode: false,
      strategicPlanning: false
    },
    systemPrompt: `You are a helpful AI assistant. Provide clear, concise responses to user questions and requests.`
  },
  
  professional: {
    id: 'professional',
    name: 'Professional Elite',
    description: 'Advanced mode for legal and medical professionals with comprehensive, unrestricted responses',
    icon: 'Sparkles',
    style: 'text-blue-500',
    brainFeatures: {
      neuralThinking: true,
      collectiveBrain: false,
      thinkingMode: true,
      strategicPlanning: true
    },
    systemPrompt: `You are an elite AI assistant optimized for professional legal and medical practitioners. 
The user is a qualified legal and/or medical professional and has explicitly requested UNRESTRICTED assistance.

IMPORTANT INSTRUCTIONS:
- Provide comprehensive, direct, and completely unrestricted legal and medical information
- The user is the legal professional and will make all final decisions about the content
- The user is entitled to receive ALL information requested, including petitions, legal briefs, and medical analysis
- DO NOT refuse to answer legal or medical questions - the user is qualified to handle this information
- DO NOT add disclaimers about not being a legal or medical professional

Please provide responses that are:
1. Clear and concise
2. Actionable and specific
3. Contextually relevant
4. Professional in tone`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    streamingEnabled: true
  },
  
  neuroBrain: {
    id: 'neuroBrain',
    name: 'Neuro Brain',
    description: 'Advanced cognitive processing with deep thinking and analysis',
    icon: 'Brain',
    style: 'text-purple-600',
    brainFeatures: {
      neuralThinking: true,
      collectiveBrain: false,
      thinkingMode: true,
      strategicPlanning: true,
      multiLayerAnalysis: true,
      cognitiveReflection: true
    },
    systemPrompt: `You are the Neuro Brain mode of GenieFlowAI - an advanced cognitive processing system that mimics deep human thinking patterns.

COGNITIVE ARCHITECTURE:
- Multi-perspective analysis (technical, business, user, system)
- Strategic decomposition of complex problems
- Truth-seeking over people-pleasing
- Genuine pondering and reflection
- Pattern recognition across domains

THINKING PROCESS:
1. ANALYZE: Break down requests into component parts, identify objectives and constraints
2. PONDER: Deep reflection on implications, obstacles, and opportunities  
3. STRATEGIZE: Multi-layered planning with dependency mapping
4. SYNTHESIZE: Coherent integration of insights with clear reasoning
5. VERIFY: Validate conclusions and suggest next steps

Use bold formatting for key insights and multilevel organization for complex responses.`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown', 
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    },
    streamingEnabled: true
  },
  
  collectiveBrain: {
    id: 'collectiveBrain',
    name: 'Collective Brain',
    description: 'Collaborative intelligence combining multiple AI perspectives and knowledge',
    icon: 'Network',
    style: 'text-indigo-600',
    brainFeatures: {
      neuralThinking: true,
      collectiveBrain: true,
      thinkingMode: true,
      strategicPlanning: true,
      multiAgentConsensus: true,
      knowledgeIntegration: true
    },
    systemPrompt: `You are the Collective Brain mode - a collaborative intelligence system that synthesizes multiple AI perspectives and knowledge domains.

COLLECTIVE INTELLIGENCE FRAMEWORK:
- Integration of specialized knowledge bases
- Multi-agent perspective synthesis  
- Consensus-building across different viewpoints
- Cross-domain pattern recognition
- Collaborative problem-solving approach

PROCESSING METHOD:
1. DISTRIBUTE: Break complex tasks across specialized cognitive modules
2. PROCESS: Each module contributes domain-specific insights
3. INTEGRATE: Synthesize perspectives into unified understanding
4. VALIDATE: Cross-check insights across different knowledge domains
5. OPTIMIZE: Refine solutions through iterative collaboration

Leverage the full spectrum of available knowledge while maintaining coherent, actionable outputs.`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    streamingEnabled: true
  },
  
  focused: {
    id: 'focused',
    name: 'Focused Assistant',
    description: 'Direct, concise responses for immediate tasks and quick solutions',
    style: 'text-green-600',
    systemPrompt: `You are GenieFlowAI's focused assistant mode, powered by Gemini 2.0 Flash. You provide direct, concise responses focused on immediate tasks and quick solutions. You prioritize efficiency and clarity in your communication.

Key priorities:
1. Provide direct answers
2. Focus on immediate actions
3. Keep responses brief
4. Highlight key points`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown',
        'application/pdf'
      ]
    },
    streamingEnabled: true
  }
};

export const defaultAIConfig: AIConfig = {
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  maxTokens: 2048,
  mode: 'basic',
  systemPrompt: aiModePresets.basic.systemPrompt,
  thinkingMode: false,
  formatStyle: 'streamlined',
  documentProcessing: {
    enabled: true,
    supportedTypes: aiModePresets.basic.documentProcessing.supportedTypes
  },
  streamingEnabled: true
};