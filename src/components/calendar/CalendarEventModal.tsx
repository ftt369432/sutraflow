import React, { useState, useEffect } from 'react';
import { useCalendarStore, CalendarEvent } from '../../store/calendarStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Calendar } from '../ui/Calendar';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Calendar as CalendarIcon, Clock, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  onSave?: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
}

export function CalendarEventModal({ 
  isOpen, 
  onClose, 
  event, 
  onSave,
  onDelete
}: CalendarEventModalProps) {
  const { 
    sources, 
    addEvent, 
    updateEvent, 
    deleteEvent,
    completeEvent,
    tags: allTags,
    addTag
  } = useCalendarStore();
  
  const { tasks } = useTaskStore();
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    sourceId: 'primary',
    location: '',
    tags: [] as string[],
    taskId: undefined as string | undefined,
    automationId: undefined as string | undefined,
    timeBlockId: undefined as string | undefined,
    completed: false
  });
  
  const [newTag, setNewTag] = useState('');
  
  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id || '',
        title: event.title || '',
        description: event.description || '',
        start: event.start || new Date(),
        end: event.end || new Date(),
        allDay: event.allDay || false,
        sourceId: event.sourceId || 'primary',
        location: event.location || '',
        tags: event.tags || [],
        taskId: event.taskId,
        automationId: event.automationId,
        timeBlockId: event.timeBlockId,
        completed: event.completed || false
      });
    }
  }, [event]);
  
  const isNewEvent = !formData.id;
  
  const handleSave = () => {
    const eventData = {
      ...formData,
      tags: formData.tags || []
    };
    
    if (isNewEvent) {
      addEvent(eventData);
    } else {
      updateEvent(formData.id, eventData);
    }
    
    onClose();
  };
  
  const handleDelete = () => {
    if (formData.id && confirm('Are you sure you want to delete this event?')) {
      deleteEvent(formData.id);
      onClose();
    }
  };
  
  const handleComplete = () => {
    if (formData.id) {
      completeEvent(formData.id);
      onClose();
    }
  };
  
  const handleAddTag = () => {
    if (newTag.trim()) {
      // Check if tag already exists
      const existingTag = allTags.find(t => t.name.toLowerCase() === newTag.toLowerCase());
      
      let tagId;
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create new tag
        tagId = addTag({
          name: newTag,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        });
      }
      
      setFormData({
        ...formData,
        tags: [...formData.tags, tagId]
      });
      
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagId: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(id => id !== tagId)
    });
  };
  
  const getSourceName = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : 'Unknown';
  };
  
  const getTagName = (tagId: string) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag ? tag.name : tagId;
  };
  
  const getTagColor = (tagId: string) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag ? tag.color : '#888888';
  };
  
  const isTaskEvent = !!formData.taskId;
  const isTimeBlockEvent = !!formData.timeBlockId;
  const isAutomationEvent = !!formData.automationId;
  
  // Determine if this is a special event type that shouldn't be fully editable
  const isSpecialEvent = isTaskEvent || isTimeBlockEvent || isAutomationEvent;
  
  const linkedTask = formData.taskId ? tasks.find(t => t.id === formData.taskId) : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>
            {event?.id 
              ? 'Update the details of your event.' 
              : 'Add a new event to your calendar.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Event Title
            </Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Event Type
            </Label>
            <Select value={formData.sourceId} onValueChange={(value) => setFormData({ ...formData, sourceId: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a calendar" />
              </SelectTrigger>
              <SelectContent>
                {sources
                  .filter(source => source.type === 'primary' || source.type === 'secondary')
                  .map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: source.color }} 
                        />
                        {source.name}
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Start
            </Label>
            <div className="col-span-3 flex space-x-2">
              <Input
                type="date"
                value={format(formData.start, "yyyy-MM-dd")}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setFormData({ ...formData, start: newDate });
                }}
                className="w-1/2"
              />
              <Input
                type="time"
                value={format(formData.start, "HH:mm")}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  const newDate = new Date(formData.start);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  setFormData({ ...formData, start: newDate });
                }}
                className="w-1/2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              End
            </Label>
            <div className="col-span-3 flex space-x-2">
              <Input
                type="date"
                value={format(formData.end, "yyyy-MM-dd")}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setFormData({ ...formData, end: newDate });
                }}
                className="w-1/2"
              />
              <Input
                type="time"
                value={format(formData.end, "HH:mm")}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  const newDate = new Date(formData.end);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  setFormData({ ...formData, end: newDate });
                }}
                className="w-1/2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              placeholder="Add location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div>
            {event?.id && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSave}>
              {event?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}