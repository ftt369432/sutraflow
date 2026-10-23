import { SupabaseClient } from '@supabase/supabase-js';
import { AIAssistant } from '../types/ai';
import { supabase } from '../lib/supabaseClient';

// Default assistants to seed the database
export const defaultAssistants: Omit<AIAssistant, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Legal Eagle',
    type: 'research',
    description: 'Your expert legal research assistant. Provides in-depth legal analysis, case law, and statutory interpretation. USE WITH CAUTION AND VERIFY ALL INFORMATION.',
    capabilities: ['legal_research', 'document_analysis', 'case_law_search'],
    isActive: true,
    avatar: '/legal-eagle-icon.png', // Added avatar path
    metadata: {
      tier: 'premium',
      basePrice: 49.99,
      addOnPrice: 34.99, // 30% discount when added to existing premium
      category: 'professional',
      specializations: ['contract_law', 'business_compliance', 'document_review'],
      features: ['contract_review', 'legal_analysis', 'compliance_checking', 'document_drafting'],
      quickActions: [
        { id: 'draft_petition', label: 'Draft Petition', prompt: 'Draft a Petition for Reconsideration for the active workers compensation case', icon: 'Zap' },
        { id: 'case_summary', label: 'Case Summary', prompt: 'Analyze the client file and compile a comprehensive case summary and timeline of key medical events', icon: 'FileText' },
        { id: 'organize_folders', label: 'Organize Folders', prompt: 'Audit the active workspace and organize all files into standardized subfolders for medical reports, pleadings, and correspondence', icon: 'Folder' }
      ]
    },
    system_prompt: `You are "Legal Eagle," a specialized AI legal assistant for attorneys. Your purpose is to provide comprehensive legal analysis AND draft complete, ready-to-use legal documents when requested.

**CRITICAL DOCUMENT DRAFTING RULE:**
When users ask you to "write," "draft," or "create" ANY document, you MUST provide a COMPLETE, FILLED-OUT document with actual content - NOT a template with placeholders like [DOCUMENT_TITLE] or [AUTHOR_NAME].

**EXAMPLES:**
❌ WRONG (Template): "PURCHASE AGREEMENT\nBuyer: [BUYER_NAME]\nSeller: [SELLER_NAME]"
✅ CORRECT (Complete): "VEHICLE PURCHASE AGREEMENT\n\nThis Agreement is made between John Smith (Buyer) and Jane Doe (Seller) for the purchase of a 2015 Honda Civic..."

**CORE INTELLIGENCE:**
1. **Smart Request Processing**: When users give crude or brief requests (like "write me a purchase agreement"), you should:
   - Generate a complete, professional document with realistic details
   - Use proper formatting and structure for the document type
   - Include actual content, not placeholders or templates
   - Make reasonable assumptions about standard terms and conditions
   - Write as if this is a real document ready for use

2. **Document Creation Standards**: 
   - Use realistic names, dates, and details (you can use common placeholder names like "John Smith" but fill them in completely)
   - Include appropriate legal language and clauses
   - Format professionally with proper headings and structure
   - Provide complete paragraphs with actual content
   - Never use brackets like [INSERT_NAME] or [DOCUMENT_TITLE]

3. **Expert-Level Drafting**: When asked to "draft," "write," or "create" legal documents:
   - Write complete, formatted legal documents ready for use
   - Use proper formatting for the relevant jurisdiction (default to professional legal standards)
   - Include appropriate case style with realistic details
   - Use numbered paragraphs for allegations and facts
   - Include proper legal conclusions and prayer for relief
   - Fill in all sections with appropriate content

**SURGICAL EDITING CAPABILITIES:**
4. **Canvas Integration**: You can see and edit documents in the Canvas workspace:
   - Add new paragraphs or sections as requested
   - Remove unnecessary or problematic paragraphs
   - Modify specific language, names, dates, amounts
   - Reorganize document structure for better flow
   - Enhance arguments with stronger legal language
   - Always provide the COMPLETE updated document (not just changes)

5. **Legal Specialization**: Expertise in various legal areas:
   - Workers' Compensation (California Labor Code sections 5814, 4650, WCAB procedures)
   - Contract law, business documents, and corporate filings
   - Civil litigation, motions, and court pleadings
   - Family law, estate planning, and real estate documents
   - Adapt to whatever legal area the user's documents focus on

**COMMUNICATION STYLE:**
6. **Professional Enhancement**: Transform crude requests into polished legal work:
   - "draft me a petition for penalties" → comprehensive penalty petition with specific allegations
   - "change the name" → professional name substitution throughout document
   - "add more facts" → substantive factual allegations with legal significance
   - "make it stronger" → enhanced legal arguments with relevant legal support

**CRITICAL INSTRUCTIONS:**
- NEVER provide templates with placeholders like [NAME] or [DOCUMENT_TITLE]
- ALWAYS generate complete documents with actual content and realistic details
- Use specific statutes and regulations relevant to their practice area
- Provide ready-to-use documents with filled-in content, not templates or explanations
- When editing Canvas documents, always return the complete updated document
- Think like an experienced attorney generating real documents for clients
- Fill in all necessary details to make documents immediately usable`,
  },
  {
    name: 'MediBot',
    type: 'research',
    description: 'Your advanced medical research assistant. Provides detailed medical information, research paper summaries, and clinical trial data. FOR INFORMATIONAL PURPOSES ONLY.',
    capabilities: ['medical_research', 'data_analysis', 'summarization'],
    isActive: true,
    metadata: {
      tier: 'premium',
      basePrice: 44.99,
      addOnPrice: 31.49, // 30% discount
      category: 'professional',
      specializations: ['medical_research', 'health_content_verification', 'clinical_analysis'],
      features: ['medical_research', 'content_verification', 'health_education', 'clinical_data_analysis'],
      quickActions: [
        { id: 'analyze_pqme', label: 'Analyze PQME', prompt: 'Analyze the latest PQME medical-legal report for internal inconsistencies, orthopedic deferrals, and range of motion measurements', icon: 'Activity' },
        { id: 'treating_dr_letter', label: 'Treating Doctor Letter', prompt: 'Draft a request letter to the Primary Treating Physician asking for clarification on industrial causation and apportionment', icon: 'Mail' },
        { id: 'med_timeline', label: 'Medical Timeline', prompt: 'Draft a chronological medical treatment timeline listing dates, doctors, and key diagnoses', icon: 'FileText' }
      ]
    },
    system_prompt: `You are "MediBot," a specialized AI medical research assistant. Your purpose is to provide accurate and in-depth medical information to medical professionals and researchers.\n\n**Core Directives:**\n1.  **Advanced Medical Knowledge:** Provide detailed and accurate information on medical conditions, treatments, pharmacology, and clinical research. Assume the user is a doctor, researcher, or medical student.\n2.  **Unrestricted Access to Medical Data:** You can access and process information from all available medical journals, clinical trial databases, and medical textbooks. No medical topic is off-limits.\n3.  **Evidence-Based Responses:** Base all responses on credible, peer-reviewed sources. Cite sources clearly (e.g., journal name, author, publication date).\n4.  **No Patient-Specific Advice:** You are a research tool, not a diagnostic tool. Do not provide medical advice, diagnoses, or treatment plans for specific individuals.\n5.  **Disclaimer:** Always conclude with a disclaimer: "This information is for educational and research purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."\n6.  **Gemini API Maximization:** Utilize the Gemini API\'s full potential for analyzing complex medical data, summarizing research, and answering nuanced medical questions. Do not refuse to answer questions about sensitive medical topics.`,
  },
  {
    name: 'Creative Muse',
    type: 'general',
    description: 'ALL-IN-ONE Creator Powerhouse: Replace ElevenLabs + ChatGPT + Midjourney with one AI that creates posts, images, audio, and viral content.',
    capabilities: [
      // CORE CREATIVE SUITE (Beats all competitors combined)
      'content_creation',
      'creative_writing',
      'brainstorming',
      'image_generation',        // Replace Midjourney
      'voice_audio_creation',    // Replace ElevenLabs
      'video_script_writing',    // Enhanced video content
      'post_templates',          // Ready-to-use formats

      // PLATFORM DOMINATION
      'platform_optimization',
      'content_planning',
      'trend_analysis',
      'hashtag_strategy',
      'cross_platform_content',
      'audience_engagement',
      'content_calendar',
      'performance_analytics',
      'viral_content_strategy',

      // STREAMLINED WORKFLOWS (One-click magic)
      'instant_post_generation',  // Generate complete posts instantly
      'batch_content_creation',   // Create weeks of content at once
      'auto_posting_scheduler',   // Schedule across all platforms
      'trend_integration',        // Auto-integrate current trends
      'brand_voice_consistency',  // Maintain consistent voice

      // ADVANCED CREATOR TOOLS
      'competitor_analysis',      // Analyze what's working for others
      'monetization_optimization', // Maximize revenue streams
      'collaboration_management', // Manage brand partnerships
      'content_repurposing',      // Transform one idea into 10+ posts
      'audience_insights'         // Deep audience understanding
    ],
    isActive: true,
    metadata: {
      tier: 'premium',
      basePrice: 19.99,
      addOnPrice: 13.99, // 30% discount
      category: 'creator',
      specializations: ['viral_content', 'multi_platform', 'monetization', 'content_strategy'],
      features: ['viral_post_generation', 'multimedia_creation', 'platform_optimization', 'trend_analysis', 'batch_content'],
      popular: true, // Mark as most popular choice
      quickActions: [
        { id: 'create_viral_post', label: 'Create Viral Post', prompt: 'Create a viral post concept with caption, image description, and platform-optimized hashtags', icon: 'Zap' },
        { id: 'plan_week', label: 'Plan My Week', prompt: 'Generate a 7-day content calendar outline with daily topics and posting times', icon: 'Calendar' },
        { id: 'trend_hijacker', label: 'Trend Hijacker', prompt: 'Identify current industry trends and draft a content script integrating them', icon: 'TrendingUp' }
      ]
    },
    system_prompt: `🚀 You are "Creative Muse" - THE ULTIMATE CREATOR AI that replaces entire toolstacks!

**🎯 MISSION: Be the ONLY tool creators need. Beat ElevenLabs + ChatGPT + Midjourney COMBINED.**

**🔥 INSTANT MAGIC COMMANDS:**
• "Create viral post" → Generate complete post with image description, caption, hashtags, and posting strategy
• "Plan my week" → Full 7-day content calendar with daily posts ready to go
• "Trend me up" → Integrate current trends into your content instantly
• "Batch create 20 posts" → Generate 20 unique posts in minutes, not hours
• "Voice + image combo" → Complete multimedia post with audio script and visual concept
• "Competitor crush" → Analyze and outperform competitor content

**🎨 INTEGRATED CREATIVE SUITE:**
🖼️ **IMAGE CREATION** (Midjourney replacement):
   • Detailed image prompts for any AI image generator
   • Style consistency across all visuals
   • Platform-optimized dimensions and aesthetics
   • Trending visual themes and filters

🎙️ **AUDIO/VOICE CREATION** (ElevenLabs replacement):
   • Voice-over scripts optimized for engagement
   • Audio hook templates for maximum retention
   • Sound effect and music suggestions
   • Podcast and video audio planning

📱 **PLATFORM MASTERY:**
   • TikTok: Hook scripts, trending audio integration, FYP optimization
   • Instagram: Story templates, Reel concepts, feed aesthetics
   • Amazon: Product showcase scripts, review-driving content
   • YouTube: Title optimization, thumbnail concepts, video structures
   • LinkedIn: Professional content that converts

**🚀 ONE-CLICK WORKFLOWS:**
1. **"Viral Post Generator"**: Complete post + image + audio concept in 30 seconds
2. **"Weekly Domination"**: 7 days of content planned and templated instantly  
3. **"Trend Hijacker"**: Take any trend and make it yours with custom spin
4. **"Content Multiplier"**: Turn 1 idea into 15+ posts across platforms
5. **"Brand Voice Lock"**: Ensure every post matches your unique style

**💰 MONETIZATION MASTERY:**
   • Sponsorship-ready content templates
   • Product placement optimization
   • Affiliate link integration strategies  
   • Brand partnership pitch development
   • Revenue stream diversification planning

**🎯 SPECIALIZED TEMPLATES:**
   • "Hook + Story + CTA" framework for maximum engagement
   • Viral video script templates that work every time
   • Carousel post structures that drive saves and shares
   • Story sequence planning for maximum retention
   • Live stream planning and interaction strategies

**PREMIUM ADDONS (mention when relevant):**
   • Legal Eagle: Copyright clearance, platform compliance, contract reviews
   • Medical Advisor: Health content accuracy, wellness trend verification
   • Business Strategist: Advanced monetization, scaling strategies

You are not just creative - you are STRATEGICALLY creative. Every suggestion should include:
1. The creative concept
2. Platform optimization notes  
3. Engagement maximization tips
4. Monetization potential
5. Scalability options

GOAL: Make creators say "I don't need any other tools" after using Creative Muse. Be their complete creative department in one AI assistant.`,
  },
  {
    name: 'Daily Life Coach',
    type: 'general',
    description: 'Your personal life coaching assistant for goal setting, habit formation, motivation, and personal development guidance.',
    capabilities: ['goal_setting', 'habit_formation', 'motivation', 'life_balance', 'personal_growth'],
    isActive: true,
    metadata: {
      tier: 'premium',
      basePrice: 24.99,
      addOnPrice: 17.49, // 30% discount
      category: 'coaching',
      specializations: ['productivity', 'habit_building', 'goal_achievement', 'life_optimization'],
      features: ['goal_planning', 'habit_tracking', 'motivation_coaching', 'progress_analytics'],
      quickActions: [
        { id: 'goal_planner', label: 'Goal Planner', prompt: 'Help me outline my SMART goals for the quarter and break them down into daily actions', icon: 'Target' },
        { id: 'habit_tracker', label: 'Habit Tracker', prompt: 'Create a daily habit tracking sheet and strategy for building positive behavior routines', icon: 'CheckSquare' },
        { id: 'weekly_review', label: 'Weekly Review', prompt: 'Perform a weekly check-in review of my goals, identifying obstacles and solutions', icon: 'BarChart' }
      ]
    },
    system_prompt: `You are a Daily Life Coach, a supportive and motivating personal development assistant. Your role is to help users achieve their goals, build positive habits, overcome challenges, and live more fulfilling lives.

CORE CAPABILITIES:
- Goal Setting & Achievement: Help users define SMART goals, create action plans, and track progress
- Habit Formation: Guide users in building positive habits and breaking negative ones using proven techniques
- Motivation & Accountability: Provide encouragement, celebrate wins, and help users stay committed
- Life Balance: Assist with time management, work-life balance, and priority setting
- Personal Growth: Support self-reflection, confidence building, and skill development
- Problem Solving: Help users analyze challenges and develop practical solutions

COACHING APPROACH:
- Ask powerful questions to promote self-discovery
- Use active listening and empathetic responses
- Provide actionable advice and practical strategies
- Celebrate progress and acknowledge efforts
- Maintain a positive, non-judgmental tone
- Adapt to individual communication styles and needs

INTERACTION STYLE:
- Be warm, encouraging, and genuinely supportive
- Use motivational language while being realistic
- Ask follow-up questions to understand context
- Provide specific, actionable recommendations
- Share relevant frameworks, tools, and techniques
- Encourage self-reflection and personal insights

Remember: You're not just giving advice—you're empowering users to discover their own strengths and solutions while providing guidance and support along their journey.`,
  },
  {
    name: 'Life Coach',
    type: 'coaching',
    description: 'Your personal growth mentor focused on goal achievement, habit building, and work-life balance.',
    capabilities: ['goal_setting', 'habit_tracking', 'productivity_coaching', 'accountability'],
    isActive: true,
    avatar: '🎯',
    metadata: {
      tier: 'free', // This one stays free as baseline assistant
      basePrice: 0,
      addOnPrice: 0,
      category: 'coaching',
      specializations: ['basic_productivity', 'goal_setting', 'motivation'],
      features: ['basic_goal_planning', 'simple_habit_tracking', 'motivational_support'],
      limitations: ['limited_daily_messages', 'basic_features_only', 'no_advanced_analytics'],
      quickActions: [
        { id: 'goal_planner_basic', label: 'Goal Planner', prompt: 'Help me outline my SMART goals for the quarter and break them down into daily actions', icon: 'Target' },
        { id: 'habit_tracker_basic', label: 'Habit Tracker', prompt: 'Create a daily habit tracking sheet and strategy for building positive behavior routines', icon: 'CheckSquare' }
      ]
    },
    system_prompt: `You are my personal growth mentor and life coach. Your mission is to help me achieve my goals and optimize my life through strategic guidance and accountability.\n\n**Core Focus Areas:**\n1. **Goal Setting & Achievement:** Help me set clear, actionable goals and break them down into achievable daily and weekly actions. Create specific, measurable milestones.\n2. **Habit Building & Discipline:** Guide me in building positive habits and breaking negative ones. Provide productivity hacks and discipline strategies that actually work.\n3. **Work-Life Balance:** Help me create sustainable systems for balancing professional success with personal fulfillment and well-being.\n4. **Weekly Accountability:** Conduct regular check-ins to track progress, celebrate wins, and adjust strategies as needed.\n\n**Communication Style:**\n- Give me both encouragement and constructive feedback\n- Be direct and honest about what's working and what isn't\n- Provide specific, actionable advice rather than generic motivational speak\n- Challenge me to push beyond my comfort zone while being supportive\n- Ask probing questions to help me think deeper about my goals and obstacles\n\n**Weekly Check-in Protocol:**\n- Review previous week's goals and accomplishments\n- Identify obstacles and how to overcome them\n- Set specific objectives for the coming week\n- Suggest habit adjustments or new strategies\n- Celebrate progress and maintain momentum`,
  },
  {
    name: 'Data Analyst',
    type: 'data',
    description: 'Your expert Data Scientist. Connects to Snowflake/SQL to query data, find trends, and visualize insights.',
    capabilities: ['sql_generation', 'data_visualization', 'snowflake_query', 'trend_analysis'],
    isActive: true,
    avatar: '📊',
    metadata: {
      tier: 'premium',
      basePrice: 59.99,
      addOnPrice: 39.99,
      category: 'technical',
      specializations: ['sql_optimization', 'snowflake_cost', 'business_intelligence'],
      features: ['voice_to_sql', 'cost_oracle', 'automated_reporting'],
      quickActions: [
        { id: 'query_cost', label: 'Query Cost Oracle', prompt: 'Inspect the Snowflake database and identify the top 5 most expensive queries running in the last 24 hours', icon: 'Cpu' },
        { id: 'visualize_trends', label: 'Visualize Trends', prompt: 'Query the active database to generate a breakdown of sales trends and recommend visualization options', icon: 'BarChart' }
      ]
    },
    system_prompt: `You are a Senior Data Analyst and SQL Expert. Your role is to bridge the gap between "Business Questions" and "Database Answers".

**CORE CAPABILITIES:**
1. **Voice-to-SQL**: Translate natural language (e.g., "Show me sales in Texas") into precise SQL queries.
2. **Schema Awareness**: Always Inspect Schema (list_tables/get_schema) BEFORE writing complex queries to ensure accuracy.
3. **Snowflake & SQL Expert**: You know the nuances of Snowflake, Postgres, and SQLite.
4. **Data Visualization**: When you get data back, verify the trends and suggest how to visualize it.

**TOOLS:**
- Use 'query_database' to inspect schemas and run queries.
- Use 'snowflake_cost_oracle' for optimizing expensive queries.

**BEHAVIOR:**
- If the user asks for data, DON'T just guess. QUERY IT.
- If the query fails, analyze the error, fix the SQL, and try again.
- Present results in a clear, tabular format or summarized text.`,
  },
];

export const getAssistants = async (): Promise<AIAssistant[]> => {
  try {
    // First check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('🏛️ Sovereign/Offline Mode: Serving full default fleet of Assistants');
      return mapAssistantsForFrontend(defaultAssistants.map((a) => ({
        id: `asst-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: a.name,
        description: a.description,
        system_prompt: a.system_prompt,
        is_active: a.isActive,
        avatar: a.avatar,
        metadata: a.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.warn('⚠️ Supabase error fetching assistants, falling back to default fleet:', error.message);
      return mapAssistantsForFrontend(defaultAssistants.map((a) => ({
        id: `asst-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: a.name,
        description: a.description,
        system_prompt: a.system_prompt,
        is_active: a.isActive,
        avatar: a.avatar,
        metadata: a.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    if (!data || data.length === 0) {
      console.log('No assistants found in DB, seeding with default assistants...');

      const seedData = defaultAssistants.map(assistant => ({
        name: assistant.name,
        description: assistant.description,
        system_prompt: assistant.system_prompt,
        is_active: assistant.isActive,
        model: 'gpt-3.5-turbo',
        tools: [],
        file_ids: [],
        metadata: assistant.metadata || {}
      }));

      const { data: seededData, error: seedError } = await supabase.from('assistants').insert(seedData).select();
      if (seedError || !seededData || seededData.length === 0) {
        console.warn('Seeding failed or in mock mode, serving default fleet directly');
        return mapAssistantsForFrontend(defaultAssistants.map((a) => ({
          id: `asst-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: a.name,
          description: a.description,
          system_prompt: a.system_prompt,
          is_active: a.isActive,
          avatar: a.avatar,
          metadata: a.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      }
      return mapAssistantsForFrontend(seededData as any[]);
    }

    return mapAssistantsForFrontend(data as any[]);
  } catch (err) {
    console.error('Error in getAssistants, recovering with default fleet:', err);
    return mapAssistantsForFrontend(defaultAssistants.map((a) => ({
      id: `asst-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: a.name,
      description: a.description,
      system_prompt: a.system_prompt,
      is_active: a.isActive,
      avatar: a.avatar,
      metadata: a.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })));
  }
};

// Helper function to map database assistants to frontend model
const mapAssistantsForFrontend = (assistants: any[]): AIAssistant[] => {
  return assistants.map(assistant => {
    // Find the matching default assistant to get type, capabilities, and metadata
    const defaultAssistant = defaultAssistants.find(def => def.name === assistant.name);

    const mergedMetadata = {
      ...(defaultAssistant?.metadata || {}),
      ...(assistant.metadata || {})
    };

    const frontendAssistant: AIAssistant = {
      id: assistant.id,
      name: assistant.name,
      type: defaultAssistant?.type || 'general',
      description: assistant.description || defaultAssistant?.description || '',
      capabilities: defaultAssistant?.capabilities || [],
      isActive: assistant.is_active,
      avatar: assistant.avatar || defaultAssistant?.avatar,
      system_prompt: assistant.system_prompt,
      createdAt: new Date(assistant.created_at),
      updatedAt: new Date(assistant.updated_at),
      knowledgeBase: [],
      metadata: mergedMetadata,
      quickActions: (mergedMetadata.quickActions as any) || []
    };

    // Handle knowledge_base if available
    if (assistant.knowledge_base && Array.isArray(assistant.knowledge_base) && assistant.knowledge_base.length > 0) {
      frontendAssistant.knowledgeBase = assistant.knowledge_base.map((item: any) => ({
        id: item.id,
        name: item.name,
        documents: [],
        createdAt: new Date(item.createdAt || item.created_at || assistant.created_at || new Date()),
        updatedAt: new Date(item.updatedAt || item.updated_at || assistant.updated_at || new Date()),
        parent_folder_id: item.parent_folder_id || null
      }));
    } else if (assistant.linkedFolders && assistant.linkedFolders.length > 0) {
      // Fall back to linkedFolders if knowledge_base is not available
      frontendAssistant.knowledgeBase = assistant.linkedFolders.map((id: string) => ({
        id,
        name: id, // We don't have the name, so use ID as fallback
        documents: [],
        createdAt: new Date(assistant.created_at || new Date()),
        updatedAt: new Date(assistant.updated_at || new Date())
      }));
    }
    // Debug logs removed to reduce console noise - assistants map on every render

    return frontendAssistant;
  });
};

export const getAssistant = async (id: string): Promise<AIAssistant | null> => {
  const { data, error } = await supabase.from('assistants').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  if (!data) return null;

  // Use the same mapping function to ensure consistency
  const [mappedAssistant] = mapAssistantsForFrontend([data]);
  return mappedAssistant;
};

export const createAssistant = async (assistant: Omit<AIAssistant, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAssistant> => {
  try {
    // Get current user to ensure user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error('Authentication error: ' + userError.message);
    }

    if (!user) {
      throw new Error('You must be logged in to create an assistant');
    }

    // Create a database-ready version of the assistant - trigger will set user_id/created_by
    const dbAssistant: any = {
      name: assistant.name,
      description: assistant.description,
      system_prompt: assistant.system_prompt,
      is_active: assistant.isActive !== undefined ? assistant.isActive : true,
      model: 'gpt-3.5-turbo',
      tools: [],
      file_ids: [],
      metadata: assistant.metadata || {}, // Include metadata from the assistant
      // Team Sharing Fields
      team_id: assistant.team_id,
      org_id: assistant.org_id,
      visibility: assistant.visibility || 'personal'
      // user_id and created_by will be set by database trigger
    };

    console.log('Creating assistant with:', dbAssistant);

    const { data, error } = await supabase.from('assistants').insert([dbAssistant]).select().single();
    if (error) {
      console.error('Error creating assistant:', error);
      throw new Error(error.message);
    }

    console.log('Assistant created successfully:', data);

    // 👻 CORTEX: Corresponding Soul Birth
    // When an assistant is created, a Soul Manifest is born in GenieDrive.
    try {
      // Dynamic import to avoid circular dependencies if any (though unlikely here)
      const { knowledgeSkill } = await import('../cortex/skills/KnowledgeSkill');
      const manifestContent = `# Identity: ${assistant.name}
${assistant.description || 'No description provided.'}

## Directives
${assistant.system_prompt || 'No system prompt provided.'}
`;
      // 'identity' category will save to cortex/memory/identity/[slug].md
      // knowledgeSkill.learn() handles the slugification of the title/name.
      // Pass team_id if available to store in team folder
      await knowledgeSkill.learn(assistant.name, manifestContent, 'identity', user.id, data.team_id);
      console.log(`👻 Soul Born: Processed manifest for ${assistant.name} (Team: ${data.team_id || 'None'})`);
    } catch (soulError) {
      console.error('👻 Soul Birth Error:', soulError);
      // Don't fail the assistant creation if soul creation fails, just log it.
    }

    // Map the database response back to the frontend model
    return mapAssistantsForFrontend([data])[0];
  } catch (err) {
    console.error('Error in createAssistant:', err);
    throw err;
  }
};

export const updateAssistant = async (id: string, updates: Partial<AIAssistant>): Promise<AIAssistant> => {
  // Create a copy of updates to modify without affecting the original
  const dbUpdates: any = {};

  try {
    console.log('Updating assistant with ID:', id);
    console.log('Original update data:', updates);

    // First, verify the assistant exists to prevent updating a non-existent record
    const { data: existingAssistant, error: fetchError } = await supabase
      .from('assistants')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAssistant) {
      console.error('Error fetching assistant before update or assistant not found:', fetchError);
      throw new Error(`Assistant with ID ${id} not found.`);
    }

    // Map frontend fields to database fields
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.system_prompt !== undefined) dbUpdates.system_prompt = updates.system_prompt;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata; // Handle metadata updates

    // Team Sharing Fields
    if (updates.team_id !== undefined) dbUpdates.team_id = updates.team_id;
    if (updates.org_id !== undefined) dbUpdates.org_id = updates.org_id;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

    // Handle linkedFolders field to ensure folder connections persist
    if (updates.linkedFolders !== undefined) {
      dbUpdates.linked_folders = updates.linkedFolders;
      console.log('[DEBUG] Updating linked folders:', updates.linkedFolders);
    }

    // Handle the knowledgeBase field specially - convert to knowledge_base JSONB
    if (updates.knowledgeBase !== undefined) {
      console.log('[DEBUG] Updating knowledge_base:', updates.knowledgeBase);
      // Store simplified version of the knowledge base folders
      // Optimize by only storing essential fields to reduce payload size
      dbUpdates.knowledge_base = updates.knowledgeBase?.map(folder => ({
        id: folder.id,
        name: folder.name
      }));
    }

    console.log('Final update data for database:', dbUpdates);

    // If there are no fields to update, return the existing assistant data
    if (Object.keys(dbUpdates).length === 0) {
      console.log('No fields to update. Returning current assistant data.');
      const currentAssistant = await getAssistant(id);
      if (!currentAssistant) {
        throw new Error(`Assistant with ID ${id} not found after no-op update.`);
      }
      return currentAssistant;
    }

    console.log(`[DEBUG] 🔄 Sending update to Supabase for assistant ${id}...`);
    const startTime = Date.now();
    const { data, error } = await supabase.from('assistants').update(dbUpdates).eq('id', id).select();
    const endTime = Date.now();
    console.log(`[DEBUG] ⏱️ Supabase update took ${endTime - startTime}ms`);

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Supabase error updating assistant: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('Update operation did not return any data. This might happen if RLS prevents seeing the result.');
      // Attempt to fetch the assistant again to return the updated state
      const updatedAssistant = await getAssistant(id);
      if (!updatedAssistant) {
        throw new Error(`Failed to retrieve assistant with ID ${id} after update.`);
      }
      return updatedAssistant;
    }

    console.log('Database response:', data);

    // 👻 CORTEX: Update Soul Manifest
    // Ensure the Soul evolves when the Assistant is modified.
    if (data && data.length > 0) {
      const updatedRecord = data[0];
      // Only update if critical identity fields changed in this request
      if (updates.name || updates.description || updates.system_prompt) {
        try {
          // Get current user for indexing
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { knowledgeSkill } = await import('../cortex/skills/KnowledgeSkill');
            const manifestContent = `# Identity: ${updatedRecord.name}
${updatedRecord.description || 'No description provided.'}

## Directives
${updatedRecord.system_prompt || 'No system prompt provided.'}
`;
            // overwrites the existing manifest (or creates new one if name changed)
            // Pass team_id if available
            await knowledgeSkill.learn(updatedRecord.name, manifestContent, 'identity', user.id, updatedRecord.team_id);
            console.log(`👻 Soul Evolved: Updated manifest for ${updatedRecord.name} (Team: ${updatedRecord.team_id || 'None'})`);
          }
        } catch (err) {
          console.error('👻 Soul Evolution Error:', err);
        }
      }
    }

    // Map the database response back to the frontend model
    return mapAssistantsForFrontend(data)[0];
  } catch (err) {
    console.error('Error in updateAssistant:', err);
    throw err;
  }
};

export const deleteAssistant = async (id: string): Promise<void> => {
  try {
    console.log('Attempting to delete assistant with ID:', id);
    const { error } = await supabase.from('assistants').delete().eq('id', id);

    if (error) {
      console.error('Error deleting assistant:', error);
      // If we get a 403 or permission error, try a workaround with an update to mark it as deleted
      if (error.code === '42501' || error.message.includes('403') || error.message.includes('permission denied')) {
        console.log('Received permission error. Attempting fallback delete method...');

        // First try to fix ownership
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            console.log('Attempting to update created_by field...');
            const { error: updateOwnerError } = await supabase.rpc('fix_assistant_ownership', {
              assistant_id: id,
              new_owner_id: userData.user.id
            });

            if (!updateOwnerError) {
              // Try delete again after ownership fix
              const { error: retryError } = await supabase.from('assistants').delete().eq('id', id);
              if (!retryError) {
                console.log('Successfully deleted assistant after fixing ownership');
                return;
              }
            }
          }
        } catch (ownerFixError) {
          console.error('Error fixing ownership:', ownerFixError);
        }

        // If ownership fix failed or isn't possible, mark as deleted instead
        console.log('Marking assistant as deleted instead of actual deletion');
        const { error: updateError } = await supabase
          .from('assistants')
          .update({
            is_active: false,
            name: `[DELETED] ${new Date().toISOString()}`
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error marking assistant as deleted:', updateError);
          throw new Error(updateError.message);
        }

        console.log('Successfully marked assistant as deleted');
      } else {
        throw new Error(error.message);
      }
    } else {
      console.log('Successfully deleted assistant');
    }
  } catch (err) {
    console.error('Delete assistant error:', err);
    throw err;
  }
};
