import { useContext } from 'react';
import { ServicesContext } from '../main';

export function useServices() {
  const services = useContext(ServicesContext);
  
  if (!services) {
    throw new Error('useServices must be used within a ServicesContext.Provider');
  }
  
  return services;
}

// Convenience hooks for individual services
export function useAIService() {
  const { aiService } = useServices();
  return aiService;
}

export function useTaskService() {
  const { taskService } = useServices();
  return taskService;
}

export function useCalendarService() {
  const { calendarService } = useServices();
  return calendarService;
}

export function useWorkflowOrchestrator() {
  const { workflowOrchestrator } = useServices();
  return workflowOrchestrator;
}

export function useAgentCreation() {
  const { agentCreationService } = useServices();
  return agentCreationService;
}

export function useVoiceControl() {
  const { voiceControl } = useServices();
  return voiceControl;
}

export function useAIAssistant() {
  const { aiAssistant } = useServices();
  return aiAssistant;
} 