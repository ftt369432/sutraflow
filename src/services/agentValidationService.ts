import { z } from 'zod';
import { AgentError, AgentErrorType } from './agentErrorHandler';

const AgentActionSchema = z.object({
  type: z.string(),
  input: z.record(z.any()),
  priority: z.number().optional()
});

class AgentValidationService {
  validateAction(data: unknown) {
    try {
      return AgentActionSchema.parse(data);
    } catch (error) {
      throw new AgentError(
        AgentErrorType.VALIDATION,
        'Invalid action data',
        error
      );
    }
  }

  validateCapabilityInput(capability: string, input: unknown) {
    // Add capability-specific validation schemas
    const schemas: Record<string, z.ZodSchema> = {
      'email-processing': z.object({
        emailContent: z.string(),
        subject: z.string().optional()
      }),
      'document-analysis': z.object({
        documentContent: z.string(),
        type: z.string().optional()
      })
    };

    const schema = schemas[capability];
    if (!schema) {
      throw new AgentError(
        AgentErrorType.VALIDATION,
        `No validation schema for capability: ${capability}`
      );
    }

    try {
      return schema.parse(input);
    } catch (error) {
      throw new AgentError(
        AgentErrorType.VALIDATION,
        `Invalid input for capability: ${capability}`,
        error
      );
    }
  }
}

export const agentValidation = new AgentValidationService(); 