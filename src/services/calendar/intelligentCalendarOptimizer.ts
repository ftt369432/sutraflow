import { CalendarEvent } from './EmailEventAnalyzer';
import { addMinutes, isAfter, isBefore } from 'date-fns';

export interface ConflictResolutionOption {
  type: 'reschedule' | 'delegate' | 'shorten_buffer' | 'cancel';
  description: string;
  suggestedEventUpdates: Partial<CalendarEvent>;
  targetEventId: string;
}

export interface CalendarConflict {
  severity: 'low' | 'medium' | 'high' | 'critical';
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
  resolutionOptions: ConflictResolutionOption[];
}

export class IntelligentCalendarOptimizer {
  
  /**
   * Scan for conflicts in a set of events.
   */
  public detectConflicts(events: CalendarEvent[]): CalendarConflict[] {
    const conflicts: CalendarConflict[] = [];
    const sorted = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const eventA = sorted[i];
        const eventB = sorted[j];

        // If eventB starts before eventA ends, we have an overlap
        if (isBefore(eventB.startDate, eventA.endDate)) {
          const overlapStart = isAfter(eventB.startDate, eventA.startDate) ? eventB.startDate : eventA.startDate;
          const overlapEnd = isBefore(eventB.endDate, eventA.endDate) ? eventB.endDate : eventA.endDate;
          const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));

          if (overlapMinutes > 0) {
            conflicts.push(this.analyzeConflict(eventA, eventB, overlapMinutes));
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Assess the conflict severity and generate realistic resolution options.
   */
  private analyzeConflict(eventA: CalendarEvent, eventB: CalendarEvent, overlapMinutes: number): CalendarConflict {
    const typeA = eventA.eventType?.toLowerCase() || '';
    const typeB = eventB.eventType?.toLowerCase() || '';
    
    // Critical events: hearings (court-date), depositions, medical exams (qme)
    const isCriticalA = ['court-date', 'deposition', 'qme'].includes(typeA);
    const isCriticalB = ['court-date', 'deposition', 'qme'].includes(typeB);

    let severity: CalendarConflict['severity'] = 'low';

    if (isCriticalA && isCriticalB) {
      severity = 'critical'; // Double booking of hearings/depositions is critical!
    } else if (isCriticalA || isCriticalB) {
      severity = 'high'; // One hearing/deposition/QME overlaps with another meeting or travel
    } else if (typeA === 'transit' || typeB === 'transit' || typeA === 'preparation' || typeB === 'preparation') {
      severity = 'low'; // Overlap with travel or preparation buffers is low priority
    } else {
      severity = 'medium'; // Standard meetings overlap
    }

    const resolutionOptions: ConflictResolutionOption[] = [];

    // Option 1: Reschedule Event B (standard recommendation)
    if (!isCriticalB) {
      const shiftMinutes = Math.round((eventA.endDate.getTime() - eventB.startDate.getTime()) / (1000 * 60));
      resolutionOptions.push({
        type: 'reschedule',
        description: `Delay "${eventB.title}" by ${shiftMinutes} minutes to start after "${eventA.title}".`,
        targetEventId: eventB.id,
        suggestedEventUpdates: {
          startDate: eventA.endDate,
          endDate: addMinutes(eventB.endDate, shiftMinutes)
        }
      });
    }

    // Option 2: Shorten transit/preparation buffer
    if (typeA === 'transit' || typeA === 'preparation') {
      const newDuration = Math.max(15, (eventA.endDate.getTime() - eventA.startDate.getTime()) / (1000 * 60) - overlapMinutes);
      resolutionOptions.push({
        type: 'shorten_buffer',
        description: `Reduce "${eventA.title}" duration by ${overlapMinutes} minutes.`,
        targetEventId: eventA.id,
        suggestedEventUpdates: {
          startDate: addMinutes(eventA.startDate, overlapMinutes)
        }
      });
    } else if (typeB === 'transit' || typeB === 'preparation') {
      const newDuration = Math.max(15, (eventB.endDate.getTime() - eventB.startDate.getTime()) / (1000 * 60) - overlapMinutes);
      resolutionOptions.push({
        type: 'shorten_buffer',
        description: `Reduce "${eventB.title}" duration by ${overlapMinutes} minutes.`,
        targetEventId: eventB.id,
        suggestedEventUpdates: {
          endDate: subMinutes(eventB.endDate, overlapMinutes)
        }
      });
    }

    // Option 3: Delegation (Shield Identity)
    if (isCriticalA || isCriticalB) {
      const delegatableEvent = isCriticalB ? eventB : eventA;
      resolutionOptions.push({
        type: 'delegate',
        description: `Delegate "${delegatableEvent.title}" to a team associate (Sovereign Teams integration).`,
        targetEventId: delegatableEvent.id,
        suggestedEventUpdates: {
          attendees: [...(delegatableEvent.attendees || []), 'associate@genieflow.com'],
          description: `${delegatableEvent.description || ''}\n\n⚠️ DELEGATION TASK CREATED: Assigned to Team Associate.`
        }
      });
    }

    return {
      severity,
      eventA,
      eventB,
      overlapMinutes,
      resolutionOptions
    };
  }

  /**
   * Auto-resolve low-severity conflicts (e.g. overlapping transit/prep)
   */
  public autoResolveConflicts(
    events: CalendarEvent[],
    conflicts: CalendarConflict[]
  ): { resolvedEvents: CalendarEvent[]; changesApplied: string[] } {
    const resolvedEvents = [...events];
    const changesApplied: string[] = [];

    for (const conflict of conflicts) {
      if (conflict.severity === 'low') {
        const option = conflict.resolutionOptions.find(opt => opt.type === 'shorten_buffer');
        if (option) {
          const index = resolvedEvents.findIndex(e => e.id === option.targetEventId);
          if (index !== -1) {
            resolvedEvents[index] = {
              ...resolvedEvents[index],
              ...option.suggestedEventUpdates
            };
            changesApplied.push(`Auto-resolved low-priority overlap: ${option.description}`);
          }
        }
      }
    }

    return { resolvedEvents, changesApplied };
  }
}

function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}
