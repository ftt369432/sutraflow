import React, { useState } from 'react';
import { 
  FolderOpen, Star, Clock, Trash, Brain, 
  Image as ImageIcon, 
  FileText, FileArchive, 
  Film, Music, Code as CodeIcon,
  Tag, Database, BarChart3, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument } from '../../types/ai';

interface KnowledgeBaseSidebarProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  viewFilters: {
    vectored?: boolean;
    hasAISummary?: boolean;
    starred?: boolean;
    recentlyAdded?: boolean;
    documentTypes?: string[];
  };
  onViewFiltersChange: (filters: any) => void;
}

// Define document type groups
const DOCUMENT_TYPE_GROUPS = {
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
  PRESENTATIONS: ['ppt', 'pptx', 'odp'],
  SPREADSHEETS: ['xls', 'xlsx', 'csv', 'ods'],
  CODE: ['js', 'ts', 'html', 'css', 'json', 'py', 'java'],
  ARCHIVES: ['zip', 'rar', 'tar', 'gz', '7z']
};

export function KnowledgeBaseSidebar({ 
  selectedFolderId,
  onFolderSelect,
  selectedTags,
  onTagsChange,
  viewFilters,
  onViewFiltersChange
}: KnowledgeBaseSidebarProps) {
  
  const { documents, folders, getUniqueTags } = useKnowledgeBaseStore();
  const [expandedSections, setExpandedSections] = useState({
    folders: true,
    tags: true,
    analytics: true,
    categories: true
  });

  // Calculate analytics
  const analytics = React.useMemo(() => {
    const total = documents.length;
    const vectored = documents.filter(doc => doc.embedding).length;
    const withSummary = documents.filter(doc => doc.metadata?.title).length; // Using title as proxy for processed
    const byType = DOCUMENT_TYPE_GROUPS.DOCUMENTS.reduce((acc, type) => {
      acc[type] = documents.filter(doc => doc.type === type).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      vectored,
      vectoredPercentage: total > 0 ? Math.round((vectored / total) * 100) : 0,
      withSummary,
      summaryPercentage: total > 0 ? Math.round((withSummary / total) * 100) : 0,
      byType
    };
  }, [documents]);

  const handleCategoryFilter = (types: string[]) => {
    onViewFiltersChange({
      ...viewFilters,
      documentTypes: viewFilters.documentTypes?.some((t: string) => types.includes(t)) ? [] : types
    });
  };

  const isCategoryActive = (types: string[]): boolean => {
    return viewFilters.documentTypes?.some((t: string) => types.includes(t)) || false;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation item component
  const NavItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false,
    count,
    badge,
    badgeColor = 'blue'
  }: { 
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    count?: number;
    badge?: string;
    badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }) => (
    <button 
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm transition-all duration-200",
        isActive 
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-700" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={onClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <Icon className={cn(
          "h-4 w-4 mr-3 flex-shrink-0", 
          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
        )} />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center space-x-1 ml-2">
        {count !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {count}
          </span>
        )}
        {badge && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-medium",
            badgeColor === 'green' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            badgeColor === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            badgeColor === 'yellow' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            badgeColor === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            badgeColor === 'purple' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          )}>
            {badge}
          </span>
        )}
      </div>
    </button>
  );

  const SectionHeader = ({ 
    title, 
    section, 
    count 
  }: { 
    title: string; 
    section: keyof typeof expandedSections;
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full mb-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 hover:text-gray-700 dark:hover:text-gray-300"
    >
      <span>{title}</span>
      <div className="flex items-center space-x-1">
        {count !== undefined && (
          <span className="text-gray-400">{count}</span>
        )}
        <svg 
          className={cn("h-3 w-3 transition-transform", expandedSections[section] ? "rotate-90" : "")}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex flex-col space-y-2">
      
      {/* Quick Filters */}
      <div className="space-y-1">
        <NavItem
          icon={Brain}
          label="All Knowledge"
          onClick={() => {
            onFolderSelect(null);
            onViewFiltersChange({});
            onTagsChange([]);
          }}
          isActive={!selectedFolderId && Object.keys(viewFilters).length === 0 && selectedTags.length === 0}
          count={documents.length}
        />
        
        <NavItem 
          icon={Zap} 
          label="Vectored Documents" 
          onClick={() => onViewFiltersChange({ ...viewFilters, vectored: !viewFilters.vectored })}
          isActive={!!viewFilters.vectored}
          count={analytics.vectored}
          badge={`${analytics.vectoredPercentage}%`}
          badgeColor={analytics.vectoredPercentage > 80 ? 'green' : analytics.vectoredPercentage > 50 ? 'yellow' : 'red'}
        />
        
        <NavItem 
          icon={CheckCircle2} 
          label="AI Processed" 
          onClick={() => onViewFiltersChange({ ...viewFilters, hasAISummary: !viewFilters.hasAISummary })}
          isActive={!!viewFilters.hasAISummary}
          count={analytics.withSummary}
          badge={`${analytics.summaryPercentage}%`}
          badgeColor={analytics.summaryPercentage > 80 ? 'green' : analytics.summaryPercentage > 50 ? 'yellow' : 'red'}
        />

        <NavItem 
          icon={Star} 
          label="Starred" 
          onClick={() => onViewFiltersChange({ ...viewFilters, starred: !viewFilters.starred })}
          isActive={!!viewFilters.starred}
          count={documents.filter(doc => doc.metadata?.tags?.includes('starred')).length}
        />
        
        <NavItem 
          icon={Clock} 
          label="Recent" 
          onClick={() => onViewFiltersChange({ ...viewFilters, recentlyAdded: !viewFilters.recentlyAdded })}
          isActive={!!viewFilters.recentlyAdded}
          count={documents.filter(doc => {
            const created = new Date(doc.metadata?.date || '');
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return created > dayAgo;
          }).length}
        />
      </div>

      {/* Analytics Section */}
      <div>
        <SectionHeader title="Analytics" section="analytics" />
        {expandedSections.analytics && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Status</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Vectored</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analytics.vectoredPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {analytics.vectoredPercentage}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">AI Summary</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analytics.summaryPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {analytics.summaryPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <SectionHeader title="Folders" section="folders" count={folders.length} />
          {expandedSections.folders && (
            <div className="space-y-1">
              {folders.map(folder => (
                <NavItem
                  key={folder.id}
                  icon={FolderOpen}
                  label={folder.name}
                  onClick={() => onFolderSelect(folder.id)}
                  isActive={selectedFolderId === folder.id}
                  count={documents.filter(doc => doc.folderId === folder.id).length}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Section */}
      <div>
        <SectionHeader title="Categories" section="categories" />
        {expandedSections.categories && (
          <div className="space-y-1">
            <NavItem
              icon={FileText}
              label="Documents"
              onClick={() => handleCategoryFilter(DOCUMENT_TYPE_GROUPS.DOCUMENTS)}
              isActive={isCategoryActive(DOCUMENT_TYPE_GROUPS.DOCUMENTS)}
              count={documents.filter(doc => 
                DOCUMENT_TYPE_GROUPS.DOCUMENTS.includes(doc.type || '')
              ).length}
            />
            <NavItem
              icon={ImageIcon}
              label="Images"
              onClick={() => handleCategoryFilter(DOCUMENT_TYPE_GROUPS.IMAGES)}
              isActive={isCategoryActive(DOCUMENT_TYPE_GROUPS.IMAGES)}
              count={documents.filter(doc => 
                DOCUMENT_TYPE_GROUPS.IMAGES.includes(doc.type || '')
              ).length}
            />
            <NavItem
              icon={CodeIcon}
              label="Code Files"
              onClick={() => handleCategoryFilter(DOCUMENT_TYPE_GROUPS.CODE)}
              isActive={isCategoryActive(DOCUMENT_TYPE_GROUPS.CODE)}
              count={documents.filter(doc => 
                DOCUMENT_TYPE_GROUPS.CODE.includes(doc.type || '')
              ).length}
            />
            <NavItem
              icon={FileArchive}
              label="Archives"
              onClick={() => handleCategoryFilter(DOCUMENT_TYPE_GROUPS.ARCHIVES)}
              isActive={isCategoryActive(DOCUMENT_TYPE_GROUPS.ARCHIVES)}
              count={documents.filter(doc => 
                DOCUMENT_TYPE_GROUPS.ARCHIVES.includes(doc.type || '')
              ).length}
            />
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div>
        <SectionHeader title="Tags" section="tags" count={getUniqueTags().length} />
        {expandedSections.tags && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {getUniqueTags().map(tag => {
              const isSelected = selectedTags.includes(tag);
              const count = documents.filter(doc => 
                doc.metadata?.tags?.includes(tag)
              ).length;
              
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      onTagsChange(selectedTags.filter(t => t !== tag));
                    } else {
                      onTagsChange([...selectedTags, tag]);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm transition-all duration-200",
                    isSelected 
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Tag className={cn(
                      "h-3 w-3 mr-2 flex-shrink-0", 
                      isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-400"
                    )} />
                    <span className="truncate text-xs">{tag}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 