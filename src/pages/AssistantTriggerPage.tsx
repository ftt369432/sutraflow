import React from 'react';
import AssistantTriggerDemo from '../components/AssistantTriggerDemo';

const AssistantTriggerPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">GenieFlow AI</h1>
          <p className="text-gray-600">Assistant-Specific Trigger Words</p>
        </header>
        
        <AssistantTriggerDemo />
        
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>Each AI assistant can have its own unique trigger words</p>
          <p>© {new Date().getFullYear()} GenieFlow AI</p>
        </footer>
      </div>
    </div>
  );
};

export default AssistantTriggerPage;
