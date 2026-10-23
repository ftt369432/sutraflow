# 🤖 AI Agent Orchestration System

## Overview

The AI Agent Orchestration System is a hierarchical, hybrid AI agent architecture that enables intelligent task breakdown and multi-domain workflow coordination. Inspired by Cursor AI's todo system, it provides sophisticated task management with agent-to-agent communication.

## 🎯 Key Features

### Hierarchical Task Management
- **Intelligent Task Breakdown**: Complex requests automatically decomposed into manageable subtasks
- **Multi-Level Nesting**: Support for deep task hierarchies with parent-child relationships
- **Dependency Management**: Tasks can depend on completion of other tasks
- **Progress Tracking**: Real-time progress updates across the entire task hierarchy

### Specialized Agents
- **Document Agent**: Canvas creation, editing, and document operations
- **Legal Agent**: Legal document generation (petitions, contracts, motions)
- **Medical Agent**: Medical correspondence and communication
- **Calendar Agent**: Scheduling and calendar management
- **Extensible**: Easy to add new specialized agents

### Agent-to-Agent Communication
- **Message Passing**: Agents can communicate with each other via structured messages
- **Task Handoffs**: Seamless handoff between agents for complex workflows
- **Coordination**: Multi-agent coordination for cross-domain tasks

### Smart Routing
- **Complexity Analysis**: Automatic detection of simple vs complex requests
- **Fallback Integration**: Simple requests still use the standard canvas system
- **Performance Optimization**: Route only complex requests through the agent system

## 🏗️ Architecture

```
User Request
     ↓
Smart Router (AIAgentIntegration)
     ↓
AI Agent Orchestrator
     ↓
Specialized Agents (Document, Legal, Medical, Calendar)
     ↓
Canvas System / External Services
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { 
  initializeAIAgentSystem, 
  processUserRequestWithAgents 
} from '@/services/agents';

// Initialize the system
const orchestrator = initializeAIAgentSystem();

// Process a complex request
const result = await processUserRequestWithAgents(
  'create penalty petition and letter to Dr. Daldalyan',
  'conversation-id-123'
);
```

### Smart Routing

```typescript
import { handleComplexRequestWithAgents } from '@/services/agents';

// Automatically routes to agents or canvas system based on complexity
const result = await handleComplexRequestWithAgents(
  userInput,
  conversationId,
  context
);
```

## 📋 Task Examples

### Simple Request (Standard Canvas)
```
"Create a document about project status"
→ Routes to standard canvas system
```

### Complex Multi-Domain Request (AI Agents)
```
"Create penalty petition and letter to Dr. Daldalyan, schedule appointment, send notification email"
→ Routes to AI Agent system
→ Breaks down into:
  1. Legal Agent: Create penalty petition
  2. Medical Agent: Create letter to Dr. Daldalyan  
  3. Calendar Agent: Schedule appointment
  4. Email Agent: Send notification
```

## 🎛️ UI Components

### AIAgentTaskManager
Visual task management interface with:
- Hierarchical task tree visualization
- Real-time progress tracking
- Agent assignment badges
- Task filtering and search
- Expandable/collapsible task groups

```typescript
import { AIAgentTaskManager } from '@/services/agents';

<AIAgentTaskManager 
  workflowId="workflow-123"
  onTaskUpdate={handleTaskUpdate}
  onTaskComplete={handleTaskComplete}
/>
```

## 🔧 Configuration

### Adding New Agents

1. **Create Agent Class**:
```typescript
export class CustomAgent implements AIAgent {
  type = AgentType.CUSTOM_AGENT;
  name = 'Custom Agent';
  capabilities = ['custom_capability'];
  isAvailable = true;
  
  canHandle(task: AIAgentTask): boolean {
    return /custom|special/.test(task.instruction.toLowerCase());
  }
  
  async executeTask(task: AIAgentTask): Promise<AIAgentTask> {
    // Implementation
  }
  
  // ... other required methods
}
```

2. **Register Agent**:
```typescript
const orchestrator = getAIAgentOrchestrator();
orchestrator.registerAgent(new CustomAgent());
```

### Workflow Templates

Pre-defined templates for common workflows:

```typescript
const legalWorkflowTemplate: WorkflowTemplate = {
  id: 'legal_petition_workflow',
  name: 'Legal Petition & Communication',
  triggerPatterns: [/penalty petition.*letter/i],
  taskTemplate: [
    { agentType: AgentType.LEGAL_AGENT, priority: 1 },
    { agentType: AgentType.MEDICAL_AGENT, priority: 2 }
  ],
  agentSequence: [AgentType.LEGAL_AGENT, AgentType.MEDICAL_AGENT]
};
```

## 🧪 Testing

Run the test suite:

```typescript
import { runAIAgentTests } from '@/services/agents/AIAgentSystemTest';

await runAIAgentTests();
```

## 📊 Monitoring

### Task Status Tracking
- `NOT_STARTED`: Task created but not yet started
- `IN_PROGRESS`: Agent actively working on task
- `AGENT_HANDOFF`: Task passed to another agent
- `COMPLETED`: Task successfully completed
- `FAILED`: Task failed with error

### Progress Metrics
- Task completion percentage
- Agent utilization
- Workflow execution time
- Error rates by agent type

## 🔗 Integration Points

### Canvas System Integration
- Seamless integration with existing canvas orchestrator
- Document creation and editing via canvas system
- Preserves all existing canvas functionality

### External Services
- Calendar systems (Google Calendar, Outlook)
- Email services (SMTP, API-based)
- Document management systems
- Legal and medical databases

## 🎯 Use Cases

### Legal Practice
- **Petition Creation**: Generate legal petitions with supporting documents
- **Client Communication**: Medical evaluation requests and follow-ups
- **Case Management**: Coordinate multiple documents and deadlines

### Medical Practice  
- **Patient Communication**: Letters to healthcare providers
- **Documentation**: Medical evaluations and reports
- **Scheduling**: Appointment coordination with multiple parties

### Business Operations
- **Multi-Document Workflows**: Create related documents simultaneously
- **Cross-Department Tasks**: Coordinate tasks across different teams
- **Automated Workflows**: Recurring multi-step processes

## 🚧 Future Enhancements

### Planned Features
- [ ] **Voice Integration**: Voice-activated agent commands
- [ ] **Machine Learning**: Adaptive task breakdown based on user patterns  
- [ ] **External Integrations**: More third-party service connectors
- [ ] **Workflow Analytics**: Advanced metrics and optimization suggestions
- [ ] **Team Collaboration**: Multi-user agent coordination

### Advanced Capabilities
- [ ] **Agent Learning**: Agents learn from user corrections and preferences
- [ ] **Predictive Routing**: AI-powered request classification
- [ ] **Resource Management**: Agent load balancing and queuing
- [ ] **Error Recovery**: Automatic retry and fallback mechanisms

## 📚 API Reference

### Core Classes

#### AIAgentOrchestrator
Main coordination engine for the agent system.

**Methods:**
- `processUserRequest(userInput, context)`: Process complex user requests
- `analyzeWorkflowComplexity(userInput)`: Analyze request complexity
- `registerAgent(agent)`: Register new specialized agent

#### AIAgent Interface
Base interface for all specialized agents.

**Required Methods:**
- `canHandle(task)`: Determine if agent can handle a task
- `executeTask(task)`: Execute the assigned task
- `sendMessage(message)`: Send message to other agents
- `receiveMessage(message)`: Handle incoming messages

### Integration Functions

#### initializeAIAgentSystem()
Initialize the agent system with all specialized agents.

#### processUserRequestWithAgents(request, conversationId, context)
Process a request through the agent system.

#### handleComplexRequestWithAgents(request, conversationId, context)
Smart routing that uses agents for complex requests, canvas for simple ones.

## 🤝 Contributing

When adding new agents or features:

1. Follow the existing agent interface pattern
2. Add comprehensive error handling
3. Include progress tracking
4. Add appropriate logging
5. Update this documentation
6. Add test cases

## 📄 License

Part of the GenieFlow AI project - see main project license.