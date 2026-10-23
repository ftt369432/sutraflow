import React from 'react';
import { useParams } from 'react-router-dom';
import { useAssistantStore } from '../../store/assistantStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { ChevronLeft, Settings, Brain, MessageCircle } from 'lucide-react';
import { AssistantChat } from '../assistants/AssistantChat';
import { AssistantConfig } from '../assistants/AssistantConfig';
import { LearningDashboard } from '../learning/LearningDashboard';

export function AIAssistantDetail() {
  const { assistantId } = useParams<{ assistantId: string }>();
  const { getAssistantById, updateAssistant } = useAssistantStore();
  const [activeTab, setActiveTab] = React.useState('chat');
  
  const assistant = assistantId ? getAssistantById(assistantId) : null;
  
  const handleAssistantUpdate = (updatedAssistant: any) => {
    if (assistantId) {
      updateAssistant(assistantId, updatedAssistant);
    }
  };
  
  if (!assistant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg">Assistant not found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assistant.name}</h1>
          <p className="text-muted-foreground">{assistant.description}</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" /> Chat
          </TabsTrigger>
          <TabsTrigger value="learning">
            <Brain className="h-4 w-4 mr-2" /> Learning
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-0">
          <AssistantChat assistant={assistant} />
        </TabsContent>
        
        <TabsContent value="learning" className="mt-0">
          <LearningDashboard 
            assistant={assistant} 
            onUpdate={handleAssistantUpdate}
          />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <AssistantConfig 
            assistant={assistant} 
            onSave={handleAssistantUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
