import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BatchAIProcessor } from '../components/knowledge/BatchAIProcessor';
import { DocumentProcessingDashboard } from '../components/ai/DocumentProcessingDashboard';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { DocumentProcessingChart } from '../components/analytics/DocumentProcessingChart';
import { DocumentTypeDistribution } from '../components/analytics/DocumentTypeDistribution';
import { ProcessingErrorLogs } from '../components/analytics/ProcessingErrorLogs';
import { DataQualityAssessment } from '../components/analytics/DataQualityAssessment';
import { 
  ArrowLeft, 
  Monitor, 
  Zap, 
  BarChart3, 
  RefreshCw, 
  Download, 
  Info,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Clock,
  Search,
  Filter
} from 'lucide-react';

export function AIProcessingPage() {
  const navigate = useNavigate();
  const { addFolder } = useKnowledgeBaseStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batch' | 'analytics'>('dashboard');

  // This function matches the expected signature for onCreateFolder in BatchAIProcessor
  // It needs to be async if the actual addFolder in your store is async,
  // and BatchAIProcessor expects a Promise.
  const handleCreateFolder = async (name: string, parentId?: string) => {
    // Assuming addFolder in your store handles the folder creation logic
    // and might return a promise or the created folder.
    // For BatchAIProcessor, it just needs to know the operation is initiated.
    try {
      await addFolder({ name }); // If addFolder is async and returns a promise
      console.log(`Folder "${name}" creation initiated.`);
    } catch (error) {
      console.error(`Error creating folder "${name}":`, error);
      // Optionally, re-throw or handle the error appropriately for the UI
      throw error;
    }
  };

  const handleProcessingComplete = (result: any) => {
    console.log('AI Processing Complete on page:', result);
    // You might want to show a summary or navigate the user.
    // For example, navigate back to the knowledge base or to a results summary page.
    // navigate('/knowledge'); // Example
  };

  const TabButton = ({ 
    tab, 
    icon: Icon, 
    label, 
    isActive 
  }: { 
    tab: string; 
    icon: any; 
    label: string; 
    isActive: boolean; 
  }) => (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center gap-2 ${isActive ? 'btn-genie-primary' : ''}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">AI Document Processing</h1>
            <p className="text-slate-600">Intelligent document analysis, embedding generation, and batch processing</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        <TabButton
          tab="dashboard"
          icon={Monitor}
          label="Live Dashboard"
          isActive={activeTab === 'dashboard'}
        />
        <TabButton
          tab="batch"
          icon={Zap}
          label="Batch Processor"
          isActive={activeTab === 'batch'}
        />
        <TabButton
          tab="analytics"
          icon={BarChart3}
          label="Analytics"
          isActive={activeTab === 'analytics'}
        />
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <div>
            <DocumentProcessingDashboard />
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="bg-card p-6 rounded-lg shadow-md">
            <BatchAIProcessor
              isPageContext={true}
              onCreateFolder={handleCreateFolder}
              onComplete={handleProcessingComplete}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="py-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-700">Processing Analytics</h3>
                  <p className="text-slate-500">
                    Detailed analytics and insights about your document processing performance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="7d">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>
              
              {/* Key metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Processing Speed</h4>
                  <p className="text-2xl font-bold text-blue-600">2.3s</p>
                  <p className="text-sm text-blue-600">avg per document</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Success Rate</h4>
                  <p className="text-2xl font-bold text-green-600">98.7%</p>
                  <p className="text-sm text-green-600">documents processed</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Embeddings Generated</h4>
                  <p className="text-2xl font-bold text-purple-600">1,247</p>
                  <p className="text-sm text-purple-600">vector embeddings</p>
                </div>
              </div>
              
              <Tabs defaultValue="overview" className="mb-6">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="errors">Error Logs</TabsTrigger>
                  <TabsTrigger value="quality">Data Quality</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <DocumentProcessingChart 
                      title="Documents Processed (Last 7 Days)" 
                      description="Daily document processing volume and error rate"
                    />
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="flex justify-between">
                            <h5 className="text-sm font-medium text-slate-500">Total Documents</h5>
                            <FileText className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-semibold mt-2">1,352</p>
                          <p className="text-xs text-green-600 mt-1">+124 this week</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="flex justify-between">
                            <h5 className="text-sm font-medium text-slate-500">Processing Queue</h5>
                            <Clock className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-semibold mt-2">12</p>
                          <p className="text-xs text-blue-600 mt-1">Est. completion: 4 min</p>
                        </div>
                      </div>
                      
                      <DocumentTypeDistribution />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 col-span-1">
                      <h5 className="text-sm font-medium text-slate-500 mb-3">Processing Statistics</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Avg Document Size</span>
                          <span className="text-sm font-medium">2.3 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Largest Document</span>
                          <span className="text-sm font-medium">24.8 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">File Types Count</span>
                          <span className="text-sm font-medium">8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Oldest Document</span>
                          <span className="text-sm font-medium">183 days</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-slate-200 col-span-1">
                      <h5 className="text-sm font-medium text-slate-500 mb-3">Processing Performance</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Peak Rate</span>
                          <span className="text-sm font-medium">7.2 docs/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Embedding Time</span>
                          <span className="text-sm font-medium">1.8 sec</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Longest Time</span>
                          <span className="text-sm font-medium">124 sec</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Failure Rate</span>
                          <span className="text-sm font-medium">1.3%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-slate-200 col-span-1">
                      <h5 className="text-sm font-medium text-slate-500 mb-3">Quality Summary</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Overall Score</span>
                          <span className="text-sm font-medium text-blue-600">91%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Quality Alerts</span>
                          <span className="text-sm font-medium text-amber-600">2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Critical Issues</span>
                          <span className="text-sm font-medium text-red-600">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Last Quality Check</span>
                          <span className="text-sm font-medium">Today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="errors">
                  <ProcessingErrorLogs />
                </TabsContent>
                
                <TabsContent value="quality">
                  <DataQualityAssessment />
                </TabsContent>
                
                <TabsContent value="performance">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                      <div className="flex justify-between mb-4">
                        <h4 className="text-lg font-semibold text-slate-700">Processing Time Distribution</h4>
                        <Select defaultValue="documents">
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="documents">By Document</SelectItem>
                            <SelectItem value="types">By Type</SelectItem>
                            <SelectItem value="size">By Size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="h-[300px] flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <BarChart3 className="w-16 h-16 mx-auto text-slate-300" />
                          <p className="mt-2">Processing time distribution chart</p>
                          <p className="text-xs text-slate-400">Visualizes processing times across documents</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-700 mb-4">Performance Factors</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Document Size Impact</span>
                              <span className="text-sm font-medium text-amber-600">High</span>
                            </div>
                            <Progress value={85} className="h-2" indicatorColor="bg-amber-500" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Content Complexity</span>
                              <span className="text-sm font-medium text-blue-600">Medium</span>
                            </div>
                            <Progress value={60} className="h-2" indicatorColor="bg-blue-500" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Format Overhead</span>
                              <span className="text-sm font-medium text-green-600">Low</span>
                            </div>
                            <Progress value={30} className="h-2" indicatorColor="bg-green-500" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-700 mb-4">Optimization Recommendations</h4>
                        <div className="space-y-3">
                          <div className="flex gap-3 items-start">
                            <div className="bg-blue-100 p-1.5 rounded-full">
                              <Zap className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="text-sm font-medium">Batch process documents under 5MB</h5>
                              <p className="text-xs text-slate-500">Potential 22% performance increase</p>
                            </div>
                          </div>
                          <div className="flex gap-3 items-start">
                            <div className="bg-green-100 p-1.5 rounded-full">
                              <Zap className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h5 className="text-sm font-medium">Optimize OCR parameters for scanned docs</h5>
                              <p className="text-xs text-slate-500">Improves quality by estimated 15%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIProcessingPage;