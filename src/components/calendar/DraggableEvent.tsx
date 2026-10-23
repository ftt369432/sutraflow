import React from 'react';
import { useDrag } from 'react-dnd';
import { Event } from '../../types/calendar';
import { format } from 'date-fns';

interface DraggableEventProps {
  event: Event;
  onEventMove: (event: Event, newStartTime: Date) => void;
}

export function DraggableEvent({ event, onEventMove }: DraggableEventProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EVENT',
    item: { event },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`event-item ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: 'move' }}
    >
      <span className="event-time">
        {format(event.startTime, 'HH:mm')}
      </span>
      <span className="event-title">{event.title}</span>
    </div>
  );
} 