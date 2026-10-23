import { useAgentStore } from '../../store/agentStore';

export function CreateAgentExample() {
  const { createAgent } = useAgentStore();

  const handleCreateAgent = async () => {
    try {
      await createAgent(
        "Email Assistant",
        "email" as any, // TODO: Fix AgentType import or definition
        ["email-processing", "scheduling", "drafting"] as any // TODO: Fix AgentCapability import or definition
      );
      alert('Agent created successfully!');
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent. Check console for details.');
    }
  };

  return (
    <button 
      onClick={handleCreateAgent}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Create Sample Agent
    </button>
  );
} 