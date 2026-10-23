/**
 * 🎯 Multi-Canvas Task Orchestrator - Universal Industry System
 * 
 * Creates a Cursor AI-style task detection and auto-canvas generation system.
 * Detects multiple tasks from user input and creates separate canvases for each.
 * 
 * 🌟 UNIVERSAL DESIGN: Works for any industry (Legal, Medical, Business, Tech, etc.)
 * 🧠 KNOWLEDGE BASE INTEGRATION: Learns from user patterns and document samples
 */

import { v4 as uuidv4 } from 'uuid';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';

// 🏭 Industry Configuration Interface
export interface IndustryProfile {
  id: string;
  name: string;
  taskTypes: string[];
  keywords: string[];
  templates: Record<string, string>;
  priorityKeywords: {
    urgent: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  estimatedTimes: Record<string, number>; // Base time in minutes per task type
}

// 🤖 AI Agent Types (Enhanced from AI Agent System)
export enum AgentType {
  LEGAL_AGENT = 'LEGAL_AGENT',
  MEDICAL_AGENT = 'MEDICAL_AGENT',
  DOCUMENT_AGENT = 'DOCUMENT_AGENT',
  EMAIL_AGENT = 'EMAIL_AGENT',
  CALENDAR_AGENT = 'CALENDAR_AGENT',
  APPOINTMENT_AGENT = 'APPOINTMENT_AGENT'
}

// 🎯 Universal Task Interface (Enhanced with AI Agent Assignment)
export interface DetectedTask {
  id: string;
  title: string;
  description: string;
  type: string; // Now dynamic based on industry
  industry: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // in minutes
  dependencies: string[];
  status: 'detected' | 'canvas_created' | 'in_progress' | 'completed';
  suggestedDeadline?: Date;
  canvasId?: string;
  metadata?: Record<string, any>; // Industry-specific metadata
  
  // 🤖 AI AGENT ENHANCEMENTS
  assignedAgent?: AgentType; // Which specialized agent handles this task
  agentStatus?: 'assigned' | 'working' | 'completed' | 'failed';
  subTasks?: DetectedTask[]; // Sub-tasks created by agents
  agentNotes?: string; // Notes from the assigned agent
}

// 🎯 NEW: Outline Structure Interfaces
export interface OutlineSection {
  numeral: string;
  title: string;
  content: string;
  fullMatch: string;
  startIndex: number;
}

export interface NumberedSection {
  number: number;
  title: string;
  content: string;
  fullMatch: string;
  startIndex: number;
}

// 🧠 Learning Pattern Interfaces
export interface UserPattern {
  id: string;
  userId: string;
  inputPattern: string;
  documentType: string;
  preferredStructure: string;
  frequency: number;
  lastUsed: Date;
  successRate: number;
}

export interface KnowledgeBaseSample {
  id: string;
  title: string;
  content: string;
  documentType: string;
  quality: number; // 1-10 rating
  usage: number;
  metadata: Record<string, any>;
}

export interface TaskCanvas {
  id: string;
  title: string;
  content: string;
  contentType: string;
  taskId: string;
  isActive: boolean;
  lastModified: Date;
  progress: number; // 0-100%
  aiDriveFileId?: string;
  savedToAIDrive?: boolean;
}

export interface MultiCanvasSession {
  id: string;
  title: string;
  tasks: DetectedTask[];
  canvases: TaskCanvas[];
  createdAt: Date;
  completedTasks: number;
  totalTasks: number;
  estimatedCompletionTime: Date;
}

export class MultiCanvasTaskOrchestrator {
  private static instance: MultiCanvasTaskOrchestrator;
  private activeSessions: Map<string, MultiCanvasSession> = new Map();
  private currentIndustry: IndustryProfile;
  private industryProfiles: Map<string, IndustryProfile> = new Map();

  constructor() {
    this.initializeIndustryProfiles();
    this.currentIndustry = this.industryProfiles.get('legal')!; // Default to legal
  }

  static getInstance(): MultiCanvasTaskOrchestrator {
    if (!MultiCanvasTaskOrchestrator.instance) {
      MultiCanvasTaskOrchestrator.instance = new MultiCanvasTaskOrchestrator();
    }
    return MultiCanvasTaskOrchestrator.instance;
  }

  /**
   * 🏭 Initialize Industry Profiles - Easily extensible for any industry
   */
  private initializeIndustryProfiles(): void {
    // 🏛️ Legal Industry Profile
    this.industryProfiles.set('legal', {
      id: 'legal',
      name: 'Legal Services',
      taskTypes: ['motion', 'brief', 'contract', 'petition', 'legal-research', 'deposition', 'discovery', 'compliance'],
      keywords: ['legal', 'court', 'motion', 'brief', 'contract', 'petition', 'deposition', 'discovery', 'compliance', 'statute', 'regulation'],
      templates: {
        motion: '# {title}\n\n## Motion Framework\n**Court:** [Court Name]\n**Case:** [Case Number]\n**Date:** {date}\n\n## Motion Content\n{description}\n\n[Legal arguments will be developed here...]\n\n---\n*Legal Motion - {timestamp}*',
        brief: '# {title}\n\n## Legal Brief\n**Matter:** {description}\n**Date:** {date}\n\n## Arguments\n[Legal arguments and precedents will be developed here...]\n\n---\n*Legal Brief - {timestamp}*',
        contract: '# {title}\n\n## Contract Terms\n**Parties:** [To be defined]\n**Subject:** {description}\n\n## Terms and Conditions\n[Contract terms will be developed here...]\n\n---\n*Contract - {timestamp}*',
        'legal-research': '# {title}\n\n## Legal Research\n**Research Topic:** {description}\n\n## Case Law\n[Relevant cases will be researched here...]\n\n## Statutes\n[Applicable statutes will be analyzed here...]\n\n---\n*Legal Research - {timestamp}*'
      },
      priorityKeywords: {
        urgent: ['urgent', 'emergency', 'asap', 'immediately', 'deadline today', 'court tomorrow'],
        high: ['important', 'priority', 'critical', 'court next week', 'filing deadline'],
        medium: ['standard', 'routine', 'normal'],
        low: ['later', 'when possible', 'eventually', 'draft only']
      },
      estimatedTimes: {
        motion: 120,
        brief: 180,
        contract: 90,
        petition: 150,
        'legal-research': 240,
        deposition: 60,
        discovery: 90,
        compliance: 120,
        default: 90
      }
    });

    // 🏥 Medical Industry Profile
    this.industryProfiles.set('medical', {
      id: 'medical',
      name: 'Healthcare',
      taskTypes: ['patient-report', 'diagnosis', 'treatment-plan', 'medical-research', 'consultation', 'referral', 'documentation'],
      keywords: ['patient', 'diagnosis', 'treatment', 'medical', 'health', 'clinical', 'symptoms', 'consultation', 'referral', 'medication'],
      templates: {
        'patient-report': '# {title}\n\n## Patient Report\n**Patient:** [Patient ID/Name]\n**Date:** {date}\n**Chief Complaint:** {description}\n\n## Assessment\n[Clinical assessment will be documented here...]\n\n---\n*Medical Report - {timestamp}*',
        'treatment-plan': '# {title}\n\n## Treatment Plan\n**Patient:** [Patient Information]\n**Condition:** {description}\n\n## Treatment Protocol\n[Treatment steps will be outlined here...]\n\n---\n*Treatment Plan - {timestamp}*',
        'medical-research': '# {title}\n\n## Medical Research\n**Research Topic:** {description}\n\n## Literature Review\n[Research findings will be compiled here...]\n\n---\n*Medical Research - {timestamp}*'
      },
      priorityKeywords: {
        urgent: ['emergency', 'critical', 'stat', 'immediate', 'life-threatening'],
        high: ['urgent', 'priority', 'important', 'acute'],
        medium: ['routine', 'standard', 'follow-up'],
        low: ['preventive', 'wellness', 'education']
      },
      estimatedTimes: {
        'patient-report': 45,
        diagnosis: 60,
        'treatment-plan': 90,
        'medical-research': 180,
        consultation: 30,
        referral: 20,
        documentation: 30,
        default: 45
      }
    });

    // 💼 Business Industry Profile
    this.industryProfiles.set('business', {
      id: 'business',
      name: 'Business & Corporate',
      taskTypes: ['proposal', 'strategy', 'analysis', 'presentation', 'report', 'planning', 'marketing', 'financial'],
      keywords: ['business', 'strategy', 'proposal', 'analysis', 'presentation', 'report', 'planning', 'marketing', 'financial', 'revenue'],
      templates: {
        proposal: '# {title}\n\n## Business Proposal\n**Objective:** {description}\n**Date:** {date}\n\n## Executive Summary\n[Proposal details will be developed here...]\n\n---\n*Business Proposal - {timestamp}*',
        strategy: '# {title}\n\n## Strategic Plan\n**Goal:** {description}\n\n## Strategic Analysis\n[Strategy will be developed here...]\n\n---\n*Strategic Plan - {timestamp}*',
        analysis: '# {title}\n\n## Business Analysis\n**Analysis Topic:** {description}\n\n## Findings\n[Analysis results will be compiled here...]\n\n---\n*Business Analysis - {timestamp}*'
      },
      priorityKeywords: {
        urgent: ['urgent', 'board meeting', 'deadline today', 'crisis'],
        high: ['important', 'priority', 'stakeholder', 'executive'],
        medium: ['routine', 'quarterly', 'standard'],
        low: ['future', 'planning', 'exploratory']
      },
      estimatedTimes: {
        proposal: 120,
        strategy: 180,
        analysis: 90,
        presentation: 60,
        report: 75,
        planning: 90,
        marketing: 60,
        financial: 120,
        default: 60
      }
    });

    // 💻 Technology Industry Profile
    this.industryProfiles.set('technology', {
      id: 'technology',
      name: 'Technology & Software',
      taskTypes: ['documentation', 'specification', 'architecture', 'code-review', 'testing', 'deployment', 'research'],
      keywords: ['code', 'software', 'system', 'architecture', 'api', 'database', 'deployment', 'testing', 'documentation', 'specification'],
      templates: {
        documentation: '# {title}\n\n## Technical Documentation\n**System:** {description}\n**Date:** {date}\n\n## Overview\n[Technical details will be documented here...]\n\n---\n*Technical Documentation - {timestamp}*',
        specification: '# {title}\n\n## Technical Specification\n**Feature:** {description}\n\n## Requirements\n[Specifications will be detailed here...]\n\n---\n*Technical Specification - {timestamp}*',
        'code-review': '# {title}\n\n## Code Review\n**Component:** {description}\n\n## Review Notes\n[Code review findings will be documented here...]\n\n---\n*Code Review - {timestamp}*'
      },
      priorityKeywords: {
        urgent: ['critical bug', 'production down', 'security breach', 'hotfix'],
        high: ['bug', 'important feature', 'release blocker'],
        medium: ['enhancement', 'improvement', 'optimization'],
        low: ['nice to have', 'future', 'research']
      },
      estimatedTimes: {
        documentation: 90,
        specification: 120,
        architecture: 180,
        'code-review': 45,
        testing: 60,
        deployment: 30,
        research: 120,
        default: 75
      }
    });
  }

  /**
   * 🔄 Switch industry context
   */
  setIndustry(industryId: string): boolean {
    const industry = this.industryProfiles.get(industryId);
    if (industry) {
      this.currentIndustry = industry;
      console.log(`🏭 INDUSTRY: Switched to ${industry.name}`);
      return true;
    }
    return false;
  }

  /**
   * 📋 Get available industries
   */
  getAvailableIndustries(): IndustryProfile[] {
    return Array.from(this.industryProfiles.values());
  }

  /**
   * 🤖 Auto-detect industry from user input
   */
  autoDetectIndustry(userInput: string): string {
    const lowerInput = userInput.toLowerCase();
    let bestMatch = { industry: 'business', score: 0 }; // Default to business
    
    for (const [industryId, profile] of Array.from(this.industryProfiles.entries())) {
      let score = 0;
      
      // Score based on keyword matches
      for (const keyword of profile.keywords) {
        if (lowerInput.includes(keyword)) {
          score += 2; // Keyword match = 2 points
        }
      }
      
      // Score based on task type mentions
      for (const taskType of profile.taskTypes) {
        if (lowerInput.includes(taskType.replace('-', ' '))) {
          score += 3; // Task type match = 3 points
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { industry: industryId, score };
      }
    }
    
    // Auto-switch if confidence is high enough
    if (bestMatch.score >= 3) {
      this.setIndustry(bestMatch.industry);
      console.log(`🤖 AUTO-DETECT: Switched to ${this.industryProfiles.get(bestMatch.industry)?.name} (score: ${bestMatch.score})`);
    }
    
    return bestMatch.industry;
  }

  /**
   * 🎯 Smart industry detection with confidence scoring
   */
  detectIndustryWithConfidence(userInput: string): { industry: string; confidence: number; suggestions: string[] } {
    const lowerInput = userInput.toLowerCase();
    const scores: { [key: string]: number } = {};
    
    for (const [industryId, profile] of Array.from(this.industryProfiles.entries())) {
      scores[industryId] = 0;
      
      // Score based on keyword matches
      for (const keyword of profile.keywords) {
        if (lowerInput.includes(keyword)) {
          scores[industryId] += 2;
        }
      }
      
      // Score based on task type mentions
      for (const taskType of profile.taskTypes) {
        if (lowerInput.includes(taskType.replace('-', ' '))) {
          scores[industryId] += 3;
        }
      }
    }
    
    const sortedIndustries = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    const topIndustry = sortedIndustries[0];
    const confidence = topIndustry ? Math.min(topIndustry[1] / 10, 1) : 0;
    const suggestions = sortedIndustries.slice(0, 3).map(([industry]) => industry);
    
    return {
      industry: topIndustry ? topIndustry[0] : 'business',
      confidence,
      suggestions
    };
  }

  // 🧠 KNOWLEDGE BASE LEARNING INTEGRATION

  /**
   * 📚 Analyze user patterns from previous interactions
   */
  private analyzeUserPatterns(userInput: string): UserPattern[] {
    console.log('🧠 LEARNING: Analyzing user input patterns...');
    
    try {
      const knowledgeStore = useKnowledgeBaseStore.getState();
      const documents = knowledgeStore.documents;
      
      // Find patterns in user's previous successful document creations
      const patterns: UserPattern[] = [];
      const inputLower = userInput.toLowerCase();
      
      // Look for similar previous inputs and successful documents
      for (const doc of documents) {
        if (doc.metadata && doc.metadata.userInput) {
          const previousInput = doc.metadata.userInput.toLowerCase();
          const similarity = this.calculateSimilarity(inputLower, previousInput);
          
          if (similarity > 0.6) { // 60% similarity threshold
            patterns.push({
              id: doc.id,
              userId: 'current-user', // Use current user context
              inputPattern: doc.metadata.userInput,
              documentType: doc.metadata.documentType || 'unknown',
              preferredStructure: doc.content.substring(0, 500),
              frequency: doc.metadata.usage || 1,
              lastUsed: new Date(doc.lastUpdated),
              successRate: doc.metadata.rating || 0.8
            });
          }
        }
      }
      
      console.log(`🧠 LEARNING: Found ${patterns.length} similar patterns`);
      return patterns;
    } catch (error) {
      console.error('🧠 LEARNING: Error analyzing patterns:', error);
      return [];
    }
  }

  /**
   * 🔍 Query knowledge base for relevant document samples
   */
  private queryRelevantKnowledge(taskType: string, userInput: string): KnowledgeBaseSample[] {
    console.log(`🔍 KNOWLEDGE: Querying for ${taskType} samples...`);
    
    try {
      const knowledgeStore = useKnowledgeBaseStore.getState();
      const documents = knowledgeStore.documents;
      
      const samples: KnowledgeBaseSample[] = [];
      const inputKeywords = userInput.toLowerCase().split(' ');
      
      for (const doc of documents) {
        // Match by document type or content keywords
        const isRelevant = 
          doc.title.toLowerCase().includes(taskType) ||
          doc.content.toLowerCase().includes(taskType) ||
          inputKeywords.some(keyword => 
            keyword.length > 3 && doc.content.toLowerCase().includes(keyword)
          );
        
        if (isRelevant) {
          samples.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            documentType: doc.metadata?.documentType || taskType,
            quality: doc.metadata?.rating || 7,
            usage: doc.metadata?.usage || 1,
            metadata: doc.metadata || {}
          });
        }
      }
      
      // Sort by quality and usage
      samples.sort((a, b) => (b.quality * b.usage) - (a.quality * a.usage));
      
      console.log(`🔍 KNOWLEDGE: Found ${samples.length} relevant samples`);
      return samples.slice(0, 3); // Return top 3 samples
    } catch (error) {
      console.error('🔍 KNOWLEDGE: Error querying samples:', error);
      return [];
    }
  }

  /**
   * ✨ Enhance template with knowledge base insights
   */
  private enhanceWithKnowledge(template: string, userInput: string, taskType: string): string {
    console.log(`✨ ENHANCEMENT: Improving ${taskType} template with knowledge...`);
    
    try {
      // Get user patterns and knowledge samples
      const userPatterns = this.analyzeUserPatterns(userInput);
      const knowledgeSamples = this.queryRelevantKnowledge(taskType, userInput);
      
      let enhancedTemplate = template;
      
      // Apply user pattern preferences
      if (userPatterns.length > 0) {
        const bestPattern = userPatterns[0]; // Highest scoring pattern
        console.log(`✨ ENHANCEMENT: Applying user pattern from ${bestPattern.documentType}`);
        
        // Extract structural preferences from user's successful patterns
        if (bestPattern.preferredStructure.includes('### ')) {
          enhancedTemplate = enhancedTemplate.replace(/## /g, '### ');
        }
        if (bestPattern.preferredStructure.includes('**Priority:**')) {
          enhancedTemplate = enhancedTemplate.replace('{description}', '**Priority:** [To be defined]\n\n{description}');
        }
      }
      
      // Enhance with knowledge base content structure
      if (knowledgeSamples.length > 0) {
        const bestSample = knowledgeSamples[0]; // Highest quality sample
        console.log(`✨ ENHANCEMENT: Using sample structure from "${bestSample.title}"`);
        
        // Extract common sections from successful documents
        const sampleSections = this.extractSections(bestSample.content);
        const templateSections = this.extractSections(enhancedTemplate);
        
        // Add missing sections that appear in successful samples
        for (const section of sampleSections) {
          if (!templateSections.includes(section) && section.length > 3) {
            enhancedTemplate += `\n\n## ${section}\n[${section} content will be developed here...]`;
          }
        }
      }
      
      console.log(`✨ ENHANCEMENT: Template enhanced successfully`);
      return enhancedTemplate;
    } catch (error) {
      console.error('✨ ENHANCEMENT: Error enhancing template:', error);
      return template; // Return original if enhancement fails
    }
  }

  /**
   * 💾 Store successful workflow pattern for future learning
   */
  storeWorkflowPattern(userInput: string, taskType: string, success: boolean, metadata: any): void {
    console.log(`💾 STORING: Workflow pattern for ${taskType} (success: ${success})`);
    
    try {
      // This would typically save to a learning database
      // For now, we'll add it to the knowledge base metadata
      const pattern = {
        userInput,
        taskType,
        success,
        timestamp: new Date(),
        industry: this.currentIndustry.id,
        metadata
      };
      
      // Store pattern for future reference
      localStorage.setItem(
        `workflow_pattern_${Date.now()}`, 
        JSON.stringify(pattern)
      );
      
      console.log(`💾 STORED: Pattern saved for future learning`);
    } catch (error) {
      console.error('💾 STORAGE: Error storing pattern:', error);
    }
  }

  /**
   * 🔢 Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ').filter(word => word.length > 2);
    const words2 = str2.split(' ').filter(word => word.length > 2);
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        matches++;
      }
    }
    
    return Math.max(words1.length, words2.length) > 0 ? 
      matches / Math.max(words1.length, words2.length) : 0;
  }

  /**
   * 📑 Extract sections from document content
   */
  private extractSections(content: string): string[] {
    const sectionRegex = /##\s+([^#\n]+)/g;
    const sections: string[] = [];
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push(match[1].trim());
    }
    
    return sections;
  }

  /**
   * 🔍 Universal task detection from user input using industry-aware analysis (Enhanced with Knowledge Base Learning)
   */
  async detectTasksFromInput(userInput: string): Promise<DetectedTask[]> {
    // Auto-detect industry context first
    const detectedIndustry = this.autoDetectIndustry(userInput);
    
    console.log(`🔍 TASK DETECTION: Analyzing input for multiple tasks in ${this.currentIndustry.name} context...`, userInput);
    console.log('🔍 DEBUGGING: Full input for analysis:', JSON.stringify(userInput));
    
    // � USE AI AGENT ORCHESTRATOR'S INTELLIGENT ANALYSIS (Fix for compound requests)
    const aiAnalysis = await this.intelligentDocumentAnalysis(userInput);
    console.log('🔍 AI ANALYSIS RESULT:', {
      documentsDetected: aiAnalysis.documentsDetected.length,
      documents: aiAnalysis.documentsDetected.map(d => ({ title: d.title, type: d.type })),
      reasoning: aiAnalysis.reasoning,
      confidence: aiAnalysis.confidence
    });
    
    if (aiAnalysis.documentsDetected.length > 1) {
      console.log('🤖 AI AGENT ANALYSIS: Multiple documents detected with document IDs!', aiAnalysis.documentsDetected);
      
      // Convert AI analysis to DetectedTask format with document IDs
      const aiTasks = aiAnalysis.documentsDetected.map(doc => ({
        id: doc.documentId, // Use AI-generated document ID
        title: doc.title,
        description: doc.title,
        type: doc.type,
        industry: this.currentIndustry.id,
        priority: doc.priority.toLowerCase() as any,
        estimatedTime: this.estimateTime(doc.title),
        dependencies: [],
        status: 'detected' as any,
        assignedAgent: doc.agent,
        agentStatus: 'assigned' as any,
        subTasks: [],
        agentNotes: `AI-detected ${doc.type} assigned to ${doc.agent} with document ID: ${doc.documentId}`
      }));
      
      console.log('🎯 AI AGENT TASKS CREATED:', aiTasks.map(t => ({ title: t.title, agent: t.assignedAgent, docId: t.id })));
      return aiTasks;
    }
    
    // �🧠 ANALYZE USER PATTERNS FOR BETTER DETECTION (Fallback)
    const userPatterns = this.analyzeUserPatterns(userInput);
    console.log(`🧠 LEARNING: Found ${userPatterns.length} similar user patterns`);
    
    let tasks: DetectedTask[] = [];
    
    // 🔧 PRIORITY-BASED PATTERN DETECTION (prevents overlapping matches)
    const patternGroups = [
      {
        name: 'COMPOUND_REQUESTS',
        priority: 1,
        patterns: [
          // Pattern for "I need X, and Y" or "I need X and Y"
          /(?:i\s+)?(?:need|want|require)\s+(?:a\s+)?([^,]+?)(?:,\s*)?(?:and|&)\s+(?:anther|another|also)?\s*(?:with\s+)?(?:a\s+)?([^.!?]+)/gi,
          // Pattern for action words with compound requests
          /(?:create|make|write|draft|prepare|develop|build|design|plan|research|analyze|review|generate|produce)\s+([^,]+?)(?:,\s*)?(?:and|&)\s+(?:anther|another|also)?\s*(?:with\s+)?(?:a\s+)?([^.!?]+)/gi,
        ]
      },
      {
        name: 'STRUCTURED_LISTS',
        priority: 2,
        patterns: [
          // Numbered lists (1. 2. 3.)
          /(?:^|\n)\s*(\d+)\.\s*([^\n]+)/g,
          // Bullet points (- • *)
          /(?:^|\n)\s*[-•*]\s*([^\n]+)/g,
        ]
      },
      {
        name: 'ACTION_PATTERNS',
        priority: 3,
        patterns: [
          // Action words followed by content (industry-agnostic)
          /(?:create|make|write|draft|prepare|develop|build|design|plan|research|analyze|review|generate|produce)\s+(?:a\s+|an\s+)?([^,.;!?]+)/gi,
        ]
      },
      {
        name: 'INTENT_PATTERNS',
        priority: 4,
        patterns: [
          // "Need to" patterns
          /(?:need to|should|must|have to|want to|please)\s+([^,.;!?]+)/gi,
        ]
      },
      {
        name: 'INDUSTRY_SPECIFIC',
        priority: 5,
        patterns: this.getIndustrySpecificPatterns()
      }
    ];

    console.log('🔍 DEBUGGING: Pattern groups to test:', patternGroups.length);
    
    let inputProcessed = false;

    // Process patterns in priority order, stop after first successful group
    for (const group of patternGroups) {
      if (inputProcessed && tasks.length > 0) {
        console.log(`🔧 PRIORITY STOP: Found ${tasks.length} tasks in ${group.name}, skipping lower priority patterns`);
        break;
      }
      
      console.log(`🔍 PROCESSING GROUP: ${group.name} (Priority ${group.priority})`);
      let groupFoundTasks = false;
      
      for (const pattern of group.patterns) {
        console.log('🔍 DEBUGGING: Testing pattern:', pattern.toString().substring(0, 100));
        let match;
        
        while ((match = pattern.exec(userInput)) !== null) {
          console.log('🔍 DEBUGGING: Pattern matched! Raw match:', match);
          groupFoundTasks = true;
          
          // 🎯 HANDLE COMPOUND PATTERNS (multiple capture groups)
          if (match.length > 2 && match[1] && match[2]) {
            // This is a compound pattern with two tasks
            const task1Text = this.cleanTaskText(match[1]);
            const task2Text = this.cleanTaskText(match[2]);
            
            console.log('🎯 COMPOUND: Found two tasks:', task1Text, '&', task2Text);
            
            if (task1Text && task1Text.length > 5 && !this.isTaskDuplicate(tasks, task1Text)) {
              const task1 = this.createTaskFromText(task1Text, userInput);
              console.log('🔍 DEBUGGING: Created compound task 1:', task1.title);
              tasks.push(task1);
            }
            
            if (task2Text && task2Text.length > 5 && !this.isTaskDuplicate(tasks, task2Text)) {
              const task2 = this.createTaskFromText(task2Text, userInput);
              console.log('🔍 DEBUGGING: Created compound task 2:', task2.title);
              tasks.push(task2);
            }
          } else {
            // Regular single pattern
            const taskText = this.cleanTaskText(match[1] || match[2] || match[0]);
            console.log('🔍 DEBUGGING: Single task matched:', taskText);
            
            if (taskText && taskText.length > 5 && !this.isTaskDuplicate(tasks, taskText)) {
              const task = this.createTaskFromText(taskText, userInput);
              console.log('🔍 DEBUGGING: Created task:', task.title);
              tasks.push(task);
            }
          }
        }
      }
      
      if (groupFoundTasks && tasks.length > 0) {
        inputProcessed = true;
        console.log(`✅ PATTERN SUCCESS: ${group.name} found ${tasks.length} tasks, marking input as processed`);
      }
    }

    console.log('🔍 DEBUGGING: Initial tasks found:', tasks.length, tasks.map(t => t.title));

    // 🤖 SMART COMPOUND REQUEST SPLITTING (Fix for "petition AND letter" detection)
    if (tasks.length === 1) {
      console.log('🔍 DEBUGGING: Single task found, attempting intelligent splitting...');
      const splitTasks = this.intelligentTaskSplitting(tasks[0], userInput);
      if (splitTasks.length > 1) {
        console.log(`🧠 SMART SPLIT: Split "${tasks[0].title}" into ${splitTasks.length} separate tasks`);
        tasks = splitTasks; // Replace single task with split tasks
      }
    }

    // If no tasks detected through patterns, try semantic analysis
    if (tasks.length === 0) {
      const semanticTasks = await this.semanticTaskDetection(userInput);
      tasks.push(...semanticTasks);
    }

    // Remove duplicates and enhance tasks
    const uniqueTasks = this.removeDuplicateTasks(tasks);
    const enhancedTasks = await this.enhanceTasksWithAI(uniqueTasks, userInput);

    // 🧠 ENHANCE TASKS WITH KNOWLEDGE BASE INSIGHTS
    for (const task of enhancedTasks) {
      const relevantKnowledge = this.queryRelevantKnowledge(task.type, userInput);
      if (relevantKnowledge.length > 0) {
        console.log(`📚 KNOWLEDGE: Found ${relevantKnowledge.length} relevant samples for ${task.type}`);
        // Use knowledge to refine task details
        task.description = this.enhanceTaskDescription(task.description, relevantKnowledge);
      }
    }

    console.log(`✅ TASK DETECTION: Found ${enhancedTasks.length} tasks for ${this.currentIndustry.name} with knowledge enhancement:`, enhancedTasks.map(t => t.title));
    return enhancedTasks;
  }

  /**
   * 🎯 Get industry-specific detection patterns
   */
  private getIndustrySpecificPatterns(): RegExp[] {
    const keywords = this.currentIndustry.keywords.join('|');
    const taskTypes = this.currentIndustry.taskTypes.join('|');
    
    return [
      // Industry keywords with content
      new RegExp(`(?:${keywords})\\s+(?:for|about|regarding)\\s+([^,.;!?]+)`, 'gi'),
      // Task types with content
      new RegExp(`(?:${taskTypes})\\s+(?:for|about|regarding)?\\s*([^,.;!?]+)`, 'gi'),
      // Create/make + industry task types
      new RegExp(`(?:create|make|write|draft|prepare)\\s+(?:a|an)?\\s*(?:${taskTypes})\\s*(?:for|about)?\\s*([^,.;!?]+)`, 'gi')
    ];
  }

  /**
   * 🎨 Create multiple canvases for detected tasks
   */
  async createMultiCanvasSession(
    userInput: string,
    tasks: DetectedTask[]
  ): Promise<MultiCanvasSession> {
    const sessionId = uuidv4();
    const timestamp = new Date();
    
    console.log(`🎨 MULTI-CANVAS: Creating session with ${tasks.length} canvases...`);

    // Create canvases for each task
    const canvases: TaskCanvas[] = [];
    
    for (const task of tasks) {
      const canvas = await this.createCanvasForTask(task, userInput);
      canvases.push(canvas);
      
      // Update task with canvas ID
      task.canvasId = canvas.id;
      task.status = 'canvas_created';
    }

    // Calculate estimated completion time
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const estimatedCompletionTime = new Date(timestamp.getTime() + (totalEstimatedTime * 60 * 1000));

    const session: MultiCanvasSession = {
      id: sessionId,
      title: this.generateSessionTitle(tasks),
      tasks,
      canvases,
      createdAt: timestamp,
      completedTasks: 0,
      totalTasks: tasks.length,
      estimatedCompletionTime
    };

    this.activeSessions.set(sessionId, session);

    console.log(`✅ MULTI-CANVAS: Session created with ${canvases.length} canvases`);
    return session;
  }

  /**
   * 🏗️ Create a canvas for a specific task
   */
  private async createCanvasForTask(task: DetectedTask, originalInput: string): Promise<TaskCanvas> {
    const canvasId = uuidv4();
    
    // Generate initial content based on task type
    const content = await this.generateInitialCanvasContent(task, originalInput);
    
    return {
      id: canvasId,
      title: task.title,
      content,
      contentType: task.type,
      taskId: task.id,
      isActive: false, // Will be activated by the UI
      lastModified: new Date(),
      progress: 0
    };
  }

  /**
   * 📝 Generate initial content for a canvas based on task type and industry (Enhanced with KB Learning)
   */
  private async generateInitialCanvasContent(task: DetectedTask, originalInput: string): Promise<string> {
    console.log(`📝 CONTENT: Generating enhanced content for ${task.type}...`);
    
    // Use the enhanced generateTemplate method with knowledge base integration
    const enhancedContent = this.generateTemplate(task, originalInput);
    
    // Store the workflow pattern for learning
    this.storeWorkflowPattern(originalInput, task.type, true, {
      taskId: task.id,
      industry: this.currentIndustry.id,
      template: 'enhanced',
      contentLength: enhancedContent.length
    });

    console.log(`📝 CONTENT: Enhanced content generated (${enhancedContent.length} chars)`);
    return enhancedContent;
  }

  /**
   * 🧠 Create a task object from detected text (industry-aware)
   */
  private createTaskFromText(taskText: string, originalInput: string): DetectedTask {
    const taskType = this.determineTaskType(taskText);
    const assignedAgent = this.assignSpecializedAgent(taskText, taskType, this.currentIndustry.id);
    
    return {
      id: uuidv4(),
      title: this.generateTaskTitle(taskText),
      description: taskText,
      type: taskType,
      industry: this.currentIndustry.id,
      priority: this.determinePriority(taskText, originalInput),
      estimatedTime: this.estimateTime(taskText),
      dependencies: [],
      status: 'detected',
      
      // 🤖 AI AGENT ENHANCEMENTS
      assignedAgent: assignedAgent,
      agentStatus: 'assigned',
      subTasks: [],
      agentNotes: `Assigned to ${assignedAgent} based on task type: ${taskType}`
    };
  }

  /**
   * 🤖 Assign specialized agent based on task content and industry
   */
  private assignSpecializedAgent(taskText: string, taskType: string, industry: string): AgentType {
    const lowerText = taskText.toLowerCase();
    
    // Legal document detection
    if (industry === 'legal' || 
        /petition|motion|brief|contract|joinder|legal|court|filing|lawsuit|statute/.test(lowerText)) {
      return AgentType.LEGAL_AGENT;
    }
    
    // Medical document detection  
    if (industry === 'medical' || 
        /letter.*dr\.|letter.*doctor|medical|health|patient|diagnosis|treatment|clinical/.test(lowerText)) {
      return AgentType.MEDICAL_AGENT;
    }
    
    // Email/communication tasks
    if (/send|email|notify|correspondence|message|communication/.test(lowerText)) {
      return AgentType.EMAIL_AGENT;
    }
    
    // Calendar/scheduling tasks
    if (/schedule|calendar|meeting|appointment|book|reserve/.test(lowerText)) {
      return AgentType.CALENDAR_AGENT;
    }
    
    // Appointment-specific tasks
    if (/appointment|consultation|visit|booking/.test(lowerText)) {
      return AgentType.APPOINTMENT_AGENT;
    }
    
    // Default to document agent for general document creation
    return AgentType.DOCUMENT_AGENT;
  }

  /**
   * 🧠 INTELLIGENT DOCUMENT ANALYSIS - AI Self-Analysis Method (from AIAgentOrchestrator)
   */
  private async intelligentDocumentAnalysis(userInput: string): Promise<{
    documentsDetected: Array<{
      title: string;
      type: string;
      agent: AgentType;
      documentId: string;
      priority: any;
    }>;
    reasoning: string;
    confidence: number;
  }> {
    console.log('🧠 AI SELF-ANALYSIS: Analyzing user request:', userInput);
    console.log('🔥 [CRITICAL DEBUG] intelligentDocumentAnalysis method called!');
    
    const input = userInput.toLowerCase();
    const documents = [];
    let reasoning = '';
    
    // 🎯 AI THINKING: Use flexible outline detection FIRST
    const outlineStructure = this.detectOutlineStructure(userInput);
    console.log('🎯 OUTLINE STRUCTURE CHECK:', outlineStructure);
    
    if (outlineStructure.isOutline && outlineStructure.sections.length > 1) {
      reasoning = `AI detected structured outline with ${outlineStructure.sections.length} sections`;
      
      // 🔧 SCHMIDT FIX: Use outline sections directly instead of fragmented detection
      for (const section of outlineStructure.sections) {
        // 🔧 SCHMIDT FIX: Extract employer from title line and create clean title
        let title = section.title;
        let employer = null;
        
        // Extract employer from title if present: "Title (Employer: Name)"
        const employerMatch = section.title.match(/\(employer:\s*([^)]+)\)/i);
        if (employerMatch) {
          employer = employerMatch[1].trim();
          // Remove employer parenthetical from title
          title = section.title.replace(/\s*\(employer:[^)]+\)/i, '').trim();
        }
        
        // Create final title with employer
        if (employer && employer !== 'Client') {
          title = `${title} - ${employer}`;
        }
        
        documents.push({
          title: title,
          type: this.determineDocumentType(section.title, section.content),
          agent: this.determineAgentType(section.title, section.content),
          documentId: `doc_outline_${section.numeral}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          priority: 'high'
        });
      }
      
      console.log(`🎯 SCHMIDT FIX: Created ${documents.length} documents from outline structure`);
    } else {
      // 🎯 FALLBACK: Use traditional detection if no outline structure
      const hasMultipleIndicators = this.detectMultipleWorkProducts(input);
      console.log('🎯 MULTIPLE INDICATORS CHECK (fallback):', hasMultipleIndicators);
      
      if (hasMultipleIndicators.isMultiple) {
        reasoning = `AI detected multiple work products: ${hasMultipleIndicators.indicators.join(', ')}`;
        
        // 📋 Legal Documents Detection - Case Plans
        if (/case\s*plan|plan\s*of\s*action|polan.*action|opening.*case/i.test(input)) {
          const clientName = /for\s+([a-z\s]+?)(?:\s*,|\s*and|\s*$)/i.exec(input)?.[1] || 'Client';
          documents.push({
            title: `Opening Case Plan of Action - ${clientName.trim()}`,
            type: 'legal_case_plan',
            agent: AgentType.LEGAL_AGENT,
            documentId: `doc_case_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: 'high'
          });
        }
        
        // 📋 Legal Documents Detection - Petitions
        if (/petition.*joinder|petition.*for|penalty.*petition|petition/i.test(input)) {
          const petitionType = /joinder/i.test(input) ? 'Petition for Joinder of UEBTF' : 'Penalty Petition';
          documents.push({
            title: petitionType,
            type: 'legal_petition',
            agent: AgentType.LEGAL_AGENT,
            documentId: `doc_petition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: 'high'
          });
        }
        
        // 📨 Medical Letters Detection
        if (/letter.*dr\.|letter.*doctor|correspondence.*medical/i.test(input)) {
          const doctorName = this.extractDoctorName(input) || 'Doctor';
          documents.push({
            title: `Letter to ${doctorName}`,
            type: 'medical_letter',
            agent: AgentType.MEDICAL_AGENT,
            documentId: `doc_letter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: 'medium'
          });
        }
        
        // 📄 Generic Documents Detection
        if (/contract|agreement/i.test(input)) {
          documents.push({
            title: 'Contract',
            type: 'legal_contract',
            agent: AgentType.LEGAL_AGENT,
            documentId: `doc_contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: 'high'
          });
        }
      } // Close fallback block
    }
    
    const confidence = documents.length > 0 ? 0.9 : 0.3;
    
    console.log('🤖 AI ANALYSIS RESULT:', { documentsDetected: documents.length, reasoning, confidence });
    
    return {
      documentsDetected: documents,
      reasoning,
      confidence
    };
  }

  /**
   * 🔍 Detect Multiple Work Products (AI Logic) - ENHANCED with Outline Structure
   */
  private detectMultipleWorkProducts(input: string): { isMultiple: boolean; indicators: string[] } {
    console.log('🔍 DETECTION: Analyzing input for multiple work products:', input);
    const indicators = [];
    
    // 🎯 PRIORITY 1: Check for ANY structured content (flexible detection)
    const outlineStructure = this.detectOutlineStructure(input);
    if (outlineStructure.sections.length > 1) {
      indicators.push(`flexible structure: ${outlineStructure.sections.length} sections`);
      console.log('✅ DETECTION: Found flexible structure with', outlineStructure.sections.length, 'sections');
      return { isMultiple: true, indicators };
    }
    
    // 🎯 PRIORITY 3: Traditional conjunction indicators (but be more selective)
    const conjunctionCount = (input.match(/\sand\s/g) || []).length;
    if (conjunctionCount >= 2) { // Require multiple "and"s to avoid false positives
      indicators.push(`multiple conjunctions: ${conjunctionCount}`);
      console.log('✅ DETECTION: Found multiple conjunctions');
    }
    
    const commaCount = (input.match(/,/g) || []).length;
    if (commaCount >= 3) { // Require multiple commas for structured content
      indicators.push(`comma separation: ${commaCount} commas`);
      console.log('✅ DETECTION: Found significant comma separation');
    }
    
    // Explicit multi-canvas requests
    if (/separate.*canvas|two.*canvas|multiple.*canvas|different.*canvas/i.test(input)) {
      indicators.push('explicit multi-canvas request');
      console.log('✅ DETECTION: Found explicit multi-canvas request');
    }
    
    // Update + Create patterns (FIXED: Only when explicitly creating new content)
    if (/update.*(?:petition|motion|brief).*(?:also|and).*(?:create|new|canvas|another)/i.test(input) ||
        /(?:also|and).*create.*canvas.*update/i.test(input)) {
      indicators.push('update + create pattern');
      console.log('✅ DETECTION: Found update + create pattern');
    }
    
    // 🚫 EXCLUSION: Pure status update requests should NOT trigger multi-canvas
    if (/update\s+on\s+them|update\s+me|status\s+update|give.*update|progress.*update/i.test(input)) {
      console.log('🚫 DETECTION: Excluding pure status update request');
      return { isMultiple: false, indicators: ['pure status update - not multi-canvas'] };
    }
    
    // "Another canvas" patterns
    if (/another\s+canvas|additional\s+canvas|new\s+canvas|second\s+canvas/i.test(input)) {
      indicators.push('another canvas request');
      console.log('✅ DETECTION: Found another canvas request');
    }
    
    // Multiple document types
    const documentTypes = [];
    if (/petition/i.test(input)) documentTypes.push('petition');
    if (/letter|correspondence/i.test(input)) documentTypes.push('letter');
    if (/contract/i.test(input)) documentTypes.push('contract');
    if (/motion/i.test(input)) documentTypes.push('motion');
    if (/case\s*plan|plan\s*of\s*action|polan/i.test(input)) documentTypes.push('case plan');
    if (/brief/i.test(input)) documentTypes.push('brief');
    if (/pleading/i.test(input)) documentTypes.push('pleading');
    
    // 🎯 CRITICAL FIX: Don't treat pure "update" requests as document creation
    // Only treat as document type if it's "update + create something new"
    if (/update.*(?:petition|letter|contract|motion|brief|pleading|canvas)/i.test(input) && 
        !/update\s+on\s+them|update\s+me|status\s+update|give.*update/i.test(input)) {
      documentTypes.push('update with new document');
    }
    
    if (documentTypes.length >= 2) {
      indicators.push(`multiple document types: ${documentTypes.join(', ')}`);
      console.log('✅ DETECTION: Found multiple document types:', documentTypes);
    }
    
    console.log('🔍 DETECTION RESULT:', { isMultiple: indicators.length > 0, indicators });
    
    return {
      isMultiple: indicators.length > 0,
      indicators
    };
  }

  /**
   * 👨‍⚕️ Extract Doctor Name from Input
   */
  private extractDoctorName(input: string): string | null {
    const patterns = [
      /(?:dr\.?\s+|doctor\s+)([a-z]+)/i,
      /letter\s+to\s+(?:dr\.?\s+|doctor\s+)?([a-z]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return `Dr. ${match[1]}`;
      }
    }
    
    return null;
  }

  /**
   * 🔢 Count different document types in input
   */
  private countDocumentTypes(input: string): number {
    const documentTypes = [
      'petition', 'letter', 'correspondence', 'contract', 'motion', 'brief', 
      'plan', 'action', 'report', 'memo', 'memorandum', 'pleading', 'case'
    ];
    
    const foundTypes = new Set<string>();
    const lowerInput = input.toLowerCase();
    
    for (const type of documentTypes) {
      if (lowerInput.includes(type)) {
        foundTypes.add(type);
      }
    }
    
    return foundTypes.size;
  }

  /**
   * 🎯 FLEXIBLE: Detect ANY structured content, not rigid patterns
   */
  private detectOutlineStructure(input: string): { sections: OutlineSection[]; isOutline: boolean } {
    const sections: OutlineSection[] = [];
    
    // 🎯 FLEXIBLE PATTERNS - Match any structured content
    const flexiblePatterns = [
        // Any numbered content with bold formatting: "1. **Anything here**"
        /(\d+)\.\s*\*\*([^*]+?)\*\*\s*([^]*?)(?=\n\s*\d+\.|$)/gi,
        
        // IMPROVED: Numbered content with optional sub-bullets (handles mixed formats)
        /(\d+)\.\s*([^\n]+?)(?:\n(?:\s*[-•*]\s*[^\n]*)*)?(?=\n\s*\d+\.|$)/gi,
        
        // Any numbered content without bold: "1. Anything here"  
        /(\d+)\.\s*([^\n]+?)(?:\s*:\s*)?([^]*?)(?=\n\s*\d+\.|$)/gi,
        
        // Roman numerals anywhere: "I. Anything" or "**I. Anything**" - FIXED to capture full title line and content
        /(\b(?:I{1,3}|IV|V|VI{0,3}|IX|X)\b)\.\s*([^\n]+)\s*\n([^]*?)(?=\n\s*(?:\b(?:I{1,3}|IV|V|VI{0,3}|IX|X)\b)\.|$)/gi,
        
        // Bullet points: "• Anything" or "- Anything"
        /^[-•*]\s*([^\n]+?)(?:\s*:\s*)?([^]*?)(?=\n\s*[-•*]|$)/gmi,
        
        // Headers: "## Anything" or "# Anything"
        /^#+\s*([^\n]+?)(?:\s*:\s*)?([^]*?)(?=\n\s*#+|$)/gmi
    ];
    
    console.log('🎯 FLEXIBLE OUTLINE: Testing flexible patterns on input...');
    
    for (const pattern of flexiblePatterns) {
        let match;
        let patternSections: OutlineSection[] = [];
        
        while ((match = pattern.exec(input)) !== null) {
            const [fullMatch, identifier, title, content] = match;
            
            // Clean up the extracted parts
            const cleanTitle = title?.trim() || 'Untitled Section';
            const cleanContent = content?.trim() || '';
            
            patternSections.push({
                numeral: identifier || `${patternSections.length + 1}`,
                title: cleanTitle,
                content: cleanContent,
                fullMatch: fullMatch.trim(),
                startIndex: match.index
            });
        }
        
        // If this pattern found multiple sections, use it!
        if (patternSections.length > 1) {
            console.log(`✅ FLEXIBLE: Found ${patternSections.length} sections with pattern`);
            sections.push(...patternSections);
            break; // Use the first successful pattern
        }
    }
    
    // 🎯 FALLBACK: Split by any clear separators if structured patterns fail
    if (sections.length <= 1) {
        const fallbackSections = this.detectAnySeparatedSections(input);
        if (fallbackSections.length > 1) {
            console.log(`🎯 FALLBACK: Found ${fallbackSections.length} sections using separator detection`);
            sections.push(...fallbackSections);
        }
    }
    
    console.log(`🎯 FLEXIBLE OUTLINE: Final result: ${sections.length} sections found`);
    sections.forEach((section, index) => {
        console.log(`  ${index + 1}. [${section.numeral}] ${section.title.substring(0, 50)}...`);
    });
    
    return { sections, isOutline: sections.length > 1 };
  }

  /**
   * 🎯 SUPER FLEXIBLE: Detect ANY separated sections
   */
  private detectAnySeparatedSections(input: string): OutlineSection[] {
    const sections: OutlineSection[] = [];
    
    // Try different separation strategies
    const separationStrategies = [
        // Double line breaks with content
        /([^]*?)(?=\n\s*\n|\n\s*\d+\.|\n\s*[A-Z][^]*?:)/g,
        
        // Sentences ending with periods that seem like titles
        /([^.!?]+[.!?])\s*([^]*?)(?=\n|$)/g,
        
        // Any content with "and" separators
        /([^]*?)(?:\s+and\s+)([^]*?)(?:\s+and\s+|$)/gi
    ];
    
    for (const strategy of separationStrategies) {
        let match;
        let strategySections: OutlineSection[] = [];
        
        while ((match = strategy.exec(input)) !== null) {
            if (match[1] && match[1].trim().length > 10) {
                strategySections.push({
                    numeral: `${strategySections.length + 1}`,
                    title: this.extractTitleFromContent(match[1]),
                    content: match[1].trim(),
                    fullMatch: match[0],
                    startIndex: match.index
                });
            }
        }
        
        if (strategySections.length > 1) {
            console.log(`🎯 STRATEGY SUCCESS: Found ${strategySections.length} sections`);
            return strategySections;
        }
    }
    
    return sections;
  }

  /**
   * 🎯 SMART: Extract meaningful title from any content
   */
  private extractTitleFromContent(content: string): string {
    const cleanContent = content.trim();
    
    // Try to find the first meaningful phrase
    const titlePatterns = [
        // First sentence up to 50 chars
        /^([^.!?]{10,50})[.!?]/,
        
        // First line
        /^([^\n]{10,50})/,
        
        // Content before colon
        /^([^:]{10,50}):/,
        
        // Any document type keywords
        /(plan\s+of\s+action|medical\s+records?|communication|letter|petition|contract|report|analysis)[^.]*/i,
        
        // Just take first 40 characters
        /^(.{10,40})/
    ];
    
    for (const pattern of titlePatterns) {
        const match = cleanContent.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return cleanContent.substring(0, 40) + '...';
  }



  /**
   * 🎯 SUPER FLEXIBLE: Extract tasks from ANY compound structure
   */
  private extractCompoundTasks(originalText: string): string[] {
    const tasks: string[] = [];
    
    console.log('🎯 FLEXIBLE EXTRACT: Analyzing any compound structure:', originalText);
    
    // 🎯 PRIORITY 1: Try flexible outline detection
    const outlineStructure = this.detectOutlineStructure(originalText);
    if (outlineStructure.isOutline) {
        console.log('🎯 EXTRACT: Using flexible outline structure');
        
        for (const section of outlineStructure.sections) {
            const taskTitle = section.title;
            
            if (taskTitle && taskTitle.length > 5) {
                tasks.push(taskTitle);
                console.log('🎯 EXTRACT: Added flexible task:', taskTitle);
            }
        }
        
        return tasks;
    }
    
    // 🎯 PRIORITY 2: Split on ANY obvious separators
    const separators = [
        /\s+and\s+/gi,           // "and"
        /,\s*and\s+/gi,          // ", and"  
        /;\s*/g,                 // semicolon
        /\.\s*(?=[A-Z])/g,       // period followed by capital
        /\n\s*[-•*]\s*/g,        // bullet points
        /\n\s*\d+\.\s*/g         // numbered lists
    ];
    
    for (const separator of separators) {
        const parts = originalText.split(separator);
        
        if (parts.length > 1) {
            console.log(`🎯 EXTRACT: Split found ${parts.length} parts using separator`);
            
            const meaningfulParts = parts
                .map(part => part.trim())
                .filter(part => part.length > 10 && !this.isFillerText(part));
            
            if (meaningfulParts.length > 1) {
                tasks.push(...meaningfulParts.map(part => this.extractTitleFromContent(part)));
                console.log('🎯 EXTRACT: Added separated tasks:', meaningfulParts.length);
                return tasks;
            }
        }
    }
    
    console.log('🎯 EXTRACT: No clear separation found');
    return tasks;
  }

  /**
   * 🎯 Helper: Check if text is just filler/connector words
   */
  private isFillerText(text: string): boolean {
    const fillerPatterns = [
        /^(also|anther|another|with|for|the|a|an|in|on|at|to|from)$/i,
        /^(please|need|want|i|me|you|we|they)$/i,
        /^[^a-zA-Z]*$/  // Only punctuation/numbers
    ];
    
    const cleanText = text.trim().toLowerCase();
    return fillerPatterns.some(pattern => pattern.test(cleanText)) || cleanText.length < 5;
  }

  /**
   * 🧠 Intelligent task splitting for compound requests with "and"
   */
  private intelligentTaskSplitting(singleTask: DetectedTask, originalInput: string): DetectedTask[] {
    const taskText = singleTask.description.toLowerCase();
    const originalText = originalInput.toLowerCase();
    
    console.log('🧠 SMART SPLIT: Analyzing original input for compound patterns:', originalText);
    
    // 🎯 ANALYZE ORIGINAL INPUT (not just extracted task) for compound indicators
    const hasAndPattern = /\s+and\s+/i.test(originalText) || /,\s*and\s+/i.test(originalText);
    const hasMultipleDocTypes = this.countDocumentTypes(originalText) >= 2;
    const hasCommaList = /,\s*(?:and\s+)?(?:a\s+)?(?:letter|petition|plan|report|memo|contract|brief)/i.test(originalText);
    
    // Check for specific compound patterns in original input
    const compoundPatterns = [
      /(?:plan|action)\s+.*?(?:and|,)\s*.*?(?:letter|correspondence)/i,
      /(?:letter|correspondence)\s+.*?(?:and|,)\s*.*?(?:plan|action)/i,
      /(?:petition|brief)\s+.*?(?:and|,)\s*.*?(?:letter|correspondence)/i,
      /(?:need|want|require)\s+.*?(?:and|,)\s*.*?(?:with|another|also)/i
    ];
    
    const hasCompoundPattern = compoundPatterns.some(pattern => pattern.test(originalText));
    
    console.log('🧠 SMART SPLIT: Compound analysis:', {
      hasAndPattern,
      hasMultipleDocTypes,
      hasCommaList,
      hasCompoundPattern,
      documentTypeCount: this.countDocumentTypes(originalText),
      originalText: originalText.substring(0, 100)
    });
    
    if (!hasAndPattern && !hasMultipleDocTypes && !hasCommaList && !hasCompoundPattern) {
      console.log('🧠 SMART SPLIT: No compound indicators found in original input');
      return [singleTask]; // No splitting needed
    }
    
    console.log('🧠 SMART SPLIT: Detected compound request, attempting to split from original input...');
    
    // 🎯 USE ADVANCED EXTRACTION from original input instead of simple splitting
    const extractedTasks = this.extractCompoundTasks(originalText);
    
    if (extractedTasks.length >= 2) {
      console.log('🎯 SMART SPLIT: Successfully extracted', extractedTasks.length, 'tasks:', extractedTasks);
      return extractedTasks.map(taskText => this.createTaskFromText(taskText, originalInput));
    }
    
    // Fallback: Try splitting the original text directly
    let parts: string[] = [];
    
    // Try different splitting strategies on ORIGINAL TEXT
    if (/,\s*and\s+/i.test(originalText)) {
      // Handle "item1, and item2" pattern
      parts = originalText.split(/,\s*and\s+/i);
    } else if (/\s+and\s+/i.test(originalText)) {
      // Handle simple "item1 and item2" pattern  
      parts = originalText.split(/\s+and\s+/i);
    } else {
      // Fallback to comma separation
      parts = originalText.split(/,\s+/);
    }
    
    console.log('🧠 SMART SPLIT: Split parts:', parts);
    
    const splitTasks: DetectedTask[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i].trim();
      
      // Clean up common prefixes/articles
      part = part.replace(/^(a\s+|an\s+|the\s+)/, '');
      
      // Skip very short parts
      if (part.length < 5) continue;
      
      // Create separate task for each meaningful part
      const splitTask = this.createTaskFromText(part, originalInput);
      splitTask.id = `${singleTask.id}_split_${i + 1}`;
      splitTask.title = this.generateTaskTitle(part);
      
      // Enhanced title detection for legal and medical documents
      if (/petition|joinder/i.test(part)) {
        splitTask.title = "Petition for Joinder";
        splitTask.type = "petition";
        splitTask.assignedAgent = AgentType.LEGAL_AGENT;
      } else if (/letter.*dr\.|letter.*doctor|letter.*daldalyan/i.test(part)) {
        splitTask.title = "Letter to Dr. Daldalyan";
        splitTask.type = "medical-letter";
        splitTask.assignedAgent = AgentType.MEDICAL_AGENT;
      } else if (/cas.*plan|plan.*action|case.*plan/i.test(part)) {
        splitTask.title = "CAS Plan of Action";
        splitTask.type = "case-plan";
        splitTask.assignedAgent = AgentType.LEGAL_AGENT;
      } else if (/letter.*internest|letter.*internal/i.test(part)) {
        splitTask.title = "Letter to Internist Dr. Daldalyan";
        splitTask.type = "medical-letter";
        splitTask.assignedAgent = AgentType.MEDICAL_AGENT;
      }
      
      splitTasks.push(splitTask);
      console.log(`🧠 SMART SPLIT: Created task ${i + 1}: "${splitTask.title}" (${splitTask.assignedAgent})`);
    }
    
    console.log(`🧠 SMART SPLIT: Final result: ${splitTasks.length > 1 ? 'SPLIT' : 'NO SPLIT'} - ${splitTasks.length} tasks`);
    return splitTasks.length > 1 ? splitTasks : [singleTask];
  }

  /**
   * 🏷️ Determine task type from content using industry context
   */
  private determineTaskType(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Check industry-specific task types first
    for (const taskType of this.currentIndustry.taskTypes) {
      const taskKeywords = taskType.split('-'); // Handle hyphenated types like 'legal-research'
      if (taskKeywords.some(keyword => lowerText.includes(keyword))) {
        return taskType;
      }
    }
    
    // Check industry keywords
    for (const keyword of this.currentIndustry.keywords) {
      if (lowerText.includes(keyword)) {
        // Try to find the most specific task type
        const relatedTaskType = this.findRelatedTaskType(lowerText, keyword);
        if (relatedTaskType) {
          return relatedTaskType;
        }
      }
    }
    
    // Universal fallback types
    if (lowerText.includes('email') || lowerText.includes('message')) {
      return 'email';
    }
    if (lowerText.includes('research') || lowerText.includes('analyze')) {
      return 'research';
    }
    if (lowerText.includes('plan') || lowerText.includes('schedule')) {
      return 'planning';
    }
    if (lowerText.includes('report') || lowerText.includes('documentation')) {
      return 'report';
    }
    
    // Default to first task type of current industry or 'document'
    return this.currentIndustry.taskTypes[0] || 'document';
  }

  /**
   * 🔗 Find related task type based on keyword context
   */
  private findRelatedTaskType(text: string, keyword: string): string | null {
    // Industry-specific logic for task type mapping
    switch (this.currentIndustry.id) {
      case 'legal':
        if (keyword === 'legal' && text.includes('research')) return 'legal-research';
        if (keyword === 'court') return 'motion';
        if (keyword === 'contract') return 'contract';
        break;
      case 'medical':
        if (keyword === 'patient') return 'patient-report';
        if (keyword === 'treatment') return 'treatment-plan';
        if (keyword === 'medical' && text.includes('research')) return 'medical-research';
        break;
      case 'business':
        if (keyword === 'strategy') return 'strategy';
        if (keyword === 'proposal') return 'proposal';
        if (keyword === 'analysis') return 'analysis';
        break;
      case 'technology':
        if (keyword === 'code') return 'code-review';
        if (keyword === 'system') return 'architecture';
        if (keyword === 'documentation') return 'documentation';
        break;
    }
    
    return null;
  }

  /**
   * ⚡ Determine task priority using industry-aware keywords
   */
  private determinePriority(text: string, originalInput: string): DetectedTask['priority'] {
    const lowerText = text.toLowerCase();
    const lowerOriginal = originalInput.toLowerCase();
    const combinedText = `${lowerText} ${lowerOriginal}`;
    
    // Check industry-specific priority keywords
    const priorities = this.currentIndustry.priorityKeywords;
    
    if (priorities.urgent.some(keyword => combinedText.includes(keyword))) {
      return 'urgent';
    }
    
    if (priorities.high.some(keyword => combinedText.includes(keyword))) {
      return 'high';
    }
    
    if (priorities.low.some(keyword => combinedText.includes(keyword))) {
      return 'low';
    }
    
    // Default to medium if no specific priority indicators found
    return 'medium';
  }

  /**
   * ⏱️ Estimate time for task completion using industry context
   */
  private estimateTime(text: string): number {
    const lowerText = text.toLowerCase();
    const taskType = this.determineTaskType(text);
    
    // Get base time from industry profile
    let baseTime = this.currentIndustry.estimatedTimes[taskType] || this.currentIndustry.estimatedTimes.default || 60;
    
    // Adjust for complexity indicators
    const wordCount = text.split(' ').length;
    if (wordCount > 20) baseTime += Math.floor(baseTime * 0.25); // +25%
    if (wordCount > 50) baseTime += Math.floor(baseTime * 0.5);  // +50%
    
    // Adjust for complexity keywords
    const complexityKeywords = ['complex', 'detailed', 'comprehensive', 'thorough', 'extensive'];
    if (complexityKeywords.some(keyword => lowerText.includes(keyword))) {
      baseTime += Math.floor(baseTime * 0.5); // +50% for complexity
    }
    
    return baseTime;
  }

  /**
   * 🧹 Clean task text
   */
  private cleanTaskText(text: string): string {
    return text
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/^[-•*]\s*/, '') // Remove bullet points
      .replace(/^(create|make|write|draft|prepare|develop|build|design|plan|research|analyze)\s+/i, '') // Remove action words
      .replace(/^(need to|should|must|have to|want to)\s+/i, '') // Remove modal verbs
      .replace(/^please\s+/i, '') // Remove "please"
      .trim()
      .charAt(0).toUpperCase() + text.slice(1); // Capitalize first letter
  }

  /**
   * 📋 Generate task title from text
   */
  private generateTaskTitle(text: string): string {
    const cleanText = this.cleanTaskText(text);
    
    // Limit to reasonable title length
    if (cleanText.length <= 50) {
      return cleanText;
    }
    
    // Extract first meaningful phrase
    const words = cleanText.split(' ');
    let title = '';
    for (const word of words) {
      if ((title + ' ' + word).length <= 50) {
        title += (title ? ' ' : '') + word;
      } else {
        break;
      }
    }
    
    return title || cleanText.substring(0, 47) + '...';
  }

  /**
   * 🔍 Check if task is duplicate (Enhanced semantic similarity detection)
   */
  private isTaskDuplicate(existingTasks: DetectedTask[], newTaskText: string): boolean {
    const normalizedNew = newTaskText.toLowerCase().replace(/[^\w\s]/g, '');
    
    return existingTasks.some(task => {
      const normalizedExisting = task.description.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Enhanced similarity checking
      const similarity = this.stringSimilarity(normalizedNew, normalizedExisting);
      const shareKeywords = this.sharesMajorKeywords(normalizedNew, normalizedExisting);
      const isSubset = this.isTaskSubset(normalizedNew, normalizedExisting);
      
      // More aggressive duplicate detection for better deduplication
      const isDuplicate = similarity > 0.65 || shareKeywords || isSubset;
      
      if (isDuplicate) {
        console.log('🚫 DUPLICATE DETECTED:', { 
          new: newTaskText, 
          existing: task.description,
          similarity,
          shareKeywords,
          isSubset
        });
      }
      
      return isDuplicate;
    });
  }

  /**
   * 🔍 Check if tasks share major keywords (for semantic similarity)
   */
  private sharesMajorKeywords(text1: string, text2: string): boolean {
    const keywords1 = this.extractMajorKeywords(text1);
    const keywords2 = this.extractMajorKeywords(text2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return false;
    
    // Check if they share 70% or more of major keywords
    const shared = keywords1.filter(k => keywords2.includes(k));
    const maxKeywords = Math.max(keywords1.length, keywords2.length);
    
    return shared.length / maxKeywords >= 0.7;
  }

  /**
   * 🔍 Extract major keywords from task text
   */
  private extractMajorKeywords(text: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.includes(word.toLowerCase())
    );
    
    // Return unique words longer than 3 characters
    return [...new Set(words.filter(w => w.length > 3))];
  }

  /**
   * 🔍 Check if one task is a subset of another
   */
  private isTaskSubset(text1: string, text2: string): boolean {
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);
    
    // If one is much shorter, check if all its words are in the longer one
    if (words1.length < words2.length) {
      return words1.every(word => words2.some(w => w.includes(word) || word.includes(w)));
    } else if (words2.length < words1.length) {
      return words2.every(word => words1.some(w => w.includes(word) || word.includes(w)));
    }
    
    return false;
  }

  /**
   * 📊 Calculate string similarity
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 📏 Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 🔧 Remove duplicate tasks (Enhanced with semantic analysis)
   */
  private removeDuplicateTasks(tasks: DetectedTask[]): DetectedTask[] {
    const unique: DetectedTask[] = [];
    
    for (const task of tasks) {
      // Use the enhanced duplicate detection logic
      if (!this.isTaskDuplicate(unique, task.description)) {
        unique.push(task);
      } else {
        console.log('🚫 REMOVED DUPLICATE:', task.title, 'was duplicate of existing task');
      }
    }
    
    console.log(`🔧 DEDUPLICATION: ${tasks.length} → ${unique.length} tasks (removed ${tasks.length - unique.length} duplicates)`);
    return unique;
  }

  /**
   * 🧠 Semantic task detection for complex inputs
   */
  private async semanticTaskDetection(userInput: string): Promise<DetectedTask[]> {
    // Fallback semantic analysis
    const tasks: DetectedTask[] = [];
    
    // Look for complex sentence structures
    const sentences = userInput.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      if (this.containsTaskIntent(sentence)) {
        const task = this.createTaskFromText(sentence.trim(), userInput);
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * 🎯 Check if sentence contains task intent
   */
  private containsTaskIntent(sentence: string): boolean {
    const taskIndicators = [
      'need', 'want', 'should', 'must', 'have to', 'going to',
      'create', 'make', 'write', 'prepare', 'develop', 'build',
      'send', 'draft', 'plan', 'organize', 'schedule', 'research'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return taskIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  /**
   * ✨ Enhance tasks with AI analysis
   */
  private async enhanceTasksWithAI(tasks: DetectedTask[], originalInput: string): Promise<DetectedTask[]> {
    // Add dependencies, better estimates, etc.
    for (const task of tasks) {
      // Set suggested deadline based on priority
      if (task.priority === 'urgent') {
        task.suggestedDeadline = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 hours
      } else if (task.priority === 'high') {
        task.suggestedDeadline = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 1 day
      } else if (task.priority === 'medium') {
        task.suggestedDeadline = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)); // 3 days
      } else {
        task.suggestedDeadline = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 1 week
      }
    }
    
    return tasks;
  }

  /**
   * 🏷️ Generate session title
   */
  private generateSessionTitle(tasks: DetectedTask[]): string {
    if (tasks.length === 1) {
      return tasks[0].title;
    }
    
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `Multi-Task Session (${tasks.length} tasks) - ${timestamp}`;
  }

  /**
   * 📊 Get session progress
   */
  getSessionProgress(sessionId: string): { completed: number; total: number; percentage: number } {
    const session = this.activeSessions.get(sessionId);
    if (!session) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = session.tasks.filter(t => t.status === 'completed').length;
    const total = session.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }

  /**
   * ✅ Mark task as completed
   */
  markTaskCompleted(sessionId: string, taskId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const task = session.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      session.completedTasks = session.tasks.filter(t => t.status === 'completed').length;
    }
  }

  /**
   * 📋 Get active sessions
   */
  getActiveSessions(): MultiCanvasSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * 🏭 Add custom industry profile
   */
  addIndustryProfile(profile: IndustryProfile): void {
    this.industryProfiles.set(profile.id, profile);
    console.log(`🏭 INDUSTRY: Added custom profile for ${profile.name}`);
  }

  /**
   * 📊 Get current industry info
   */
  getCurrentIndustry(): IndustryProfile {
    return this.currentIndustry;
  }

  /**
   * 📈 Get industry statistics
   */
  getIndustryStats(): { totalIndustries: number; currentIndustry: string; taskTypes: number } {
    return {
      totalIndustries: this.industryProfiles.size,
      currentIndustry: this.currentIndustry.name,
      taskTypes: this.currentIndustry.taskTypes.length
    };
  }

  /**
   * 🗑️ Clean up completed sessions
   */
  cleanupCompletedSessions(): void {
    for (const [sessionId, session] of Array.from(this.activeSessions)) {
      if (session.completedTasks === session.totalTasks) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * 📄 Generate content template for a task (Enhanced with Knowledge Base Learning)
   */
  generateTemplate(task: DetectedTask, userInput?: string): string {
    console.log(`📄 TEMPLATE: Generating enhanced template for ${task.type}...`);
    
    const industry = this.currentIndustry;
    let template = industry.templates[task.type] || industry.templates.default || this.getDefaultTemplate(task.type);
    
    // 🧠 ENHANCE WITH KNOWLEDGE BASE LEARNING
    if (userInput) {
      template = this.enhanceWithKnowledge(template, userInput, task.type);
    }
    
    // Replace template variables with task-specific content
    const enhancedTemplate = template
      .replace(/{title}/g, task.title)
      .replace(/{description}/g, task.description)
      .replace(/{priority}/g, task.priority)
      .replace(/{industry}/g, industry.name)
      .replace(/{type}/g, task.type)
      .replace(/{estimatedTime}/g, task.estimatedTime.toString())
      .replace(/{date}/g, new Date().toLocaleDateString())
      .replace(/{timestamp}/g, new Date().toLocaleString());

    console.log(`📄 TEMPLATE: Enhanced template generated (${enhancedTemplate.length} chars)`);
    return enhancedTemplate;
  }

  /**
   * 📋 Get default template for any task type
   */
  private getDefaultTemplate(taskType: string): string {
    return `# {title}

## ${taskType.charAt(0).toUpperCase() + taskType.slice(1)} Details
**Type:** {type}
**Priority:** {priority}
**Industry:** {industry}
**Estimated Time:** {estimatedTime} minutes
**Date:** {date}

## Description
{description}

## Content
[Content will be developed here based on user requirements...]

## Next Steps
- [ ] Review and refine content
- [ ] Add specific details
- [ ] Finalize document

---
*Generated by Multi-Canvas System - {timestamp}*`;
  }

  /**
   * ⏱️ Estimate completion time for multiple tasks
   */
  estimateTotalTime(tasks: DetectedTask[]): number {
    return tasks.reduce((total, task) => total + task.estimatedTime, 0);
  }

  /**
   * � SCHMIDT FIX: Determine document type from section content
   */
  private determineDocumentType(title: string, content: string): string {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('opening') || titleLower.includes('strategy')) return 'legal_case_plan';
    if (titleLower.includes('medical') || titleLower.includes('evidence')) return 'medical_documentation';
    if (titleLower.includes('communication') || titleLower.includes('settlement')) return 'legal_correspondence';
    if (contentLower.includes('petition') || contentLower.includes('motion')) return 'legal_petition';
    if (contentLower.includes('letter') || contentLower.includes('correspondence')) return 'letter';
    
    return 'legal_document';
  }
  
  /**
   * 🔧 SCHMIDT FIX: Determine agent type from section content
   */
  private determineAgentType(title: string, content: string): AgentType {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('medical') || contentLower.includes('medical') || 
        contentLower.includes('doctor') || contentLower.includes('treatment')) {
      return AgentType.MEDICAL_AGENT;
    }
    
    if (titleLower.includes('legal') || titleLower.includes('case') || 
        titleLower.includes('petition') || titleLower.includes('strategy') ||
        contentLower.includes('legal') || contentLower.includes('workers') ||
        contentLower.includes('compensation')) {
      return AgentType.LEGAL_AGENT;
    }
    
    if (titleLower.includes('email') || titleLower.includes('communication') ||
        contentLower.includes('email') || contentLower.includes('correspondence')) {
      return AgentType.EMAIL_AGENT;
    }
    
    return AgentType.LEGAL_AGENT; // Default for workers comp cases
  }

  /**
   * �📊 Group tasks by priority
   */
  groupTasksByPriority(tasks: DetectedTask[]): Record<string, DetectedTask[]> {
    return tasks.reduce((groups, task) => {
      const priority = task.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(task);
      return groups;
    }, {} as Record<string, DetectedTask[]>);
  }

  /**
   * 🎨 Get recommended canvas layout based on tasks
   */
  getRecommendedLayout(tasks: DetectedTask[]): 'single' | 'multi' | 'grid' {
    if (tasks.length <= 1) return 'single';
    if (tasks.length <= 3) return 'multi';
    return 'grid';
  }

  // 🚀 PUBLIC API METHODS

  /**
   * 📝 Enhance task description with knowledge base insights
   */
  private enhanceTaskDescription(description: string, knowledgeBaseSamples: KnowledgeBaseSample[]): string {
    if (knowledgeBaseSamples.length === 0) return description;
    
    // Use the highest quality sample to enhance description
    const bestSample = knowledgeBaseSamples
      .sort((a, b) => b.quality - a.quality)[0];
    
    // Add insights from knowledge base
    const enhancement = `\n\n[AI Enhancement from knowledge base: ${bestSample.documentType} patterns applied]`;
    
    return description + enhancement;
  }
}

// Export singleton instance
export const multiCanvasOrchestrator = MultiCanvasTaskOrchestrator.getInstance();
