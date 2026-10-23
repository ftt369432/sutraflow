import type { CalendarEvent, Task } from '../../types';
import { addHours, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { openai } from '../../config/openai';

interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ScheduleSuggestion {
  task: Task;
  suggestedSlot: TimeSlot;
  confidence: number;
}

export async function findOptimalTimeSlots(
  tasks: Task[],
  existingEvents: CalendarEvent[],
  date: Date = new Date()
): Promise<ScheduleSuggestion[]> {
  try {
    const prompt = `Help optimize the schedule for the following tasks and existing calendar events.

Tasks:
${tasks.map(task => `- ${task.title} (Priority: ${task.priority}${task.dueDate ? `, Due: ${format(task.dueDate, 'yyyy-MM-dd')}` : ''})`).join('\n')}

Existing Calendar Events:
${existingEvents.map(event => `- ${event.title}: ${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`).join('\n')}

Suggest optimal time slots for the tasks. Consider task priority and existing commitments.
Respond in the following JSON format:
{
  "suggestions": [
    {
      "taskId": "task id",
      "suggestedSlot": {
        "start": "ISO datetime",
        "end": "ISO datetime"
      },
      "confidence": 0.8
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    // Transform the response into our ScheduleSuggestion format
    return response.suggestions.map((suggestion: any) => ({
      task: tasks.find(t => t.id === suggestion.taskId)!,
      suggestedSlot: {
        start: new Date(suggestion.suggestedSlot.start),
        end: new Date(suggestion.suggestedSlot.end)
      },
      confidence: suggestion.confidence
    }));
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    // Fallback to basic scheduling if AI fails
    return findOptimalTimeSlotsBasic(tasks, existingEvents, date);
  }
}

// Fallback function using basic scheduling logic
function findOptimalTimeSlotsBasic(
  tasks: Task[],
  existingEvents: CalendarEvent[],
  date: Date
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = [];
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const busySlots = existingEvents.map(event => ({
    start: event.startDate,
    end: event.endDate,
  }));

  const freeSlots: TimeSlot[] = [];
  let currentTime = dayStart;

  while (currentTime < dayEnd) {
    const slotEnd = addHours(currentTime, 1);
    const isSlotBusy = busySlots.some(busy =>
      isWithinInterval(currentTime, { start: busy.start, end: busy.end }) ||
      isWithinInterval(slotEnd, { start: busy.start, end: busy.end })
    );

    if (!isSlotBusy) {
      freeSlots.push({
        start: currentTime,
        end: slotEnd,
      });
    }

    currentTime = slotEnd;
  }

  const uncompletedTasks = tasks.filter(task => task.status !== 'completed');
  
  uncompletedTasks.forEach(task => {
    const bestSlot = freeSlots[0];
    if (bestSlot) {
      suggestions.push({
        task,
        suggestedSlot: bestSlot,
        confidence: 0.8
      });
      freeSlots.shift();
    }
  });

  return suggestions;
}