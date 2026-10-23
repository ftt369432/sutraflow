interface ManualSection {
  title: string;
  content: string;
  category: 'navigation' | 'features' | 'agents' | 'automation' | 'general' | 'architecture' | 'core';
  keywords: string[];
}

export class ManualKnowledgeBaseService {
  private manualSections: ManualSection[] = [
    // Navigation Help
    {
      title: "System Navigation",
      content: `The GenieFlow AI system has several main sections:

**📧 Email Management** - Process, organize, and automate email workflows
**🤖 AI Assistant** - Chat with AI, get help, and manage conversations  
**👥 Assistants** - Create, manage, and deploy AI assistants
**🔧 AI Drive** - File management, storage, and document processing
**📅 Calendar** - Schedule management and calendar integration
**🎯 Tasks** - Task management and productivity features

**Navigation Tips:**
- Use the sidebar menu to switch between sections
- Click the menu icon (☰) to toggle the sidebar
- Use the notification bell for alerts and assistant access
- Look for the floating assistant button for quick help`,
      category: 'navigation',
      keywords: ['navigate', 'menu', 'sidebar', 'sections', 'features', 'where', 'find', 'access']
    },

    // Agent Building
    {
      title: "Building AI Agents",
      content: `**Agent Creation Process:**

1. **Go to Assistants Page** - Click "Assistants" in the main menu
2. **Click "Create New Assistant"** - Start the creation wizard
3. **Choose Agent Type:**
   - Email Processing Agent
   - Document Generation Agent  
   - Workflow Automation Agent
   - Custom Agent

4. **Configure Your Agent:**
   - **Name & Description** - Give your agent a clear purpose
   - **Instructions** - Define what the agent should do
   - **Knowledge Base** - Connect folders and documents
   - **Capabilities** - Select tools and functions
   - **Triggers** - Set when the agent should activate

5. **Test Your Agent** - Use the preview feature to validate behavior
6. **Deploy** - Activate your agent for use

**Pro Tips:**
- Be specific in your instructions
- Test with real examples
- Start simple and add complexity gradually
- Monitor agent performance regularly`,
      category: 'agents',
      keywords: ['agent', 'build', 'create', 'assistant', 'automation', 'workflow', 'instructions', 'deploy']
    },

    // Features Overview
    {
      title: "Key System Features",
      content: `**🧠 Conscious Assistant System:**
- Daily personalized greetings
- Aspiration and goal tracking
- Emotional state monitoring
- Intelligent conversation memory

**📧 Advanced Email Management:**
- Smart email categorization
- Automated responses
- Email workflow automation
- Calendar integration

**🤖 Universal Agent System:**
- Voice-activated agent creation
- Multi-modal agent capabilities
- Workflow automation
- Knowledge base integration

**🗃️ AI Drive:**
- Intelligent file organization
- Document processing
- Search and retrieval
- Version management

**📊 Analytics & Insights:**
- Usage patterns
- Performance metrics
- Productivity insights
- Learning analytics`,
      category: 'features',
      keywords: ['features', 'capabilities', 'what does', 'function', 'system', 'overview']
    },

    // Automation Help
    {
      title: "Automation Workflows",
      content: `**Creating Automated Workflows:**

1. **Email Automation:**
   - Auto-sort incoming emails
   - Generate automated responses
   - Schedule follow-up reminders
   - Extract and organize attachments

2. **Task Automation:**
   - Create tasks from emails
   - Set recurring reminders
   - Update project status
   - Generate reports

3. **Document Automation:**
   - Auto-generate documents
   - Extract information from PDFs
   - Organize files by content
   - Create summaries

4. **Calendar Automation:**
   - Schedule meetings automatically
   - Send meeting reminders
   - Block focus time
   - Sync across platforms

**Best Practices:**
- Start with simple automations
- Test thoroughly before deploying
- Monitor automation performance
- Adjust based on results`,
      category: 'automation',
      keywords: ['automation', 'workflow', 'automatic', 'trigger', 'schedule', 'process']
    },

    // General Help
    {
      title: "Getting Started Guide",
      content: `**Welcome to GenieFlow AI! Here's how to get started:**

**Step 1: Set Up Your Profile**
- Complete your user preferences
- Connect your email accounts
- Set up calendar integration
- Configure notification preferences

**Step 2: Explore Core Features**
- Try the AI Assistant for general help
- Create your first AI agent
- Organize some files in AI Drive
- Set up email automation

**Step 3: Customize Your Experience**
- Train agents with your data
- Create custom workflows
- Set up personalized automations
- Configure the conscious assistant

**Step 4: Advanced Usage**
- Build complex multi-step agents
- Create sophisticated workflows
- Integrate with external services
- Monitor and optimize performance

**Need Help?**
- Use this chat interface for immediate assistance
- Check the notification bell for tips and updates
- Explore the manual sections for detailed guides
- Contact support for technical issues`,
      category: 'general',
      keywords: ['start', 'begin', 'setup', 'guide', 'help', 'introduction', 'basics']
    },

    // 🧠 CORE ARCHITECTURE (Persistent Memory)
    {
      title: "Sovereign Brain Architecture",
      content: `**GenieFlow AI follows a 3-layer neural stack:**

1. **Sensory Layer**: Email, Calendar, and SkillBridge (External Tools).
2. **Neural Layer**: Soul (Persona), Heartbeat (Autonomy), and Cognitive Reflector (Validation).
3. **Motor Layer**: SkillExecutor, Unified Canvas, and Cortex Dashboard.

**Key Concepts:**
- **Sovereign Heartbeat**: An autonomous loop that pulses to execute tasks without user input.
- **Orchestration Manifest**: The session's single source of truth for work status.
- **Cognitive Reflection**: A safety gate that critiques AI actions before they occur.`,
      category: 'architecture',
      keywords: ['architecture', 'brain', 'how it works', 'structure', 'heartbeat', 'manifest', 'technical', 'layers']
    },
    {
      title: "System Usage Guide",
      content: `**Mastering your Core AI Consciousness:**

- **Toggle SOVEREIGN**: Enable this in the Cortex Dashboard to allow the AI to work autonomously.
- **Monitor Reasoning**: Watch the 'Thought Stream' to see the AI's step-by-step logic.
- **AI Drive**: All your documents and persistent personas are stored here.
- **Diagnostics**: If an action fails, look for the 'Diagnosis Task' created by the AI to repair itself.`,
      category: 'general',
      keywords: ['how to use', 'guide', 'tutorial', 'sovereign', 'autonmous', 'drive', 'diagnostics']
    }
  ];

  async searchManual(query: string, helpType?: string): Promise<ManualSection[]> {
    const searchTerms = query.toLowerCase().split(' ');
    const results: Array<{ section: ManualSection; score: number }> = [];

    for (const section of this.manualSections) {
      let score = 0;

      // Category match bonus
      if (helpType && section.category === helpType) {
        score += 50;
      }

      // Title match
      const titleWords = section.title.toLowerCase().split(' ');
      for (const term of searchTerms) {
        if (titleWords.some(word => word.includes(term))) {
          score += 30;
        }
      }

      // Keyword match
      for (const keyword of section.keywords) {
        for (const term of searchTerms) {
          if (keyword.includes(term) || term.includes(keyword)) {
            score += 20;
          }
        }
      }

      // Content match
      const contentWords = section.content.toLowerCase().split(' ');
      for (const term of searchTerms) {
        const matches = contentWords.filter(word => word.includes(term)).length;
        score += matches * 5;
      }

      if (score > 10) {
        results.push({ section, score });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 3).map(r => r.section);
  }

  async getManualSectionByCategory(category: string): Promise<ManualSection[]> {
    return this.manualSections.filter(section =>
      section.category === category
    );
  }

  async getAllManualSections(): Promise<ManualSection[]> {
    return [...this.manualSections];
  }
}

export class EnhancedConsciousAssistantService {
  private manualService = new ManualKnowledgeBaseService();

  async processUserRequest(
    message: string,
    context?: {
      previousInteraction?: any;
      currentTopic?: string;
      helpType?: 'navigation' | 'feature' | 'agent-building' | 'general';
    }
  ): Promise<{
    responseText: string;
    detectedTopic?: string;
    relevantManuals?: ManualSection[];
    suggestions?: string[];
  }> {
    try {
      // Detect if user is asking for help with system navigation or features
      const helpType = this.detectHelpType(message);
      const isManualRequest = this.isManualRequest(message);

      let response = '';
      let relevantManuals: ManualSection[] = [];
      let suggestions: string[] = [];

      if (isManualRequest || helpType !== 'general') {
        // Search manual knowledge base
        relevantManuals = await this.manualService.searchManual(message, helpType);

        if (relevantManuals.length > 0) {
          response = this.formatManualResponse(message, relevantManuals, helpType);
          suggestions = this.generateFollowUpSuggestions(helpType);
        } else {
          response = await this.generateGeneralResponse(message, context);
        }
      } else {
        // Use AI service for general conversation
        response = await this.generateGeneralResponse(message, context);
      }

      return {
        responseText: response,
        detectedTopic: helpType,
        relevantManuals,
        suggestions
      };

    } catch (error) {
      console.error('Error in enhanced assistant processing:', error);
      return {
        responseText: "I apologize, but I encountered an error processing your request. Could you please try again or rephrase your question?",
        detectedTopic: 'error'
      };
    }
  }

  private detectHelpType(message: string): 'navigation' | 'feature' | 'agent-building' | 'general' {
    const lower = message.toLowerCase();

    // Agent building keywords
    if (this.containsAny(lower, ['agent', 'build', 'create assistant', 'automation', 'workflow', 'deploy'])) {
      return 'agent-building';
    }

    // Navigation keywords
    if (this.containsAny(lower, ['navigate', 'find', 'where', 'how to get', 'access', 'menu', 'section'])) {
      return 'navigation';
    }

    // Feature keywords
    if (this.containsAny(lower, ['feature', 'capability', 'what does', 'function', 'system', 'how does'])) {
      return 'feature';
    }

    return 'general';
  }

  private isManualRequest(message: string): boolean {
    const lower = message.toLowerCase();
    return this.containsAny(lower, [
      'manual', 'documentation', 'guide', 'help', 'how to', 'tutorial',
      'instructions', 'explain', 'show me', 'tell me about'
    ]);
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private formatManualResponse(query: string, manuals: ManualSection[], helpType: string): string {
    if (manuals.length === 0) {
      return "I couldn't find specific information about that in our manual. Could you be more specific about what you'd like help with?";
    }

    const primaryManual = manuals[0];
    let response = `I found some helpful information about **${primaryManual.title}**:\n\n`;
    response += primaryManual.content;

    if (manuals.length > 1) {
      response += `\n\n**Related Topics:**\n`;
      for (let i = 1; i < Math.min(manuals.length, 3); i++) {
        response += `• ${manuals[i].title}\n`;
      }
    }

    response += `\n\n💡 **Need more specific help?** Just ask me about any part of this process!`;

    return response;
  }

  private generateFollowUpSuggestions(helpType: string): string[] {
    const suggestionMap = {
      'navigation': [
        "How do I switch between different sections?",
        "Where can I find my settings?",
        "How do I access the notification center?"
      ],
      'agent-building': [
        "What's the best agent type for email automation?",
        "How do I test my agent before deploying?",
        "Can you show me agent configuration examples?"
      ],
      'feature': [
        "What are the most powerful features I should try?",
        "How do features integrate with each other?",
        "Which features work best for productivity?"
      ],
      'general': [
        "What should I learn next?",
        "How can I get the most out of the system?",
        "Are there any tips for new users?"
      ]
    };

    return suggestionMap[helpType] || suggestionMap['general'];
  }

  private async generateGeneralResponse(message: string, context?: any): Promise<string> {
    // Use AI service for general conversation
    try {
      // Import the AI service factory
      const { AIServiceFactory } = await import('./ai/aiServiceFactory');
      const aiService = AIServiceFactory.getInstance();

      const systemPrompt = `You are a helpful, friendly assistant integrated into the GenieFlow AI system. 
      You can help with general questions, provide guidance, and have natural conversations. 
      Be concise but helpful, and maintain a warm, professional tone.`;

      return await aiService.generateText(message, { systemPrompt });
    } catch (error) {
      console.error('Error generating general response:', error);
      return "I'd be happy to help! I can assist with system navigation, feature explanations, agent building, or general questions. What specifically would you like to know about?";
    }
  }
}

export const enhancedConsciousAssistantService = new EnhancedConsciousAssistantService();