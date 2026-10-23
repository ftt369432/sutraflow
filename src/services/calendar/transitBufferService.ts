import { addMinutes, subMinutes, isSameDay } from 'date-fns';
import { CalendarEvent } from './EmailEventAnalyzer';

export interface TransitBuffer {
  durationMinutes: number;
  origin: string;
  destination: string;
  notes?: string;
}

// Coordinate database for California WCAB districts and major medical offices
const CALIFORNIA_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'oakland': { lat: 37.8044, lng: -122.2712 },
  'sacramento': { lat: 38.5816, lng: -121.4944 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'san jose': { lat: 37.3382, lng: -121.8863 },
  'fresno': { lat: 36.7378, lng: -119.7871 },
  'santa ana': { lat: 33.7455, lng: -117.8677 },
  'van nuys': { lat: 34.1871, lng: -118.4514 },
  'long beach': { lat: 33.7701, lng: -118.1937 },
  'riverside': { lat: 33.9533, lng: -117.3962 },
  'san bernardino': { lat: 34.1083, lng: -117.2898 },
  'redding': { lat: 40.5865, lng: -122.3917 },
  'stockton': { lat: 37.9577, lng: -121.2908 },
  'bakersfield': { lat: 35.3733, lng: -119.0187 },
  'pomona': { lat: 34.0552, lng: -117.7523 },
  'oxnard': { lat: 34.1975, lng: -119.1770 },
  'santa rosa': { lat: 38.4404, lng: -122.7141 },
  'marina del rey': { lat: 33.9803, lng: -118.4517 },
  'pasadena': { lat: 34.1478, lng: -118.1445 }
};

export class TransitBufferService {
  private defaultOrigin: string;

  constructor(defaultOrigin: string = 'Los Angeles') {
    this.defaultOrigin = defaultOrigin.toLowerCase();
  }

  /**
   * Calculate travel time between two physical addresses/locations.
   * If they are in California, we use coordinates to estimate driving time.
   */
  public calculateTransitBuffer(origin: string, destination: string): TransitBuffer {
    const origKey = this.findMatchingLocationKey(origin) || this.defaultOrigin;
    const destKey = this.findMatchingLocationKey(destination);

    if (!destKey) {
      // Default fallback buffer if destination is not in our geolocation list
      return {
        durationMinutes: 45,
        origin,
        destination,
        notes: 'Estimated standard travel time buffer'
      };
    }

    const origCoords = CALIFORNIA_LOCATIONS[origKey];
    const destCoords = CALIFORNIA_LOCATIONS[destKey];

    // Haversine formula to compute great-circle distance
    const R = 3958.8; // Radius of Earth in miles
    const dLat = this.deg2rad(destCoords.lat - origCoords.lat);
    const dLng = this.deg2rad(destCoords.lng - origCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(origCoords.lat)) *
        Math.cos(this.deg2rad(destCoords.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMiles = R * c;

    // Estimate driving time: assume average speed of 45 mph in California + 15 mins buffer
    const drivingTimeMinutes = Math.round((distanceMiles / 45) * 60) + 15;

    // Bound travel time between 15 and 240 minutes
    const durationMinutes = Math.max(15, Math.min(240, drivingTimeMinutes));

    return {
      durationMinutes,
      origin: origKey.toUpperCase(),
      destination: destKey.toUpperCase(),
      notes: `Estimated distance: ${distanceMiles.toFixed(1)} miles. Speed average: 45 mph. Includes 15-minute traffic allowance.`
    };
  }

  /**
   * Generate proactive travel/preparation/deep work block events.
   */
  public generateProactiveEvents(
    baseEvent: CalendarEvent,
    existingEvents: CalendarEvent[]
  ): CalendarEvent[] {
    const proactiveEvents: CalendarEvent[] = [];

    // 1. Travel Time Buffer (if physical location and not online)
    if (this.isPhysicalLocation(baseEvent.location)) {
      const transit = this.calculateTransitBuffer(this.defaultOrigin, baseEvent.location);
      
      // Transit Event: Going to the event
      const startTransitStart = subMinutes(baseEvent.startDate, transit.durationMinutes);
      proactiveEvents.push({
        id: `transit-to-${baseEvent.id}`,
        title: `🚗 Transit to: ${baseEvent.title}`,
        description: `Travel time buffer from ${transit.origin} to ${transit.destination}.\n${transit.notes || ''}`,
        startDate: startTransitStart,
        endDate: baseEvent.startDate,
        location: `${transit.origin} -> ${transit.destination}`,
        attendees: baseEvent.attendees,
        eventType: 'transit',
        sourceEmail: baseEvent.sourceEmail,
        relatedTasks: [],
        reminders: [],
        metadata: { parentEventId: baseEvent.id, role: 'transit_to' }
      });

      // Transit Event: Returning from the event
      const endTransitEnd = addMinutes(baseEvent.endDate, transit.durationMinutes);
      proactiveEvents.push({
        id: `transit-from-${baseEvent.id}`,
        title: `🚗 Transit from: ${baseEvent.title}`,
        description: `Return travel time buffer back to ${transit.origin}.\n${transit.notes || ''}`,
        startDate: baseEvent.endDate,
        endDate: endTransitEnd,
        location: `${transit.destination} -> ${transit.origin}`,
        attendees: baseEvent.attendees,
        eventType: 'transit',
        sourceEmail: baseEvent.sourceEmail,
        relatedTasks: [],
        reminders: [],
        metadata: { parentEventId: baseEvent.id, role: 'transit_from' }
      });
    }

    // 2. Event-Specific Preparation Block (e.g., 60 mins before hearing/deposition/QME)
    const requiresPrep = ['qme', 'deposition', 'court-date'].includes(baseEvent.eventType?.toLowerCase() || '');
    if (requiresPrep) {
      // Schedule preparation block 1 hour before the start (or before transit if physical)
      const transitTo = proactiveEvents.find(e => e.metadata?.role === 'transit_to');
      const prepEndTime = transitTo ? transitTo.startDate : baseEvent.startDate;
      const prepStartTime = subMinutes(prepEndTime, 60);

      proactiveEvents.push({
        id: `prep-${baseEvent.id}`,
        title: `🧠 Preparation: ${baseEvent.title}`,
        description: `Dedicated preparation block for upcoming ${baseEvent.eventType}.\nReview file context, medical-legal requirements, and pleadings.`,
        startDate: prepStartTime,
        endDate: prepEndTime,
        location: 'Office/Remote',
        attendees: [],
        eventType: 'preparation',
        sourceEmail: baseEvent.sourceEmail,
        relatedTasks: [],
        reminders: [{
          id: `reminder-prep-${baseEvent.id}`,
          type: 'popup',
          timing: 'before',
          offset: 10,
          message: `Preparation block starting in 10 minutes for: ${baseEvent.title}`
        }],
        metadata: { parentEventId: baseEvent.id, role: 'prep' }
      });
    }

    // 3. Deep Work Preservation
    // If scheduling this event leaves less than 2 hours of free time in a day,
    // we proactively block a dedicated "Deep Work" slot in the morning or afternoon.
    const dayEvents = existingEvents.filter(e => isSameDay(e.startDate, baseEvent.startDate));
    const totalEventDuration = dayEvents.reduce((sum, e) => {
      const diff = e.endDate.getTime() - e.startDate.getTime();
      return sum + diff / (1000 * 60);
    }, 0);

    // If day is busy (e.g., >3 hours of meetings/transit) and there isn't already a deep work block
    const hasDeepWork = dayEvents.some(e => e.eventType === 'deep_work');
    if (totalEventDuration > 180 && !hasDeepWork) {
      // Find a suitable 2-hour window. Defaulting to 9:00 AM - 11:00 AM or 2:00 PM - 4:00 PM
      const isMorningEvent = baseEvent.startDate.getHours() < 13;
      const deepWorkDate = new Date(baseEvent.startDate);
      
      if (isMorningEvent) {
        // Schedule in the afternoon
        deepWorkDate.setHours(14, 0, 0, 0);
      } else {
        // Schedule in the morning
        deepWorkDate.setHours(9, 0, 0, 0);
      }

      proactiveEvents.push({
        id: `deepwork-${baseEvent.id}`,
        title: `🔒 Preserved Deep Work Block`,
        description: 'Proactively reserved focus block. Notifications muted to protect cognitive load.',
        startDate: deepWorkDate,
        endDate: addMinutes(deepWorkDate, 120),
        location: 'Focus Mode',
        attendees: [],
        eventType: 'deep_work',
        sourceEmail: baseEvent.sourceEmail,
        relatedTasks: [],
        reminders: [],
        metadata: { role: 'deep_work' }
      });
    }

    return proactiveEvents;
  }

  private isPhysicalLocation(location?: string): boolean {
    if (!location) return false;
    const lower = location.toLowerCase();
    const onlineIndicators = ['zoom', 'teams', 'meet.google', 'telephonic', 'virtual', 'video conference', 'online'];
    return !onlineIndicators.some(indicator => lower.includes(indicator));
  }

  private findMatchingLocationKey(locationString: string): string | null {
    const lower = locationString.toLowerCase();
    for (const key of Object.keys(CALIFORNIA_LOCATIONS)) {
      if (lower.includes(key)) {
        return key;
      }
    }
    return null;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
