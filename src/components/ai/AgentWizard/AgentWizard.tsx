import React from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used

interface AgentWizardRedirectProps {
  creationMode?: 'swarm' | 'agent'; // Make optional or provide default
  swarmName?: string;
  promptText: string;
}

const AgentWizardRedirect: React.FC<AgentWizardRedirectProps> = ({ 
  creationMode, 
  swarmName, 
  promptText 
}) => {
  const navigate = useNavigate();

  if (creationMode === 'swarm') {
    // Navigate to the new ConfigureSwarmPage with initial name and description
    navigate('/configure-swarm', { 
      state: {
        initialName: swarmName || `Swarm for: ${promptText.substring(0, 30)}...`,
        initialDescription: promptText,
      }
    });
  } else {
    // Handle agent creation mode or other modes if necessary
    // navigate('/configure-agent', { state: { initialPrompt: promptText } });
    console.log('Agent creation mode or other unhandled mode for prompt:', promptText);
  }

  return null; // Or some loading/redirect indicator
};

export default AgentWizardRedirect; 