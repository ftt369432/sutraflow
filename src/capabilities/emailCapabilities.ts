import { Capability, CapabilityContext /*, ParameterDefinition*/ } from '../types/capabilities';
import { EmailService } from '../services/email/emailService';
import { EmailMessage, EmailAnalysis } from '../services/email/types';

const emailServiceInstance = EmailService.getInstance();

export const analyzeEmailCapability: Capability = {
  id: 'email-analyze',
  name: 'Analyze Email Content',
  description: 'Analyzes the content of an email to extract insights such as priority, category, sentiment, action items, summary, keywords, and potential meeting details.',
  category: 'Email',
  version: '1.0.0',
  inputParameters: [
    { name: 'emailMessage', type: 'EmailMessage', description: 'The email message object to be analyzed.', required: true },
  ],
  outputParameters: [
    { name: 'analysisResult', type: 'EmailAnalysis', description: 'The analysis result object, or null if analysis fails.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'EmailService.analyzeEmail',
  },
  execute: async (
    input: unknown,
    _context: CapabilityContext
  ): Promise<{ analysisResult: EmailAnalysis | null }> => {
    const typedInput = input as { emailMessage: EmailMessage };
    if (!typedInput.emailMessage) {
      throw new Error('Missing required input parameter: emailMessage for email-analyze.');
    }
    try {
      const result = await emailServiceInstance.analyzeEmail(typedInput.emailMessage);
      return { analysisResult: result };
    } catch (error: unknown) {
      console.error(`Error executing ${analyzeEmailCapability.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to analyze email ${typedInput.emailMessage.id}: ${errorMessage}`);
    }
  },
  tags: ['email', 'nlp', 'text-analysis', 'ai', 'automation'],
  permissionsRequired: ['email:read', 'ai:analyze'], // Example permissions
  exampleUsage: {
    emailMessage: {
      id: "message_123",
      threadId: "thread_abc",
      subject: "Project Update Meeting Request",
      from: "colleague@example.com",
      to: "me@example.com",
      date: "2024-07-30T10:00:00Z",
      body: "Hi team, Can we schedule a meeting for next week to discuss the project updates? Please suggest your availability. I was thinking Tuesday or Wednesday afternoon. Bob needs to be there too. Thanks",
      snippet: "Hi team, Can we schedule a meeting for next week...",
      // Other EmailMessage fields as needed by the service for analysis
    }
  }
};

// To register this capability, import it and call:
// import { useCapabilityRegistryStore } from '../stores/capabilityRegistryStore';
// import { analyzeEmailCapability } from './emailCapabilities';
// useCapabilityRegistryStore.getState().registerCapability(analyzeEmailCapability);
// This should typically be done once during application initialization. 