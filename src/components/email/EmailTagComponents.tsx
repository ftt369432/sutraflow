import React from 'react';
import { X } from 'lucide-react';

export interface EmailTag {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

interface EmailTagComponentProps {
  tag: EmailTag;
  isSelected?: boolean;
  isRemovable?: boolean;
  onRemove?: (tagId: string) => void;
  onClick?: (tag: EmailTag) => void;
  size?: 'sm' | 'md' | 'lg';
}

const tagColorClasses = {
  // Predefined color schemes - much lighter and more readable
  red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  lime: 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
  green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
  pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  
  // Default clean, uncolored style
  default: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
};

export const EmailTagComponent: React.FC<EmailTagComponentProps> = ({
  tag,
  isSelected = false,
  isRemovable = false,
  onRemove,
  onClick,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const getTagColorClass = (color?: string): string => {
    if (!color || color === 'default') {
      return tagColorClasses.default;
    }
    return tagColorClasses[color as keyof typeof tagColorClasses] || tagColorClasses.default;
  };

  const baseClasses = `
    inline-flex items-center space-x-1 rounded-full border font-medium transition-all duration-200 cursor-pointer
    ${sizeClasses[size]}
    ${getTagColorClass(tag.color)}
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
  `;

  return (
    <span 
      className={baseClasses}
      onClick={() => onClick?.(tag)}
    >
      <span>{tag.name}</span>
      {tag.count !== undefined && (
        <span className="ml-1 text-xs opacity-70">({tag.count})</span>
      )}
      {isRemovable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          className="ml-1 hover:bg-white hover:bg-opacity-30 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

interface EmailTagListProps {
  tags: EmailTag[];
  selectedTags?: string[];
  maxVisible?: number;
  isRemovable?: boolean;
  onTagClick?: (tag: EmailTag) => void;
  onTagRemove?: (tagId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const EmailTagList: React.FC<EmailTagListProps> = ({
  tags,
  selectedTags = [],
  maxVisible = 5,
  isRemovable = false,
  onTagClick,
  onTagRemove,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = Math.max(0, tags.length - maxVisible);

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <EmailTagComponent
          key={tag.id}
          tag={tag}
          isSelected={selectedTags.includes(tag.id)}
          isRemovable={isRemovable}
          onRemove={onTagRemove}
          onClick={onTagClick}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <span className={`
          inline-flex items-center rounded-full border bg-gray-100 text-gray-600 border-gray-200
          ${sizeClasses[size]}
        `}>
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
};

// Tag Color Picker Component
interface TagColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
}

export const TagColorPicker: React.FC<TagColorPickerProps> = ({
  selectedColor = 'default',
  onColorSelect
}) => {
  const colors = [
    { name: 'Default', value: 'default' },
    { name: 'Red', value: 'red' },
    { name: 'Orange', value: 'orange' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Green', value: 'green' },
    { name: 'Blue', value: 'blue' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Teal', value: 'teal' },
    { name: 'Cyan', value: 'cyan' },
    { name: 'Emerald', value: 'emerald' }
  ];

  return (
    <div className="grid grid-cols-6 gap-2 p-3">
      {colors.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          className={`
            w-8 h-8 rounded-full border-2 transition-all duration-200
            ${tagColorClasses[color.value as keyof typeof tagColorClasses].replace(/text-\w+-\d+/, 'text-transparent')}
            ${selectedColor === color.value ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'hover:scale-105'}
          `}
          title={color.name}
        >
          {selectedColor === color.value && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-current rounded-full opacity-70"></div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// Quick Tag Presets
export const getTagPresets = (): EmailTag[] => [
  { id: 'urgent', name: 'Urgent', color: 'red' },
  { id: 'follow-up', name: 'Follow Up', color: 'orange' },
  { id: 'important', name: 'Important', color: 'yellow' },
  { id: 'client', name: 'Client', color: 'blue' },
  { id: 'legal', name: 'Legal', color: 'indigo' },
  { id: 'financial', name: 'Financial', color: 'green' },
  { id: 'meeting', name: 'Meeting', color: 'purple' },
  { id: 'review', name: 'Review', color: 'teal' },
  { id: 'action-required', name: 'Action Required', color: 'red' },
  { id: 'waiting', name: 'Waiting', color: 'gray' },
  { id: 'personal', name: 'Personal', color: 'pink' },
  { id: 'newsletter', name: 'Newsletter', color: 'cyan' }
];
