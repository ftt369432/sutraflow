import * as React from 'react';
import { SkillCreatorWizard } from '../components/skills/SkillCreatorWizard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../components/ui/Breadcrumb';
import { Home, Sparkles, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function SkillCreatorPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer flex items-center">
                <Home className="h-4 w-4 mr-1 text-slate-400" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/cortex')} className="cursor-pointer flex items-center">
                <Terminal className="h-4 w-4 mr-1 text-slate-400" />
                Cortex
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="flex items-center text-purple-400 font-medium">
                <Sparkles className="h-4 w-4 mr-1" />
                Skill Creator Wizard
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <SkillCreatorWizard />
    </div>
  );
}

export default SkillCreatorPage;
