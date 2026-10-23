/**
 * Mode System Configuration
 * 
 * Progressive disclosure system with three modes:
 * - SIMPLE: Clean chat experience for 80% of users
 * - POWER: Full-featured environment for power users
 * - AUTO: Intelligent detection that suggests mode switches
 * 
 * @module config/modes
 */

export type UserMode = 'simple' | 'power' | 'auto';

export interface ModeConfig {
  name: string;
  description: string;
  ui: {
    showTaskOrchestrator: boolean;
    showIntelligencePanel: boolean;
    showFineTuning: boolean;
    showCollectiveBrain: boolean;
    showRightPanel: boolean;
    canvasType: 'simple' | 'unified';
    headerActions: string[];
  };
  execution: {
    orchestration: 'simple' | 'standard' | 'agentic';
    enableThinkingProcess: boolean;
    enableResearchPhase: boolean;
    enableReflection: boolean;
    maxToolChainDepth: number;
  };
  features: {
    multiDocument: boolean;
    workflowAutomation: boolean;
    knowledgeBase: boolean;
    canvasHistory: boolean;
    advancedPrompting: boolean;
  };
}

/**
 * SIMPLE MODE Configuration
 * 
 * Target: 80% of users who want clean chat experience
 * Philosophy: Hide complexity, show only essential UI
 * Orchestration: Direct chat without agentic loops
 * Canvas: Minimal overlay (SimpleCanvasOverlay component)
 */
export const SIMPLE_MODE: ModeConfig = {
  name: 'Simple',
  description: 'Clean chat experience with minimal interface',
  
  ui: {
    // Panel Visibility
    showTaskOrchestrator: false,    // Hide task management panel
    showIntelligencePanel: false,   // Hide agentic intelligence display
    showFineTuning: false,           // Hide fine-tuning controls
    showCollectiveBrain: false,      // Hide collective brain panel
    showRightPanel: false,           // Hide right sidebar
    
    // Canvas Type
    canvasType: 'simple',            // Use SimpleCanvasOverlay (minimal, overlay-style)
    
    // Header Actions (minimal set)
    headerActions: [
      'newChat',                     // Start new conversation
      'modeToggle'                   // Switch modes
    ]
  },
  
  execution: {
    // Orchestration Strategy
    orchestration: 'simple',         // Direct chatWithAssistant, no agentic loop
    
    // Agentic Features (disabled for simplicity)
    enableThinkingProcess: false,    // No "thinking" display
    enableResearchPhase: false,      // No knowledge base auto-search
    enableReflection: false,         // No self-correction loops
    
    // Tool Execution
    maxToolChainDepth: 1             // Single tool call, no chaining
  },
  
  features: {
    // Document Features
    multiDocument: false,            // No multi-document splitting
    
    // Automation Features
    workflowAutomation: false,       // No workflow triggers
    
    // Knowledge Features
    knowledgeBase: true,             // Allow KB search (essential)
    
    // History Features
    canvasHistory: false,            // No version history tracking
    
    // Advanced Features
    advancedPrompting: false         // No system prompts, temperature controls
  }
};

/**
 * POWER MODE Configuration
 * 
 * Target: 20% power users who need full feature access
 * Philosophy: Progressive disclosure - show all capabilities
 * Orchestration: Full agentic loop with Think-Research-Act-Reflect
 * Canvas: Unified system with tabs, history, actions
 */
export const POWER_MODE: ModeConfig = {
  name: 'Power',
  description: 'Full-featured environment for power users',
  
  ui: {
    // Panel Visibility (all enabled)
    showTaskOrchestrator: true,      // Show task management panel
    showIntelligencePanel: true,     // Show agentic intelligence display
    showFineTuning: true,            // Show fine-tuning controls
    showCollectiveBrain: true,       // Show collective brain panel
    showRightPanel: true,            // Show right sidebar with actions
    
    // Canvas Type
    canvasType: 'unified',           // Use UnifiedCanvasSystem (full-featured)
    
    // Header Actions (complete set)
    headerActions: [
      'newChat',                     // Start new conversation
      'modeToggle',                  // Switch modes
      'settings',                    // Access settings
      'export',                      // Export conversations
      'share',                       // Share canvases
      'history'                      // View history
    ]
  },
  
  execution: {
    // Orchestration Strategy
    orchestration: 'agentic',        // Full AgenticLoopExecutor with TRAR cycle
    
    // Agentic Features (all enabled)
    enableThinkingProcess: true,     // Show "thinking" intelligence display
    enableResearchPhase: true,       // Auto-search KB before responding
    enableReflection: true,          // Self-correction and validation loops
    
    // Tool Execution
    maxToolChainDepth: 5             // Allow complex tool chaining (search → template → generate → validate → store)
  },
  
  features: {
    // Document Features
    multiDocument: true,             // Enable multi-document splitting
    
    // Automation Features
    workflowAutomation: true,        // Enable workflow triggers and automation
    
    // Knowledge Features
    knowledgeBase: true,             // Full KB integration
    
    // History Features
    canvasHistory: true,             // Version history tracking and rollback
    
    // Advanced Features
    advancedPrompting: true          // System prompts, temperature, model selection
  }
};

/**
 * AUTO MODE Configuration
 * 
 * Target: Users who want intelligent mode switching
 * Philosophy: Start simple, suggest power when complexity detected
 * Behavior: Begins as SIMPLE_MODE, detects complex requests, suggests POWER_MODE
 * Detection: Handled by useModeDetection hook
 */
export const AUTO_MODE: ModeConfig = {
  ...SIMPLE_MODE,                    // Start with SIMPLE_MODE defaults
  name: 'Auto',
  description: 'Intelligent mode switching based on task complexity',
  
  // AUTO_MODE uses SIMPLE_MODE config initially
  // When complex task detected by useModeDetection hook:
  // - Shows PowerModeSuggestion modal
  // - User can accept (switch to POWER_MODE) or dismiss (stay SIMPLE)
  // - Detection patterns in useModeDetection.ts
};

/**
 * Mode Configuration Map
 * Used by ModeContext to retrieve config based on current mode
 */
export const MODE_CONFIGS: Record<UserMode, ModeConfig> = {
  simple: SIMPLE_MODE,
  power: POWER_MODE,
  auto: AUTO_MODE
};

/**
 * Helper: Get config for current mode
 * @param mode Current user mode
 * @returns ModeConfig for the specified mode
 */
export function getModeConfig(mode: UserMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

/**
 * Helper: Check if feature is enabled in current mode
 * @param mode Current user mode
 * @param featureName Name of feature to check
 * @returns true if feature enabled in this mode
 */
export function isFeatureEnabled(mode: UserMode, featureName: keyof ModeConfig['features']): boolean {
  return MODE_CONFIGS[mode].features[featureName];
}

/**
 * Helper: Check if panel should be shown in current mode
 * @param mode Current user mode
 * @param panelName Name of panel to check (camelCase without 'show' prefix)
 * @returns true if panel should be visible in this mode
 */
export function shouldShowPanel(mode: UserMode, panelName: string): boolean {
  const config = MODE_CONFIGS[mode];
  const key = `show${panelName.charAt(0).toUpperCase()}${panelName.slice(1)}` as keyof typeof config.ui;
  return config.ui[key] === true;
}

/**
 * Complexity Detection Patterns
 * Used by useModeDetection hook to suggest Power Mode
 */
export const COMPLEXITY_INDICATORS = [
  // Multi-document requests
  /multiple\s+documents/i,
  /\d+\s+(?:documents?|canvases?|files?)/i,
  
  // Workflow/automation requests
  /workflow|automation|automate/i,
  /orchestrat(?:e|ion)|coordinate/i,
  
  // Research-heavy requests
  /research\s+(?:and|then|before)/i,
  /search\s+(?:kb|knowledge\s+base)/i,
  
  // Legal/complex document requests
  /(?:petition|motion|brief|complaint)/i,
  /(?:demand\s+letter|settlement|agreement)/i,
  
  // Numbered document sets
  /create\s+(?:\d+|multiple)/i,
  /generate\s+(?:\d+|multiple)/i,
  
  // Advanced features
  /fine[\s-]tun(?:e|ing)/i,
  /collective\s+brain/i,
  /version\s+history/i
];

/**
 * Simple Task Patterns
 * If request matches these, stay in Simple Mode even with some complexity words
 */
export const SIMPLE_TASK_PATTERNS = [
  /^(?:what|how|why|when|where|who)/i,  // Questions
  /^(?:explain|tell|show)\s+me/i,        // Information requests
  /^(?:help|assist)\s+(?:me\s+)?with/i   // Help requests
];

/**
 * Mode Transition Messages
 * Displayed when suggesting mode switch
 */
export const MODE_MESSAGES = {
  suggestPower: {
    title: 'Switch to Power Mode?',
    message: 'This looks like a complex task. Power Mode gives you access to advanced orchestration, multi-document creation, and intelligent research tools.',
    actions: {
      accept: 'Switch to Power Mode',
      dismiss: 'Stay in Simple Mode'
    }
  },
  
  welcomeSimple: {
    title: 'Welcome to Simple Mode',
    message: 'Enjoy a clean chat experience. You can switch to Power Mode anytime for advanced features.'
  },
  
  welcomePower: {
    title: 'Welcome to Power Mode',
    message: 'All features unlocked. Use the panels to orchestrate tasks, view intelligence, and manage documents.'
  }
};
