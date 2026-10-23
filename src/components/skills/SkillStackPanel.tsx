/**
 * 🎒 SkillStackPanel
 * ==================
 * The visual "Connected Skills" panel — exactly like Claude Desktop's MCP tools list.
 * Shows all currently loaded .gpack skills, their active tools, and lets users
 * toggle packs on/off or remove them without uninstalling.
 *
 * Used in: WorkspaceChatPanel sidebar, CreatorDashboard, Settings
 */
import React, { useState, useEffect } from 'react';
import { skillStack, LoadedSkill, gpackService } from '../../services/GpackService';
import { Package, Zap, Pause, Play, Trash2, ChevronDown, ChevronRight, Shield, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface SkillStackPanelProps {
  compact?: boolean; // compact mode for workspace sidebar
}

export const SkillStackPanel: React.FC<SkillStackPanelProps> = ({ compact = false }) => {
  const [skills, setSkills] = useState<LoadedSkill[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const refresh = () => setSkills(skillStack.getStack());

  useEffect(() => {
    refresh();
    // Poll every 2s for new installs
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, []);

  const totalTools = skills.reduce((sum, s) => sum + (s.status === 'active' ? s.tools.length : 0), 0);

  const togglePack = (slug: string, currentStatus: string) => {
    const active = currentStatus !== 'active';
    skillStack.togglePack(slug, active);
    toast.success(`${active ? 'Activated' : 'Paused'} skill pack`);
    refresh();
  };

  const removePack = async (skill: LoadedSkill) => {
    if (!confirm(`Remove "${skill.packName}" from your skill stack?`)) return;
    await gpackService.uninstallPack(skill.slug);
    refresh();
  };

  const toggleExpand = (slug: string) => {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  if (compact) {
    return (
      <div className="skill-stack-compact">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Active Skills
          </span>
          <span className="ml-auto text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-mono">
            {totalTools}
          </span>
        </div>
        <div className="p-2 space-y-1">
          {skills.length === 0 && (
            <p className="text-xs text-white/30 text-center py-3">No skills loaded</p>
          )}
          {skills.map(skill => (
            <div
              key={skill.slug}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                skill.status === 'active'
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'bg-white/5 border border-white/5 opacity-50'
              }`}
            >
              <Package className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span className="text-xs text-white/80 truncate flex-1">{skill.packName}</span>
              <span className="text-xs text-white/40 font-mono">{skill.tools.length}t</span>
            </div>
          ))}
          {skills.length > 0 && (
            <button
              onClick={() => navigate('/assistant-store')}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Add skills
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="skill-stack-panel bg-[#0d0d1a] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Active Skill Stack</h3>
          <p className="text-xs text-white/40">
            {skills.filter(s => s.status === 'active').length} packs · {totalTools} tools loaded
          </p>
        </div>
        <button
          onClick={() => navigate('/assistant-store')}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-all border border-violet-500/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Pack
        </button>
      </div>

      {/* Empty State */}
      {skills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-violet-400/50" />
          </div>
          <p className="text-sm text-white/50 mb-1">No skills loaded</p>
          <p className="text-xs text-white/30 mb-4">
            Install skill packs from the marketplace to give your AI superpowers
          </p>
          <button
            onClick={() => navigate('/assistant-store')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-all"
          >
            Browse Marketplace
          </button>
        </div>
      )}

      {/* Skill List */}
      <div className="divide-y divide-white/5">
        {skills.map(skill => (
          <div key={skill.slug} className={`transition-all ${skill.status !== 'active' ? 'opacity-50' : ''}`}>
            {/* Pack Header */}
            <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
              <button
                onClick={() => toggleExpand(skill.slug)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {expanded[skill.slug]
                  ? <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                }
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{skill.packName}</span>
                    <span className="flex-shrink-0 text-xs bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">
                      v{skill.manifest.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Shield className="w-3 h-3 text-green-400/70" />
                    <span className="text-xs text-white/40">
                      {skill.tools.length} tools · {skill.manifest.category}
                    </span>
                  </div>
                </div>
              </button>

              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                skill.status === 'active' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-white/20'
              }`} />

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePack(skill.slug, skill.status)}
                  title={skill.status === 'active' ? 'Pause pack' : 'Activate pack'}
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
                >
                  {skill.status === 'active'
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5" />
                  }
                </button>
                <button
                  onClick={() => removePack(skill)}
                  title="Remove pack"
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded tool list */}
            {expanded[skill.slug] && (
              <div className="px-5 pb-3 bg-black/20">
                <div className="pl-6 space-y-1 border-l border-violet-500/20">
                  {skill.tools.map(tool => (
                    <div key={tool.name} className="flex items-start gap-2 py-1.5">
                      <Zap className="w-3 h-3 text-violet-400/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <code className="text-xs text-violet-300 font-mono">
                          {skill.slug}.{tool.name}()
                        </code>
                        <p className="text-xs text-white/40 mt-0.5">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                  {skill.tools.length === 0 && (
                    <p className="text-xs text-white/30 py-2">No public tools in this pack</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillStackPanel;
