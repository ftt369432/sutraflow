import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Plus, Save, Play, Settings, Trash2, Copy, Download, Upload,
  Database, Globe, Mail, Calendar, FileText, Image, Calculator,
  GitBranch, Zap, Filter, RefreshCw, Clock, Bell, Users, Target,
  ArrowRight, MoreVertical, Maximize2, Minimize2, Grid3X3
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'webhook' | 'transform';
  name: string;
  icon: any;
  position: { x: number; y: number };
  data: any;
  connections: string[];
  color: string;
}

interface N8NVisualFlowBuilderProps {
  onSave?: (workflow: any) => void;
  onDeploy?: (workflow: any) => void;
  initialWorkflow?: any;
}

export function N8NVisualFlowBuilder({ 
  onSave, 
  onDeploy, 
  initialWorkflow 
}: N8NVisualFlowBuilderProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Node templates for the toolbox
  const nodeTemplates = [
    {
      type: 'trigger',
      name: 'Webhook Trigger',
      icon: Globe,
      color: 'from-green-500 to-emerald-600',
      data: { url: '', method: 'POST' }
    },
    {
      type: 'trigger', 
      name: 'Schedule Trigger',
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      data: { cron: '0 9 * * *', timezone: 'UTC' }
    },
    {
      type: 'action',
      name: 'Send Email',
      icon: Mail,
      color: 'from-purple-500 to-purple-600',
      data: { to: '', subject: '', body: '' }
    },
    {
      type: 'action',
      name: 'HTTP Request',
      icon: Database,
      color: 'from-orange-500 to-red-600',
      data: { url: '', method: 'GET', headers: {} }
    },
    {
      type: 'condition',
      name: 'If Condition',
      icon: GitBranch,
      color: 'from-yellow-500 to-orange-600',
      data: { condition: '', trueAction: '', falseAction: '' }
    },
    {
      type: 'transform',
      name: 'Transform Data',
      icon: RefreshCw,
      color: 'from-teal-500 to-cyan-600',
      data: { mapping: {} }
    },
    {
      type: 'action',
      name: 'Save to Database',
      icon: Database,
      color: 'from-indigo-500 to-purple-600',
      data: { table: '', fields: {} }
    },
    {
      type: 'action',
      name: 'Create Calendar Event',
      icon: Calendar,
      color: 'from-pink-500 to-rose-600',
      data: { title: '', start: '', end: '' }
    }
  ];

  // Add new node to canvas
  const addNode = useCallback((template: any, position?: { x: number; y: number }) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: template.type,
      name: template.name,
      icon: template.icon,
      position: position || { x: 200 + nodes.length * 150, y: 150 },
      data: { ...template.data },
      connections: [],
      color: template.color
    };
    
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  // Handle drag and drop from toolbox
  const handleDragStart = (e: React.DragEvent, template: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const template = JSON.parse(e.dataTransfer.getData('application/json'));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      addNode(template, position);
    }
  };

  // Node drag functionality
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    setIsDragging(true);
    setDragNode(nodeId);
    setSelectedNode(nodeId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && dragNode) {
      setNodes(prev => prev.map(node => 
        node.id === dragNode 
          ? { ...node, position: { x: e.clientX - 350, y: e.clientY - 100 } }
          : node
      ));
    }
  }, [isDragging, dragNode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Connect nodes
  const connectNodes = (fromId: string, toId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === fromId 
        ? { ...node, connections: [...node.connections, toId] }
        : node
    ));
  };

  // Save workflow
  const saveWorkflow = () => {
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: workflowName,
      nodes,
      created: new Date().toISOString()
    };
    
    onSave?.(workflow);
    console.log('🚀 Workflow saved:', workflow);
  };

  // Deploy workflow  
  const deployWorkflow = () => {
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: workflowName,
      nodes,
      status: 'active'
    };
    
    onDeploy?.(workflow);
    console.log('🎯 Workflow deployed:', workflow);
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-metallic-50 to-blue-metallic-100 dark:from-blue-dark-metallic-800 dark:to-blue-dark-metallic-700">
        <div className="flex items-center gap-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="font-semibold text-lg border-0 bg-transparent"
            placeholder="Workflow Name"
          />
          <Badge variant="outline" className="text-blue-metallic-700">
            {nodes.length} nodes
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNodes([])}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={saveWorkflow}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={deployWorkflow} className="bg-gradient-to-r from-blue-metallic-600 to-blue-metallic-700">
            <Play className="w-4 h-4 mr-2" />
            Deploy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Node Toolbox */}
        <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Node Library
          </h3>
          
          <div className="space-y-2">
            {nodeTemplates.map((template, index) => {
              const IconComponent = (typeof template.icon === 'function') ? template.icon : Zap; // Ensure we have a valid React component
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template)}
                  className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-metallic-400 cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color}`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {template.type}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                <Download className="w-4 h-4 mr-2" />
                Import Workflow
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Export Workflow
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Canvas Instructions */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Drag nodes from the toolbox to get started</p>
                <p className="text-sm">Create your workflow by connecting triggers, actions, and conditions</p>
              </div>
            </div>
          )}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const IconComponent = (typeof node.icon === 'function') ? node.icon : Zap; // Ensure we have a valid React component
            return (
              <div
                key={node.id}
                className={`absolute cursor-move select-none ${
                  selectedNode === node.id ? 'ring-2 ring-blue-metallic-500' : ''
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: isDragging && dragNode === node.id ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <Card className="w-48 shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${node.color}`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{node.name}</p>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {node.type}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {/* Connection points */}
                      <div className="flex justify-between items-center">
                        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer hover:bg-blue-metallic-400"></div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer hover:bg-blue-metallic-400"></div>
                      </div>
                      
                      {/* Node configuration preview */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {Object.keys(node.data).length > 0 
                          ? `${Object.keys(node.data).length} settings configured`
                          : 'No configuration'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Connection lines would go here */}
          <svg className="absolute inset-0 pointer-events-none">
            {nodes.map(node => 
              node.connections.map(connectionId => {
                const targetNode = nodes.find(n => n.id === connectionId);
                if (!targetNode) return null;
                
                return (
                  <line
                    key={`${node.id}-${connectionId}`}
                    x1={node.position.x + 192} // right edge of source node
                    y1={node.position.y + 60}  // center of source node
                    x2={targetNode.position.x} // left edge of target node
                    y2={targetNode.position.y + 60} // center of target node
                    stroke="#6366f1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })
            )}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6366f1"
                />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-white dark:bg-gray-800 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Node Properties
            </h3>
            
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Node Name
                    </label>
                    <Input
                      value={node.name}
                      onChange={(e) => {
                        setNodes(prev => prev.map(n => 
                          n.id === selectedNode ? { ...n, name: e.target.value } : n
                        ));
                      }}
                      className="mt-1"
                    />
                  </div>
                  
                  {Object.entries(node.data).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <Input
                        value={value as string}
                        onChange={(e) => {
                          setNodes(prev => prev.map(n => 
                            n.id === selectedNode 
                              ? { ...n, data: { ...n.data, [key]: e.target.value } }
                              : n
                          ));
                        }}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}