/**
 * Defines a role within a Swarm Template, including its configuration.
 */
export interface AgentRoleDefinition {
  roleName: string;         // e.g., "Legal Researcher", "Content Summarizer", "Task Scheduler"
  description: string;      // Brief description of what this role does
  requiredCapabilities: string[]; // List of capability IDs needed to fulfill this role
  minAgents?: number;       // Minimum number of agents required for this role in a swarm
  maxAgents?: number;       // Maximum number of agents that can be assigned to this role
}

/**
 * Represents a reusable template for configuring a Swarm.
 */
export interface SwarmTemplate {
  id: string;                 // Unique identifier for the template (e.g., UUID)
  name: string;               // User-friendly name for the template (e.g., "Standard Legal Intake")
  description: string;        // Detailed description of the template's purpose and use case
  templateType: string;       // Category or type of the template (e.g., "legal", "content_creation", "project_management")
  roles: AgentRoleDefinition[]; // Array of agent roles defined for this template
  defaultInstructions?: string; // General instructions or goals for swarms created from this template
  creatorId?: string;         // ID of the user who created this template (if user-created)
  createdAt?: string;         // ISO 8601 timestamp of when the template was created
  updatedAt?: string;         // ISO 8601 timestamp of when the template was last updated
  isSystemTemplate?: boolean; // Flag to distinguish system-provided templates from user-created ones
} 