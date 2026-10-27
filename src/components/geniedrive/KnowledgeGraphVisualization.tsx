/**
 * Sovereign Knowledge Graph Visualization Component (Obsidian Vault Brain)
 * 
 * Interactive force-directed visualization of California Workers' Compensation
 * precedents, Labor Code statutes, medical provider liens, active client dossiers,
 * and Business Operations workflows.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Network,
  FileText,
  User,
  Scale,
  Building,
  Tag,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter,
  RotateCcw,
  Play,
  Pause,
  Brain,
  Sparkles,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  Briefcase
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

export interface GraphNode {
  id: string;
  type: 'precedent' | 'statute' | 'client' | 'lien' | 'operations';
  name: string;
  citation?: string;
  description?: string;
  properties: Record<string, any>;
  size: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  evidence: string[];
  metadata?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface KnowledgeGraphVisualizationProps {
  className?: string;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

// Grounded Ground-Truth Knowledge Nodes from Vault
const SOVEREIGN_VAULT_GRAPH: GraphData = {
  nodes: [
    // Precedents (Obsidian Purple)
    {
      id: 'case-navarro',
      type: 'precedent',
      name: 'Navarro v. City of Montebello',
      citation: '(2014) 79 CCC 418 (WCAB En Banc)',
      description: 'PTP selection rights under LC § 4600 and 8 CCR § 9785; invalidity of employer panel restriction without notice.',
      properties: { year: 2014, venue: 'WCAB En Banc', impact: 'High', category: 'Medical Treatment / Panel Selection' },
      size: 22,
      color: '#a855f7'
    },
    {
      id: 'case-escobedo',
      type: 'precedent',
      name: 'Escobedo v. Marshalls',
      citation: '(2005) 70 CCC 604 (WCAB En Banc)',
      description: 'Substantial medical evidence requirement for apportionment under LC § 4663 and § 4664; physician must articulate mechanics of causation.',
      properties: { year: 2005, venue: 'WCAB En Banc', impact: 'Landmark', category: 'Apportionment / PDRS' },
      size: 24,
      color: '#a855f7'
    },
    {
      id: 'case-beverly-hills',
      type: 'precedent',
      name: 'Beverly Hills Multispecialty v. WCAB',
      citation: '(1994) 26 Cal.App.4th 789',
      description: 'C&R settlement between applicant and defense does not extinguish lien claimant rights without notice and due process hearing.',
      properties: { year: 1994, venue: 'California Court of Appeal', impact: 'Critical', category: 'Lien Rights & Due Process' },
      size: 22,
      color: '#a855f7'
    },
    {
      id: 'case-batten',
      type: 'precedent',
      name: 'Batten v. WCAB',
      citation: '(2015) 241 Cal.App.4th 1009',
      description: 'Admissibility of forensic records, pre-trial evidentiary closures, and post-DOR discovery enforcement.',
      properties: { year: 2015, venue: 'California Court of Appeal', impact: 'High', category: 'Discovery / Evidence' },
      size: 20,
      color: '#a855f7'
    },
    {
      id: 'case-howell',
      type: 'precedent',
      name: 'Howell v. Hamilton Meats & Provisions',
      citation: '(2011) 52 Cal.4th 541',
      description: 'Recovery for past medical expenses limited to amounts actually paid or accepted as payment in full, segregating billed vs paid damages.',
      properties: { year: 2011, venue: 'California Supreme Court', impact: 'Landmark', category: 'Economic Special Damages' },
      size: 22,
      color: '#a855f7'
    },

    // Statutes & Regulations (Emerald Green)
    {
      id: 'stat-lc-4622',
      type: 'statute',
      name: 'Labor Code § 4622',
      citation: 'Cal. Lab. Code § 4622',
      description: 'Mandatory 60-day payment clock on medical-legal bills; automatic 10% penalty plus 7% annual statutory interest from date bill received.',
      properties: { type: 'Statute', jurisdiction: 'California', penaltyRate: '10% + 7% APR', clockDays: 60 },
      size: 26,
      color: '#10b981'
    },
    {
      id: 'stat-lc-4600',
      type: 'statute',
      name: 'Labor Code § 4600',
      citation: 'Cal. Lab. Code § 4600',
      description: 'Employer absolute statutory duty to provide medical, surgical, chiropractic, and hospital treatment reasonably required to cure or relieve.',
      properties: { type: 'Statute', jurisdiction: 'California', category: 'Medical Treatment' },
      size: 22,
      color: '#10b981'
    },
    {
      id: 'stat-lc-5814',
      type: 'statute',
      name: 'Labor Code § 5814',
      citation: 'Cal. Lab. Code § 5814',
      description: 'Penalty for unreasonable delay or refusal of compensation: up to 25% of amount delayed or $10,000, whichever is less.',
      properties: { type: 'Statute', jurisdiction: 'California', penaltyMax: '$10,000 / 25%' },
      size: 20,
      color: '#10b981'
    },
    {
      id: 'stat-8ccr-10786',
      type: 'statute',
      name: '8 CCR § 10786',
      citation: '8 Cal. Code Regs. § 10786',
      description: 'Lien claimant right to petition for costs and sanctions upon bad faith delay or frivolous defense objections.',
      properties: { type: 'Regulation', jurisdiction: 'California DWC', category: 'Lien Litigation' },
      size: 18,
      color: '#10b981'
    },
    {
      id: 'stat-ccp-2030',
      type: 'statute',
      name: 'CCP § 2030.300',
      citation: 'Cal. Code Civ. Proc. § 2030.300',
      description: 'Civil Discovery Act: 45-day jurisdictional deadline to move to compel further responses to interrogatories after verification.',
      properties: { type: 'Statute', jurisdiction: 'California Superior Court', deadlineDays: 45 },
      size: 18,
      color: '#10b981'
    },

    // Client Dossiers (Sovereign Blue)
    {
      id: 'client-allen',
      type: 'client',
      name: 'Robert Allen',
      citation: 'ADJ1234567 (Santa Ana)',
      description: 'Injured worker matter involving unpaid orthopedic med-legal bills, DOR filed, accrued statutory penalties under LC § 4622.',
      properties: { adj: 'ADJ1234567', venue: 'Santa Ana', status: 'DOR Pending', accruedPenalties: '$14,250.00' },
      size: 22,
      color: '#3b82f6'
    },
    {
      id: 'client-chavez',
      type: 'client',
      name: 'Frank Chavez',
      citation: 'ADJ9876543 (Van Nuys)',
      description: 'Cumulative trauma AOE/COE litigation, spine & orthopedic trauma, dispute over employer PTP panel compliance.',
      properties: { adj: 'ADJ9876543', venue: 'Van Nuys', status: 'Trial Preparation', bodyParts: 'Lumbar, Cervical' },
      size: 20,
      color: '#3b82f6'
    },
    {
      id: 'client-hernandez',
      type: 'client',
      name: 'Maria Hernandez',
      citation: 'ADJ1122334 (Los Angeles)',
      description: 'Petition for replacement PQME panel under LC § 4062.2 following untimely defense strike and ex parte communication.',
      properties: { adj: 'ADJ1122334', venue: 'Los Angeles', status: 'Panel Replacement Petition', qmeSpecialty: 'Orthopedics' },
      size: 18,
      color: '#3b82f6'
    },

    // Medical Providers & Liens (Amber Gold)
    {
      id: 'lien-medland',
      type: 'lien',
      name: 'Medland Medical Tustin',
      citation: 'UAN: MEDLAND-92780',
      description: 'Primary treating clinic and physical therapy provider; outstanding treatment and med-legal accounts receivable.',
      properties: { totalBalance: '$48,920.00', specialty: 'Physical Medicine & Ortho', location: 'Tustin, CA' },
      size: 22,
      color: '#f59e0b'
    },
    {
      id: 'lien-spectrum',
      type: 'lien',
      name: 'Spectrum Medical Group',
      citation: 'UAN: SPECTRUM-92868',
      description: 'Comprehensive diagnostic imaging, MRI evaluations, and PR-2 progress reporting ledger.',
      properties: { totalBalance: '$24,150.00', specialty: 'Diagnostic Imaging / MRI', location: 'Orange, CA' },
      size: 18,
      color: '#f59e0b'
    },
    {
      id: 'lien-rms',
      type: 'lien',
      name: 'RMS Medical Group',
      citation: 'UAN: RMS-90017',
      description: 'Medical-legal reporting specialist enforcing 60-day reimbursement and interest under LC § 4622.',
      properties: { totalBalance: '$31,400.00', specialty: 'Qualified Med-Legal Reporting', location: 'Los Angeles, CA' },
      size: 18,
      color: '#f59e0b'
    },

    // Business Operations & Sovereign Cortex (Rose Pink)
    {
      id: 'ops-cos',
      type: 'operations',
      name: 'Chief of Staff',
      citation: 'Executive Task Stream',
      description: 'Decomposes macro legal initiatives into atomic departmental workflows for specialized sub-agents.',
      properties: { role: 'Executive Orchestrator', status: 'Active', latency: 'Zero-Lag' },
      size: 20,
      color: '#ec4899'
    },
    {
      id: 'ops-gatekeeper',
      type: 'operations',
      name: 'Gatekeeper QA Enforcer',
      citation: 'Zero-Placeholder Standard',
      description: 'Rigorous binary pass/fail verification enforcing verbatim citations, zero brackets, and PHI privacy firewalls.',
      properties: { standard: 'Zero-Sanction Audit', status: 'Guarding' },
      size: 20,
      color: '#ec4899'
    },
    {
      id: 'ops-scribe',
      type: 'operations',
      name: 'Institutional Scribe Vault',
      citation: 'Sovereign Fabric Markdown',
      description: 'Anchors winning litigation playbooks, client fact sheets, and executive decisions directly to the persistent Obsidian vault.',
      properties: { vaultPath: 'knowledge/vault', format: 'Markdown + YAML' },
      size: 20,
      color: '#ec4899'
    }
  ],
  edges: [
    // Precedent & Statute Grounding
    { id: 'e-1', source: 'client-allen', target: 'stat-lc-4622', type: 'enforces_statute', strength: 0.95, evidence: ['60-day billing notice', 'Penalty petition draft'] },
    { id: 'e-2', source: 'client-allen', target: 'lien-medland', type: 'treated_by', strength: 0.9, evidence: ['DFR progress report', 'AOB assignment'] },
    { id: 'e-3', source: 'lien-medland', target: 'stat-lc-4622', type: 'billing_clock', strength: 0.98, evidence: ['Jopari 277 Electronic EOR', 'daisyBill ledger'] },
    { id: 'e-4', source: 'stat-lc-4622', target: 'case-beverly-hills', type: 'governed_by', strength: 0.88, evidence: ['En banc non-extinguishment doctrine'] },
    
    { id: 'e-5', source: 'client-chavez', target: 'case-escobedo', type: 'apportionment_standard', strength: 0.85, evidence: ['AME cross-examination questions'] },
    { id: 'e-6', source: 'client-chavez', target: 'stat-lc-4600', type: 'treatment_mandate', strength: 0.92, evidence: ['PTP designation letter'] },
    { id: 'e-7', source: 'client-chavez', target: 'case-navarro', type: 'panel_selection_rights', strength: 0.9, evidence: ['Notice defect objection'] },

    { id: 'e-8', source: 'client-hernandez', target: 'case-batten', type: 'discovery_preclusion', strength: 0.82, evidence: ['Post-DOR evidence objection'] },
    { id: 'e-9', source: 'lien-spectrum', target: 'stat-8ccr-10786', type: 'petition_for_costs', strength: 0.78, evidence: ['Bad faith delay declaration'] },
    { id: 'e-10', source: 'lien-rms', target: 'stat-lc-4622', type: 'interest_accrual', strength: 0.95, evidence: ['Itemized ledger audit'] },
    { id: 'e-11', source: 'case-howell', target: 'stat-ccp-2030', type: 'special_damages_segregation', strength: 0.75, evidence: ['Billing vs paid damages motion'] },

    // Business Operations Connections
    { id: 'e-12', source: 'ops-cos', target: 'client-allen', type: 'orchestrates_matter', strength: 0.8, evidence: ['Action Memo dispatched'] },
    { id: 'e-13', source: 'client-allen', target: 'ops-gatekeeper', type: 'audit_validation', strength: 0.9, evidence: ['Zero-Placeholder stamp'] },
    { id: 'e-14', source: 'ops-gatekeeper', target: 'ops-scribe', type: 'anchors_approved_brief', strength: 0.95, evidence: ['Sovereign Fabric Vault update'] }
  ]
};

export const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  className = '',
  height = 620,
  onNodeClick,
  onEdgeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [graphData, setGraphData] = useState<GraphData>(SOVEREIGN_VAULT_GRAPH);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(SOVEREIGN_VAULT_GRAPH.nodes[0]);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [injectedNotification, setInjectedNotification] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter nodes based on category and search
  const handleFilter = useCallback((category: string, query: string) => {
    let nodes = SOVEREIGN_VAULT_GRAPH.nodes;

    if (category !== 'all') {
      nodes = nodes.filter(n => n.type === category);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      nodes = nodes.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.citation?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = SOVEREIGN_VAULT_GRAPH.edges.filter(e =>
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    setGraphData({ nodes, edges });
  }, []);

  // Force-directed positioning simulation
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 700;
    const simHeight = height;

    // Initialize node positions in a circular layout
    const nodes = graphData.nodes.map((node, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, simHeight) * 0.32;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: simHeight / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    // Run simple spring simulation
    let alpha = 1.0;
    const interval = setInterval(() => {
      if (!isSimulationRunning || alpha < 0.02) {
        clearInterval(interval);
        return;
      }

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x! - nodes[i].x!;
          const dy = nodes[j].y! - nodes[i].y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = ((180 - dist) / dist) * 0.45 * alpha;
            nodes[i].x! -= dx * force;
            nodes[i].y! -= dy * force;
            nodes[j].x! += dx * force;
            nodes[j].y! += dy * force;
          }
        }
      }

      // Attraction along edges
      graphData.edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 120;
          const force = ((dist - targetDist) / dist) * 0.08 * edge.strength * alpha;
          source.x! += dx * force;
          source.y! += dy * force;
          target.x! -= dx * force;
          target.y! -= dy * force;
        }
      });

      // Keep within bounds
      nodes.forEach(n => {
        n.x = Math.max(n.size + 20, Math.min(width - n.size - 20, n.x!));
        n.y = Math.max(n.size + 20, Math.min(simHeight - n.size - 20, n.y!));
      });

      alpha *= 0.96;
      renderSvg(nodes);
    }, 30);

    return () => clearInterval(interval);
  }, [graphData, isSimulationRunning, height]);

  // Render SVG nodes and edges
  const renderSvg = (nodes: (GraphNode & { x?: number; y?: number })[]) => {
    const svg = svgRef.current;
    if (!svg) return;

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Render Edges
    graphData.edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (source.x || 0).toString());
      line.setAttribute('y1', (source.y || 0).toString());
      line.setAttribute('x2', (target.x || 0).toString());
      line.setAttribute('y2', (target.y || 0).toString());
      line.setAttribute('stroke', '#475569');
      line.setAttribute('stroke-width', (edge.strength * 2.2).toString());
      line.setAttribute('stroke-opacity', '0.55');
      line.setAttribute('stroke-dasharray', edge.strength < 0.8 ? '3,3' : 'none');
      line.style.cursor = 'pointer';

      line.addEventListener('click', () => {
        setSelectedEdge(edge);
        onEdgeClick?.(edge);
      });

      svg.appendChild(line);
    });

    // Render Nodes
    nodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
      group.style.cursor = 'pointer';

      // Outer Glow Halo for Selected Node
      if (selectedNode?.id === node.id) {
        const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        halo.setAttribute('r', (node.size + 7).toString());
        halo.setAttribute('fill', 'none');
        halo.setAttribute('stroke', node.color);
        halo.setAttribute('stroke-width', '2.5');
        halo.setAttribute('stroke-opacity', '0.85');
        halo.setAttribute('class', 'animate-pulse');
        group.appendChild(halo);
      }

      // Core Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.size.toString());
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');

      // Label Text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', (node.size + 14).toString());
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('paint-order', 'stroke');
      text.setAttribute('stroke', '#0f172a');
      text.setAttribute('stroke-width', '3');
      text.setAttribute('stroke-linejoin', 'round');
      text.textContent = node.name.length > 18 ? node.name.substring(0, 18) + '…' : node.name;

      group.appendChild(circle);
      group.appendChild(text);

      group.addEventListener('click', () => {
        setSelectedNode(node);
        onNodeClick?.(node);
      });

      svg.appendChild(group);
    });
  };

  const handleCopyCitation = () => {
    if (!selectedNode) return;
    const text = selectedNode.citation
      ? `[[${selectedNode.name}]] (${selectedNode.citation})`
      : `[[${selectedNode.name}]]`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleInjectPrompt = () => {
    if (!selectedNode) return;
    const wikilink = `[[${selectedNode.name}]]`;
    window.dispatchEvent(new CustomEvent('genieflow:inject-prompt', { detail: wikilink }));
    setInjectedNotification(true);
    setTimeout(() => setInjectedNotification(false), 2000);
  };

  const handleAttachEvidence = () => {
    if (!selectedNode) return;
    const summary = `### Vault Authority: [[${selectedNode.name}]]\n**Citation**: ${selectedNode.citation || 'N/A'}\n**Analysis**: ${selectedNode.description}\n\n`;
    window.dispatchEvent(new CustomEvent('genieflow:attach-evidence', { detail: summary }));
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
      {/* Top Controls Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Sovereign Knowledge Graph</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Obsidian Vault Brain
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Interactive bidirectional citation topology</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vault authorities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilter(activeCategory, e.target.value);
            }}
            className="w-full pl-8 pr-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            className="h-7 px-2 text-xs bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
          >
            {isSimulationRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isSimulationRunning ? 'Freeze' : 'Float'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setGraphData(SOVEREIGN_VAULT_GRAPH);
            }}
            className="h-7 px-2 text-xs bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 bg-slate-900/50 border-b border-slate-800/80 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'All Vault Entities', count: SOVEREIGN_VAULT_GRAPH.nodes.length },
          { id: 'precedent', label: 'Landmark Precedents', count: 5, color: 'text-purple-400' },
          { id: 'statute', label: 'Labor Codes & Rules', count: 5, color: 'text-emerald-400' },
          { id: 'client', label: 'Client Dossiers (ADJ)', count: 3, color: 'text-blue-400' },
          { id: 'lien', label: 'Medical Liens & Providers', count: 3, color: 'text-amber-400' },
          { id: 'operations', label: 'Business Ops Agents', count: 3, color: 'text-pink-400' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              handleFilter(cat.id, searchQuery);
            }}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className={cat.color}>{cat.label}</span>
            <span className="opacity-60 text-[10px]">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Main Graph Canvas and Inspector Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* SVG Force Canvas */}
        <div ref={containerRef} className="flex-1 relative bg-slate-950 overflow-hidden min-h-[380px]">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="w-full h-full"
            style={{ minHeight: `${height - 120}px` }}
          />

          {/* Canvas Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-xs text-[10px] text-slate-300">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Precedents</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Statutes</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Clients</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Liens</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" /> Ops</div>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 flex flex-col justify-between p-4 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold tracking-wider"
                  style={{ borderColor: selectedNode.color, color: selectedNode.color }}
                >
                  {selectedNode.type}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{selectedNode.name}</span>
                </h4>
                {selectedNode.citation && (
                  <p className="text-xs text-purple-300 font-mono mt-0.5">{selectedNode.citation}</p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                {selectedNode.description}
              </div>

              {/* Properties Grid */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vault Properties</div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  {Object.entries(selectedNode.properties).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-slate-200 font-mono font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Edges */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bidirectional Links ({graphData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {graphData.edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map(edge => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const other = SOVEREIGN_VAULT_GRAPH.nodes.find(n => n.id === otherId);
                      return (
                        <div
                          key={edge.id}
                          onClick={() => other && setSelectedNode(other)}
                          className="p-1.5 rounded-md bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-xs flex items-center justify-between cursor-pointer transition"
                        >
                          <span className="text-purple-300 font-medium truncate max-w-[170px]">
                            [[{other?.name || otherId}]]
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{edge.type}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
              <Network className="w-8 h-8 text-slate-600" />
              <p className="text-xs">Click any node to inspect citations, backlinks, and evidence</p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedNode && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Button
                onClick={handleCopyCitation}
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 flex items-center justify-center gap-1.5"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotification ? 'Citation Copied!' : 'Copy [[Wikilink]]'}</span>
              </Button>

              <Button
                onClick={handleInjectPrompt}
                size="sm"
                className="w-full text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5"
              >
                {injectedNotification ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{injectedNotification ? 'Injected into Chat!' : 'Inject into Prompt Bar'}</span>
              </Button>

              <Button
                onClick={handleAttachEvidence}
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attach to Evidence Context</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};