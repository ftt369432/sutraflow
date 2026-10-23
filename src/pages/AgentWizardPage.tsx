import React from 'react';
import { AgentWizard } from '../components/agents/AgentWizard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Home, Wand2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AgentWizardPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/ai">AI Hub</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="flex items-center">
                <Wand2 className="h-4 w-4 mr-1" />
                Workflow Wizard
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate('/swarm-hub')} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Swarm Hub
        </Button>
      </div>
      
      <AgentWizard />
    </div>
  );
}

export default AgentWizardPage;