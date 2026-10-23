/**
 * Knowledge Graph Visualization Component
 * 
 * Interactive visualization of document relationships, entities,
 * and knowledge connections using force-directed graph layout
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  FileText,
  User,
  Building,
  MapPin,
  Calendar,
  Tag,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter,
  Settings,
  Download,
  Share,
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  Pause,
  Brain,
  Sparkles,
  Target,
  Link,
  Globe
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { vectorSearchService } from '../../services/vectordb/vectorSearchService';

interface GraphNode {
  id: string;
  type: 'document' | 'entity' | 'concept' | 'topic';
  name: string;
  description?: string;
  properties: Record<string, any>;
  size: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  evidence: string[];
  metadata: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface KnowledgeGraphVisualizationProps {
  className?: string;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

export const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  className = '',
  height = 600,
  onNodeClick,
  onEdgeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    showDocuments: true,
    showEntities: true,
    showConcepts: true,
    showTopics: true,
    minStrength: 0.3,
    maxNodes: 50
  });
  const [simulation, setSimulation] = useState<any>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sample graph data for demo
  const sampleGraphData: GraphData = {
    nodes: [
      {
        id: 'doc1',
        type: 'document',
        name: 'AI Research Proposal',
        description: 'Machine learning in healthcare',
        properties: { fileType: 'pdf', size: '2.3MB' },
        size: 20,
        color: '#3b82f6'
      },
      {
        id: 'doc2',
        type: 'document',
        name: 'Software Contract',
        description: 'GenieFlow development agreement',
        properties: { fileType: 'docx', size: '850KB' },
        size: 18,
        color: '#3b82f6'
      },
      {
        id: 'entity1',
        type: 'entity',
        name: 'Dr. Sarah Johnson',
        description: 'Healthcare AI researcher',
        properties: { type: 'person', role: 'researcher' },
        size: 15,
        color: '#10b981'
      },
      {
        id: 'entity2',
        type: 'entity',
        name: 'GenieFlow AI',
        description: 'Technology company',
        properties: { type: 'organization', industry: 'technology' },
        size: 16,
        color: '#10b981'
      },
      {
        id: 'concept1',
        type: 'concept',
        name: 'Machine Learning',
        description: 'AI/ML algorithms and techniques',
        properties: { category: 'technology', frequency: 12 },
        size: 14,
        color: '#f59e0b'
      },
      {
        id: 'concept2',
        type: 'concept',
        name: 'Healthcare',
        description: 'Medical and health-related topics',
        properties: { category: 'domain', frequency: 8 },
        size: 12,
        color: '#f59e0b'
      },
      {
        id: 'topic1',
        type: 'topic',
        name: 'AI Ethics',
        description: 'Ethical considerations in AI',
        properties: { importance: 'high', mentions: 5 },
        size: 10,
        color: '#8b5cf6'
      },
      {
        id: 'topic2',
        type: 'topic',
        name: 'Data Privacy',
        description: 'Privacy and security concerns',
        properties: { importance: 'high', mentions: 7 },
        size: 11,
        color: '#8b5cf6'
      }
    ],
    edges: [
      {
        id: 'edge1',
        source: 'doc1',
        target: 'entity1',
        type: 'authored_by',
        strength: 0.9,
        evidence: ['Author field', 'Email signature'],
        metadata: { confidence: 0.95 }
      },
      {
        id: 'edge2',
        source: 'doc1',
        target: 'concept1',
        type: 'discusses',
        strength: 0.8,
        evidence: ['Title', 'Abstract', 'Keywords'],
        metadata: { confidence: 0.85 }
      },
      {
        id: 'edge3',
        source: 'doc1',
        target: 'concept2',
        type: 'applies_to',
        strength: 0.7,
        evidence: ['Domain context', 'Use cases'],
        metadata: { confidence: 0.78 }
      },
      {
        id: 'edge4',
        source: 'doc2',
        target: 'entity2',
        type: 'involves',
        strength: 0.95,
        evidence: ['Contract parties', 'Signatures'],
        metadata: { confidence: 0.98 }
      },
      {
        id: 'edge5',
        source: 'concept1',
        target: 'topic1',
        type: 'relates_to',
        strength: 0.6,
        evidence: ['Content analysis', 'Semantic similarity'],
        metadata: { confidence: 0.65 }
      },
      {
        id: 'edge6',
        source: 'concept2',
        target: 'topic2',
        type: 'involves',
        strength: 0.7,
        evidence: ['Regulatory mentions', 'Privacy policies'],
        metadata: { confidence: 0.72 }
      }
    ]
  };

  useEffect(() => {
    // Load sample data for demo
    setGraphData(sampleGraphData);
  }, []);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    // Initialize D3 force simulation (simplified implementation)
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Create simulation with forces
    const sim = {
      nodes: [...graphData.nodes],
      links: graphData.edges.map(edge => ({
        ...edge,
        source: graphData.nodes.find(n => n.id === edge.source),
        target: graphData.nodes.find(n => n.id === edge.target)
      })),
      alpha: 1,
      tick: () => {
        // Simple physics simulation
        sim.nodes.forEach(node => {
          // Apply center force
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = centerX - (node.x || 0);
          const dy = centerY - (node.y || 0);
          node.vx = (node.vx || 0) + dx * 0.001;
          node.vy = (node.vy || 0) + dy * 0.001;
          
          // Apply repulsion force
          sim.nodes.forEach(other => {
            if (other.id !== node.id) {
              const dx = (node.x || 0) - (other.x || 0);
              const dy = (node.y || 0) - (other.y || 0);
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = 100 / (distance * distance);
              node.vx = (node.vx || 0) + dx * force;
              node.vy = (node.vy || 0) + dy * force;
            }
          });
          
          // Apply link forces
          sim.links.forEach(link => {
            if (link.source?.id === node.id || link.target?.id === node.id) {
              const other = link.source?.id === node.id ? link.target : link.source;
              if (other) {
                const dx = (other.x || 0) - (node.x || 0);
                const dy = (other.y || 0) - (node.y || 0);
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const targetDistance = 100;
                const force = (distance - targetDistance) * 0.1 * link.strength;
                node.vx = (node.vx || 0) + dx * force / distance;
                node.vy = (node.vy || 0) + dy * force / distance;
              }
            }
          });
          
          // Update position
          node.vx = (node.vx || 0) * 0.95; // Friction
          node.vy = (node.vy || 0) * 0.95;
          node.x = (node.x || centerX) + (node.vx || 0);
          node.y = (node.y || centerY) + (node.vy || 0);
          
          // Boundary constraints
          node.x = Math.max(node.size, Math.min(width - node.size, node.x));
          node.y = Math.max(node.size, Math.min(height - node.size, node.y));
        });
        
        renderGraph();
        sim.alpha *= 0.99; // Decay
      }
    };

    // Initialize node positions
    sim.nodes.forEach((node, i) => {
      const angle = (i / sim.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 4;
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
      node.vx = 0;
      node.vy = 0;
    });

    setSimulation(sim);

    const animate = () => {
      if (sim.alpha > 0.01 && isSimulationRunning) {
        sim.tick();
        requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      sim.alpha = 0;
    };
  }, [graphData, isSimulationRunning]);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !simulation) return;

    const svg = svgRef.current;
    
    // Clear previous render
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Create SVG elements
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Add gradient definitions
    const gradients = ['documents', 'entities', 'concepts', 'topics'].map(type => {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradient.setAttribute('id', `gradient-${type}`);
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(255,255,255,0.3)');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', 'rgba(0,0,0,0.1)');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      return gradient;
    });
    
    gradients.forEach(g => defs.appendChild(g));
    svg.appendChild(defs);

    // Render edges
    simulation.links.forEach((link: any) => {
      if (!link.source || !link.target) return;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', link.source.x?.toString() || '0');
      line.setAttribute('y1', link.source.y?.toString() || '0');
      line.setAttribute('x2', link.target.x?.toString() || '0');
      line.setAttribute('y2', link.target.y?.toString() || '0');
      line.setAttribute('stroke', '#6b7280');
      line.setAttribute('stroke-width', (link.strength * 3).toString());
      line.setAttribute('stroke-opacity', '0.6');
      line.style.cursor = 'pointer';
      
      line.addEventListener('click', () => {
        setSelectedEdge(link);
        onEdgeClick?.(link);
      });
      
      svg.appendChild(line);
    });

    // Render nodes
    simulation.nodes.forEach((node: GraphNode) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
      group.style.cursor = 'pointer';
      
      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.size.toString());
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');
      
      if (selectedNode?.id === node.id) {
        circle.setAttribute('stroke', '#f59e0b');
        circle.setAttribute('stroke-width', '3');
      }
      
      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', (node.size + 15).toString());
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '500');
      text.setAttribute('fill', '#374151');
      text.textContent = node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
      
      group.appendChild(circle);
      group.appendChild(text);
      
      group.addEventListener('click', () => {
        setSelectedNode(node);
        onNodeClick?.(node);
      });
      
      svg.appendChild(group);
    });
  }, [simulation, selectedNode, selectedEdge, onNodeClick, onEdgeClick]);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setGraphData(sampleGraphData);
      return;
    }

    const filteredNodes = sampleGraphData.nodes.filter(node =>
      node.name.toLowerCase().includes(query.toLowerCase()) ||
      node.description?.toLowerCase().includes(query.toLowerCase())
    );

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = sampleGraphData.edges.filter(edge =>
      filteredNodeIds.has(edge.source) || filteredNodeIds.has(edge.target)
    );

    setGraphData({ nodes: filteredNodes, edges: filteredEdges });
  }, []);

  const resetGraph = () => {
    setGraphData(sampleGraphData);
    setSelectedNode(null);
    setSelectedEdge(null);
    setSearchQuery('');
  };

  const toggleSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning);
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'entity': return <User className="h-4 w-4" />;
      case 'concept': return <Brain className="h-4 w-4" />;
      case 'topic': return <Tag className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const nodeTypeStats = {
    documents: graphData.nodes.filter(n => n.type === 'document').length,
    entities: graphData.nodes.filter(n => n.type === 'entity').length,
    concepts: graphData.nodes.filter(n => n.type === 'concept').length,
    topics: graphData.nodes.filter(n => n.type === 'topic').length,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="h-6 w-6 text-primary" />
              <CardTitle>Knowledge Graph</CardTitle>
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSimulation}
              >
                {isSimulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isSimulationRunning ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetGraph}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes and relationships..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-500">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">{nodeTypeStats.documents}</span>
              </div>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-green-500">
                <User className="h-4 w-4" />
                <span className="font-semibold">{nodeTypeStats.entities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Entities</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-yellow-500">
                <Brain className="h-4 w-4" />
                <span className="font-semibold">{nodeTypeStats.concepts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Concepts</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-purple-500">
                <Tag className="h-4 w-4" />
                <span className="font-semibold">{nodeTypeStats.topics}</span>
              </div>
              <p className="text-xs text-muted-foreground">Topics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Visualization */}
      <div className="flex gap-6">
        <div className="flex-1">
          <Card>
            <CardContent className="p-0">
              <div 
                ref={containerRef}
                className="relative overflow-hidden"
                style={{ height: `${height}px` }}
              >
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  className="border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
                >
                  {/* Graph will be rendered here */}
                </svg>
                
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Building knowledge graph...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Graph Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="nodes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="nodes">Nodes</TabsTrigger>
                  <TabsTrigger value="edges">Edges</TabsTrigger>
                </TabsList>
                
                <TabsContent value="nodes" className="space-y-3">
                  {selectedNode ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {getNodeTypeIcon(selectedNode.type)}
                        <h4 className="font-medium">{selectedNode.name}</h4>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.description}
                      </p>
                      
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedNode.type}
                        </Badge>
                        
                        {Object.entries(selectedNode.properties).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Link className="h-3 w-3 mr-1" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Click on a node to see details
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="edges" className="space-y-3">
                  {selectedEdge ? (
                    <div className="space-y-3">
                      <h4 className="font-medium">{selectedEdge.type}</h4>
                      
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">Strength:</span>
                          <Badge variant="outline">
                            {(selectedEdge.strength * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Evidence:</span>
                        {selectedEdge.evidence.map((evidence, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {evidence}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Click on an edge to see details
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 