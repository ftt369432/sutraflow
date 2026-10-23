# Canvas Hooks System Documentation

## Overview

The Canvas Hooks System is a centralized, modular architecture for managing canvas documents, templates, agents, and workflows. This system follows the project's prompt guidelines for clean, production-ready code with proper centralization and documentation.

## Architecture

```
src/hooks/canvas/
├── index.ts                    # Centralized exports
├── types.ts                    # TypeScript interfaces
├── useCanvas.ts               # Core canvas management
├── useCanvasDocument.ts       # Document-specific operations
├── useCanvasTemplates.ts      # Template management
├── useCanvasAgent.ts          # AI agent management
├── useCanvasUI.ts             # UI state management
├── useCanvasWorkflow.ts       # Workflow automation
├── useCanvasChatIntegration.ts # Chat integration (existing)
└── README.md                  # This documentation
```

## Core Hooks

### 🎨 `useCanvas` - Core Canvas Management

**Purpose**: Central hub for canvas window and document operations.

```typescript
import { useCanvas } from '@/hooks/canvas';

const {
  // State
  windows,
  activeWindow,
  isCanvasEnabled,
  
  // Actions
  createDocument,
  closeDocument,
  switchToDocument,
  
  // Utilities
  getDocumentStats,
  hasDocuments,
} = useCanvas({ autoSave: true, showNotifications: true });
```

**Key Features**:
- Window management (create, close, switch)
- Document statistics (word count, character count)
- Auto-save functionality
- Notification system integration

### 📄 `useCanvasDocument` - Document Operations

**Purpose**: Document-specific operations and state management.

```typescript
import { useCanvasDocument } from '@/hooks/canvas';

const {
  // Document data
  document,
  content,
  isModified,
  
  // Actions
  updateContent,
  saveDocument,
  deleteDocument,
  
  // History
  undo,
  redo,
  canUndo,
  canRedo,
} = useCanvasDocument(documentId);
```

**Key Features**:
- Content editing with change tracking
- Undo/redo functionality
- Document metadata management
- Save/delete operations

### 📋 `useCanvasTemplates` - Template Management

**Purpose**: Template creation, loading, and application.

```typescript
import { useCanvasTemplates } from '@/hooks/canvas';

const {
  // Templates
  templates,
  categories,
  
  // Actions
  createFromTemplate,
  getTemplate,
  previewTemplate,
  
  // Utilities
  getTemplatesByCategory,
} = useCanvasTemplates();
```

**Built-in Templates**:
- Legal Contract
- Business Plan
- Technical Report
- Presentation

### 🤖 `useCanvasAgent` - AI Agent Management

**Purpose**: AI agent creation, task assignment, and performance tracking.

```typescript
import { useCanvasAgent } from '@/hooks/canvas';

const {
  // Agent data
  agent,
  agentTasks,
  
  // Actions
  createAgent,
  assignTask,
  deleteAgent,
  
  // Utilities
  getSpecializationInfo,
  getPerformanceMetrics,
} = useCanvasAgent(agentId);
```

**Agent Specializations**:
- Research Agent
- Writing Agent
- Formatting Agent
- Legal Review Agent
- Fact Check Agent
- Citation Agent
- Compliance Agent
- Financial Analysis Agent

### 🎛️ `useCanvasUI` - UI State Management

**Purpose**: Canvas interface state and layout management.

```typescript
import { useCanvasUI } from '@/hooks/canvas';

const {
  // Layout state
  sidebarOpen,
  rightPanelOpen,
  toolbarCollapsed,
  
  // Actions
  toggleSidebar,
  toggleRightPanel,
  toggleToolbar,
  
  // Zoom controls
  zoomIn,
  zoomOut,
  resetZoom,
} = useCanvasUI();
```

**Features**:
- Responsive layout management
- Keyboard shortcuts (Cmd+B, Cmd+R, etc.)
- Zoom controls (50% - 200%)
- Auto-hide functionality

### 🔄 `useCanvasWorkflow` - Workflow Automation

**Purpose**: Multi-step workflow management and automation.

```typescript
import { useCanvasWorkflow } from '@/hooks/canvas';

const {
  // Workflow state
  currentWorkflow,
  workflowState,
  isActive,
  
  // Actions
  startWorkflow,
  executeCurrentStep,
  completeCurrentStep,
  
  // Utilities
  getProgress,
  getEstimatedTime,
} = useCanvasWorkflow();
```

**Predefined Workflows**:
- Legal Contract Creation
- Business Plan Development

## Integration Examples

### Creating a Document from Template

```typescript
import { useCanvasTemplates, useCanvas } from '@/hooks/canvas';

function DocumentCreator() {
  const { createFromTemplate } = useCanvasTemplates();
  const { switchToDocument } = useCanvas();
  
  const handleCreateContract = async () => {
    const windowId = createFromTemplate('legal-contract', {
      'Party A': 'Acme Corporation',
      'Party B': 'Client Company',
    });
    
    if (windowId) {
      switchToDocument(windowId);
    }
  };
  
  return (
    <button onClick={handleCreateContract}>
      Create Legal Contract
    </button>
  );
}
```

### Starting an Automated Workflow

```typescript
import { useCanvasWorkflow, useCanvas } from '@/hooks/canvas';

function WorkflowManager() {
  const { startWorkflow, executeCurrentStep, currentStep } = useCanvasWorkflow();
  const { createDocument } = useCanvas();
  
  const handleStartBusinessPlan = async () => {
    const documentId = createDocument('business_plan', 'My Business Plan');
    await startWorkflow('business-plan-development', documentId);
  };
  
  return (
    <div>
      <button onClick={handleStartBusinessPlan}>
        Start Business Plan Workflow
      </button>
      
      {currentStep && (
        <div>
          Current Step: {currentStep.name}
          <button onClick={executeCurrentStep}>
            Execute Step
          </button>
        </div>
      )}
    </div>
  );
}
```

### Document Editing with Agent Assistance

```typescript
import { useCanvasDocument, useCanvasAgent } from '@/hooks/canvas';

function DocumentEditor({ documentId }: { documentId: string }) {
  const { content, updateContent, saveDocument } = useCanvasDocument(documentId);
  const { createAgent, assignTask } = useCanvasAgent();
  
  const handleRequestReview = async () => {
    const agentId = createAgent(documentId, 'legal_review');
    if (agentId) {
      await assignTask('review_contract', 'Please review this contract for legal compliance');
    }
  };
  
  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => updateContent(e.target.value)}
      />
      
      <button onClick={saveDocument}>Save</button>
      <button onClick={handleRequestReview}>Request Legal Review</button>
    </div>
  );
}
```

## TypeScript Types

All hooks use strongly typed interfaces defined in `types.ts`:

- `CanvasHookOptions` - Configuration options for hooks
- `DocumentEditorState` - Document editor state structure
- `CanvasTemplateData` - Template data structure
- `WorkflowState` - Workflow execution state
- `DocumentAction` - Action payload structure

## Error Handling

All hooks include comprehensive error handling:

- Try-catch blocks for async operations
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks for missing data

## Performance Optimizations

- Memoized computed values using `useMemo`
- Debounced auto-save functionality
- Efficient state updates with `useCallback`
- Minimal re-renders through proper dependency arrays

## Testing

Each hook can be tested independently using React Testing Library:

```typescript
import { renderHook } from '@testing-library/react';
import { useCanvas } from '@/hooks/canvas';

test('useCanvas creates document', () => {
  const { result } = renderHook(() => useCanvas());
  
  act(() => {
    const windowId = result.current.createDocument('legal_contract', 'Test Contract');
    expect(windowId).toBeTruthy();
  });
});
```

## Best Practices

1. **Always use the centralized export**: Import from `@/hooks/canvas` index
2. **Handle loading states**: Check for null/undefined values
3. **Provide user feedback**: Use toast notifications for actions
4. **Follow TypeScript**: Use provided interfaces and types
5. **Error boundaries**: Wrap components using hooks in error boundaries

## Future Enhancements

- Real-time collaboration hooks
- Advanced workflow automation
- Plugin system for custom agents
- Enhanced template marketplace
- Performance analytics hooks

---

*This documentation follows the project's prompt guidelines for comprehensive, production-ready documentation with clear examples and best practices.*
