// Enhanced Calendar Services
export { EnhancedCalendarService } from './EnhancedCalendarService';
export type { EnhancedCalendarServiceConfig } from './EnhancedCalendarService';

// Industry Configurations
export {
  legalIndustryConfig,
  medicalIndustryConfig,
  mortgageIndustryConfig,
  genericIndustryConfig,
  industryConfigs,
  getIndustryConfig,
  getAvailableIndustries
} from './industryConfigs';

// Re-export types for convenience
export type {
  IndustryConfig,
  EventType,
  CustomField,
  QuickAction,
  WorkflowStep,
  Workflow
} from '../../../types/calendar.types';
