import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react';
import { WorkflowItem, getWorkflowsForDomain, deleteCustomWorkflow } from './workflowData';

interface DynamicWorkflowCarouselProps {
  onSelectWorkflow: (workflow: WorkflowItem) => void;
  onOpenNewModal: () => void;
  selectedWorkflowId?: string;
  activeDomainType?: string;
}

export const DynamicWorkflowCarousel: React.FC<DynamicWorkflowCarouselProps> = ({
  onSelectWorkflow,
  onOpenNewModal,
  selectedWorkflowId,
  activeDomainType = 'legal'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    setWorkflows(getWorkflowsForDomain(activeDomainType));
    setActiveCategory('all');
  }, [activeDomainType]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    workflows.forEach(w => {
      if (w.category) cats.add(w.category);
    });
    return ['all', ...Array.from(cats)];
  }, [workflows]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomWorkflow(id);
    setWorkflows(getWorkflowsForDomain(activeDomainType));
  };

  const filteredWorkflows = activeCategory === 'all'
    ? workflows
    : workflows.filter(w => w.category === activeCategory || (activeCategory === 'custom' && w.isCustom));

  return (
    <div className="shrink-0 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 px-3 py-1.5 transition">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Workflows & Actions
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            {workflows.length}
          </span>
        </div>

        {/* Category Filter Pills & Scroll Arrows */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-0.5 text-[9px]">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer font-medium capitalize ${
                  activeCategory === cat
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Pills Carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5"
      >
        {/* "+ New Workflow" Action Pill */}
        <button
          type="button"
          onClick={onOpenNewModal}
          className="shrink-0 h-6 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition cursor-pointer group"
          title="Create & Pin Custom Workflow"
        >
          <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-200" />
          <span>New Workflow</span>
        </button>

        {/* Rendered Workflow Pills */}
        {filteredWorkflows.map((wf) => {
          const isSelected = selectedWorkflowId === wf.id;
          return (
            <div
              key={wf.id}
              onClick={() => onSelectWorkflow(wf)}
              className={`shrink-0 group relative h-6 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer select-none border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
              title={wf.description}
            >
              <span className="text-xs leading-none">{wf.icon}</span>
              <span className="truncate max-w-[160px]">{wf.title}</span>

              {wf.isCustom && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, wf.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 ml-0.5 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Delete Custom Workflow"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
