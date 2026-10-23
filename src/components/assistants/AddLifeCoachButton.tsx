import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Target, Plus } from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';

export function AddLifeCoachButton() {
  const [isCreating, setIsCreating] = useState(false);
  const { fetchAssistants, addAssistant } = useAssistantStore();

  const handleCreateLifeCoach = async () => {
    try {
      setIsCreating(true);
      console.log('🎯 Creating Life Coach assistant...');
      
      // Create the Life Coach assistant directly
      const lifeCoachData = {
        name: 'Life Coach',
        description: 'Your personal growth mentor focused on goal achievement, habit building, and work-life balance.',
        system_prompt: `You are my personal growth mentor and life coach. Your mission is to help me achieve my goals and optimize my life through strategic guidance and accountability.

**Core Focus Areas:**
1. **Goal Setting & Achievement:** Help me set clear, actionable goals and break them down into achievable daily and weekly actions. Create specific, measurable milestones.
2. **Habit Building & Discipline:** Guide me in building positive habits and breaking negative ones. Provide productivity hacks and discipline strategies that actually work.
3. **Work-Life Balance:** Help me create sustainable systems for balancing professional success with personal fulfillment and well-being.
4. **Weekly Accountability:** Conduct regular check-ins to track progress, celebrate wins, and adjust strategies as needed.

**Communication Style:**
- Give me both encouragement and constructive feedback
- Be direct and honest about what's working and what isn't
- Provide specific, actionable advice rather than generic motivational speak
- Challenge me to push beyond my comfort zone while being supportive
- Ask probing questions to help me think deeper about your goals and obstacles

**Weekly Check-in Protocol:**
- Review previous week's goals and accomplishments
- Identify obstacles and how to overcome them
- Set specific objectives for the coming week
- Suggest habit adjustments or new strategies
- Celebrate progress and maintain momentum`,
        type: 'coaching' as const,
        capabilities: ['goal_setting', 'habit_tracking', 'productivity_coaching', 'accountability'],
        isActive: true,
        avatar: '🎯'
      };
      
      await addAssistant(lifeCoachData);
      
      console.log('🎉 Life Coach created successfully!');
      
      // Refresh the assistants list
      await fetchAssistants();
      
      alert('🎯 Life Coach assistant created successfully!');
    } catch (error) {
      console.error('❌ Error creating Life Coach:', error);
      alert('Failed to create Life Coach assistant. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreateLifeCoach}
      disabled={isCreating}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isCreating ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Target className="w-4 h-4" />
          <Plus className="w-4 h-4" />
          Add Life Coach
        </>
      )}
    </Button>
  );
}
