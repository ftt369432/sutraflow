import { create } from 'zustand';
import { Capability } from '../types/capabilities';

// In a real application, capabilities might be fetched from a backend
// or registered dynamically by different modules.
const initialCapabilities: Capability[] = []; // Start with an empty registry

export interface CapabilityRegistryState {
  capabilities: Capability[];
  getCapabilityById: (id: string) => Capability | undefined;
  getCapabilitiesByCategory: (category: string) => Capability[];
  registerCapability: (capability: Capability) => void;
  unregisterCapability: (capabilityId: string) => void;
  // TODO: Add more functions as needed, e.g., for updating capabilities
}

export const useCapabilityRegistryStore = create<CapabilityRegistryState>((set, get) => ({
  capabilities: initialCapabilities,

  getCapabilityById: (id: string) => {
    return get().capabilities.find(cap => cap.id === id);
  },

  getCapabilitiesByCategory: (category: string) => {
    return get().capabilities.filter(cap => cap.category === category);
  },

  registerCapability: (capability: Capability) => {
    // Prevent duplicate IDs
    if (get().capabilities.some(cap => cap.id === capability.id)) {
      console.warn(`Capability with ID "${capability.id}" already registered.`);
      return;
    }
    set(state => ({
      capabilities: [...state.capabilities, capability],
    }));
  },

  unregisterCapability: (capabilityId: string) => {
    set(state => ({
      capabilities: state.capabilities.filter(cap => cap.id !== capabilityId),
    }));
  },
}));

// Example of how a capability might be defined and registered (for testing):
/*
const exampleCalendarCapability: Capability = {
  id: 'calendar-create-event',
  name: 'Create Calendar Event',
  description: 'Creates a new event in the user\'s calendar.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'summary', type: 'string', description: 'The title of the event', required: true },
    { name: 'startTime', type: 'datetime-local', description: 'Event start time', required: true },
    { name: 'endTime', type: 'datetime-local', description: 'Event end time', required: true },
    { name: 'description', type: 'string', description: 'Optional event description', required: false },
  ],
  outputParameters: [
    { name: 'eventId', type: 'string', description: 'The ID of the created event', required: true },
    { name: 'eventUrl', type: 'string', description: 'Link to the created event', required: true },
  ],
  target: {
    type: 'service', // or 'function'
    identifier: 'AiCalendarService.createEvent', // Placeholder
  },
  execute: async (input: any, context: CapabilityContext) => {
    // In a real scenario, this would call the AiCalendarService.createEvent
    // or use the 'target' to dispatch to the correct function/service.
    console.log('Executing calendar-create-event with input:', input, 'and context:', context);
    // Simulate API call
    if (!input.summary || !input.startTime || !input.endTime) {
      throw new Error('Missing required parameters for creating calendar event.');
    }
    return {
      eventId: `evt_${Date.now()}`,
      eventUrl: `https://example.com/calendar/event/evt_${Date.now()}`,
    };
  },
  tags: ['calendar', 'schedule', 'event'],
  permissionsRequired: ['calendar:write'],
};

// To register this example (don't uncomment here, do it in a component or setup file):
// useCapabilityRegistryStore.getState().registerCapability(exampleCalendarCapability);
*/

export default useCapabilityRegistryStore; 