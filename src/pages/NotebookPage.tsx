import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { NotebookManager } from '../components/notebook/NotebookManager';
import { NotebookEditor } from '../components/notebook/NotebookEditor';
import { useNotebookStore } from '../store/notebookStore';

export function NotebookPage() {
  const { activeNotebookId } = useNotebookStore();
  const [activeTab, setActiveTab] = useState<string>(activeNotebookId ? 'editor' : 'manage');

  // When a notebook is selected, switch to the editor tab
  React.useEffect(() => {
    if (activeNotebookId && activeTab !== 'editor') {
      setActiveTab('editor');
    }
  }, [activeNotebookId]);

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notebooks</h1>
          <TabsList>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="editor" disabled={!activeNotebookId}>
              Editor
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="manage" className="mt-4">
          <NotebookManager />
        </TabsContent>

        <TabsContent value="editor" className="mt-0 min-h-[85vh]">
          {activeNotebookId ? (
            <NotebookEditor />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Please select a notebook first</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 