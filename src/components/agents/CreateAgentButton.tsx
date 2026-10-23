import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateAgentModal } from './CreateAgentModal';
import type { AgentCapability } from '../../types/agent';

// Define all available capabilities here
const allCapabilities: { id: AgentCapability; name: string }[] = [
  { id: 'email-processing', name: 'Email Processing' },
  { id: 'document-analysis', name: 'Document Analysis' },
  { id: 'scheduling', name: 'Scheduling' },
  { id: 'task-management', name: 'Task Management' },
  { id: 'natural-language', name: 'Natural Language' },
  { id: 'calendar-management', name: 'Calendar Management' },
  { id: 'drafting', name: 'Drafting' },
  { id: 'web-search', name: 'Web Search' },
  { id: 'data-analysis', name: 'Data Analysis' },
  { id: 'report-generation', name: 'Report Generation' },
  { id: 'code-generation', name: 'Code Generation' },
  { id: 'code-review', name: 'Code Review' },
  { id: 'debugging', name: 'Debugging' },
];

export function CreateAgentButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        New Agent
      </Button>

      {showModal && (
        <CreateAgentModal
          onClose={() => setShowModal(false)}
          allCapabilities={allCapabilities}
        />
      )}
    </>
  );
} 