import React, { useState } from 'react';
import { NexusObjectType, NexusRecord, useNexusStore } from '../../store/nexusStore';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  FileText,
  Clock,
  ExternalLink,
  Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NexusGridViewProps {
  objectType: NexusObjectType;
  records: NexusRecord[];
  onAddClick: () => void;
  onEditClick: (record: NexusRecord) => void;
  onDeleteClick: (id: string) => void;
  onRecordClick?: (record: NexusRecord) => void;
}

export const NexusGridView: React.FC<NexusGridViewProps> = ({
  objectType,
  records,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRecordClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const fields = objectType.schemaDefinition.fields;
  
  // Filter records based on search
  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    return Object.values(record.data).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('intake') || s.includes('litigation') || s.includes('normal')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (s.includes('discovery') || s.includes('moderate') || s.includes('upcoming')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    if (s.includes('trial') || s.includes('severe') || s.includes('high') || s.includes('low')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    if (s.includes('closed') || s.includes('discharged')) return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400';
    if (s.includes('critical') || s.includes('missed')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const formatValue = (record: NexusRecord, fieldName: string) => {
    const value = record.data[fieldName];
    if (value === undefined || value === null) return '-';

    const field = fields.find(f => f.name === fieldName);
    if (!field) return String(value);

    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'select':
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(String(value))}`}>
            {value}
          </span>
        );
      default:
        return String(value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-950/20 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
      {/* Table Header / Action Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Table size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">{objectType.name}s</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">{filteredRecords.length} records available</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md px-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
            <input 
              type="text"
              placeholder={`Search ${objectType.name.toLowerCase()}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Filter size={18} />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Add {objectType.name}
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur-md">
            <tr>
              <th className="p-4 w-10">
                <input type="checkbox" className="rounded border-slate-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500" />
              </th>
              {fields.map(field => (
                <th key={field.id} className="p-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-2 hover:text-slate-800 dark:hover:text-gray-200 cursor-pointer group">
                    {field.label}
                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
              <th className="p-4 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800 bg-white dark:bg-gray-900/30">
            <AnimatePresence mode='popLayout'>
              {filteredRecords.map((record) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={record.id} 
                  onClick={() => onRecordClick?.(record)}
                  className="group hover:bg-slate-50 dark:hover:bg-emerald-500/5 transition-colors cursor-pointer"
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500" />
                  </td>
                  {fields.map(field => (
                    <td key={field.id} className="p-4 text-sm text-slate-700 dark:text-gray-300">
                      {field.isTitle ? (
                        <div className="font-semibold text-slate-900 dark:text-gray-100">
                          {formatValue(record, field.name)}
                        </div>
                      ) : (
                        formatValue(record, field.name)
                      )}
                    </td>
                  ))}
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {record.kbDocumentId && (
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="View Source Document">
                          <FileText size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => onEditClick(record)}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteClick(record.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2} className="p-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-400">
                      <Search size={32} />
                    </div>
                    <div className="text-slate-400 dark:text-gray-500">
                      No {objectType.name.toLowerCase()}s found.
                    </div>
                    <button 
                      onClick={onAddClick}
                      className="text-emerald-600 hover:text-emerald-500 text-sm font-semibold"
                    >
                      Create the first record
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-100/50 dark:bg-gray-900/50 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs text-slate-400 dark:text-gray-500 uppercase tracking-tighter">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-bold">
            <Clock size={12} />
            LAST SYNCED: JUST NOW
          </span>
          <span className="font-bold">SYSTEM STATUS: OPERATIONAL</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-600/70">
          GENIEFLOW NEXUS ENGINE v1.0
          <ExternalLink size={10} />
        </div>
      </div>
    </div>
  );
};
