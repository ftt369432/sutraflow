import { useState, useCallback } from 'react';

interface StrategicFramework {
  mainObjective: string;
  keyStrategies: string[];
  priorities: string[];
  dependencies: string[];
  risks: string[];
  timeline: string[];
}

interface OrganizedInformation {
  categories: Record<string, any[]>;
  relationships: any[];
  priorities: any[];
  insights: string[];
}

interface StrategicPriorities {
  high: any[];
  medium: any[];
  low: any[];
  urgent: any[];
}

export const useStrategicOrganizer = () => {
  const [currentFramework, setCurrentFramework] = useState<StrategicFramework | null>(null);
  const [organizedData, setOrganizedData] = useState<OrganizedInformation | null>(null);

  const organizeInformation = useCallback((data: any[], context?: string) => {
    try {
      // Categorize information
      const categories: Record<string, any[]> = {
        facts: [],
        opinions: [],
        actions: [],
        goals: [],
        resources: [],
        constraints: []
      };

      // Simple categorization logic
      data.forEach(item => {
        const content = typeof item === 'string' ? item : item.content || '';
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('fact') || lowerContent.includes('data') || lowerContent.includes('research')) {
          categories.facts.push(item);
        } else if (lowerContent.includes('think') || lowerContent.includes('believe') || lowerContent.includes('opinion')) {
          categories.opinions.push(item);
        } else if (lowerContent.includes('action') || lowerContent.includes('do') || lowerContent.includes('implement')) {
          categories.actions.push(item);
        } else if (lowerContent.includes('goal') || lowerContent.includes('objective') || lowerContent.includes('target')) {
          categories.goals.push(item);
        } else if (lowerContent.includes('resource') || lowerContent.includes('tool') || lowerContent.includes('asset')) {
          categories.resources.push(item);
        } else if (lowerContent.includes('constraint') || lowerContent.includes('limit') || lowerContent.includes('challenge')) {
          categories.constraints.push(item);
        } else {
          categories.facts.push(item); // Default category
        }
      });

      // Find relationships
      const relationships: any[] = [];
      const priorities: any[] = [];
      const insights: string[] = [];

      // Generate insights based on organized data
      Object.entries(categories).forEach(([category, items]) => {
        if (items.length > 0) {
          insights.push(`${category}: ${items.length} items identified`);
        }
      });

      const organized = {
        categories,
        relationships,
        priorities,
        insights
      };

      setOrganizedData(organized);
      return organized;
    } catch (error) {
      console.error('Error organizing information:', error);
      return {
        categories: {},
        relationships: [],
        priorities: [],
        insights: ['Error organizing information']
      };
    }
  }, []);

  const prioritizeStrategically = useCallback((items: any[], criteria?: string[]) => {
    try {
      const priorities: StrategicPriorities = {
        high: [],
        medium: [],
        low: [],
        urgent: []
      };

      items.forEach(item => {
        const content = typeof item === 'string' ? item : item.content || '';
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('urgent') || lowerContent.includes('critical') || lowerContent.includes('immediate')) {
          priorities.urgent.push(item);
        } else if (lowerContent.includes('important') || lowerContent.includes('high') || lowerContent.includes('priority')) {
          priorities.high.push(item);
        } else if (lowerContent.includes('medium') || lowerContent.includes('moderate')) {
          priorities.medium.push(item);
        } else {
          priorities.low.push(item);
        }
      });

      return priorities;
    } catch (error) {
      console.error('Error prioritizing strategically:', error);
      return {
        high: [],
        medium: [],
        low: [],
        urgent: []
      };
    }
  }, []);

  const createStrategicFramework = useCallback((objective: string, context?: any) => {
    try {
      const framework: StrategicFramework = {
        mainObjective: objective,
        keyStrategies: [
          'Analyze current situation',
          'Identify key resources',
          'Develop action plan',
          'Monitor progress'
        ],
        priorities: [
          'High: Critical objectives',
          'Medium: Supporting goals',
          'Low: Nice-to-have features'
        ],
        dependencies: [
          'Resource availability',
          'Timeline constraints',
          'Stakeholder alignment'
        ],
        risks: [
          'Resource limitations',
          'Timeline pressure',
          'Technical challenges'
        ],
        timeline: [
          'Phase 1: Planning and preparation',
          'Phase 2: Implementation',
          'Phase 3: Review and optimization'
        ]
      };

      setCurrentFramework(framework);
      return framework;
    } catch (error) {
      console.error('Error creating strategic framework:', error);
      return {
        mainObjective: objective,
        keyStrategies: [],
        priorities: [],
        dependencies: [],
        risks: [],
        timeline: []
      };
    }
  }, []);

  // Utility functions that were missing
  const calculateConfidence = useCallback((data: any[], criteria?: string[]) => {
    try {
      if (!data || data.length === 0) return 0;
      
      // Simple confidence calculation based on data completeness
      const completenessScore = data.filter(item => 
        item && (typeof item === 'string' ? item.trim().length > 0 : item.content?.trim().length > 0)
      ).length / data.length;
      
      return Math.round(completenessScore * 100);
    } catch (error) {
      console.error('Error calculating confidence:', error);
      return 0;
    }
  }, []);

  const identifyKnowledgeGaps = useCallback((currentKnowledge: any[], requiredKnowledge: any[]) => {
    try {
      const gaps: string[] = [];
      
      requiredKnowledge.forEach(requirement => {
        const reqContent = typeof requirement === 'string' ? requirement : requirement.content || '';
        const hasKnowledge = currentKnowledge.some(knowledge => {
          const knowContent = typeof knowledge === 'string' ? knowledge : knowledge.content || '';
          return knowContent.toLowerCase().includes(reqContent.toLowerCase());
        });
        
        if (!hasKnowledge) {
          gaps.push(reqContent);
        }
      });
      
      return gaps;
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      return [];
    }
  }, []);

  const generateActionPlan = useCallback((framework: StrategicFramework) => {
    try {
      const actionPlan = {
        immediate: framework.keyStrategies.slice(0, 2),
        shortTerm: framework.keyStrategies.slice(2, 4),
        longTerm: framework.timeline,
        resources: framework.dependencies,
        riskMitigation: framework.risks.map(risk => `Mitigate: ${risk}`)
      };
      
      return actionPlan;
    } catch (error) {
      console.error('Error generating action plan:', error);
      return {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        resources: [],
        riskMitigation: []
      };
    }
  }, []);

  return {
    organizeInformation,
    prioritizeStrategically,
    createStrategicFramework,
    calculateConfidence,
    identifyKnowledgeGaps,
    generateActionPlan,
    currentFramework,
    organizedData
  };
};
