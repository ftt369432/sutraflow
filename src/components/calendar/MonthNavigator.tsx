import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '../ui/Button';

interface MonthNavigatorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function MonthNavigator({ selectedDate, onChange }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-4">
      <Button onClick={() => onChange(subMonths(selectedDate, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-medium">
        {format(selectedDate, 'MMMM yyyy')}
      </span>
      <Button onClick={() => onChange(addMonths(selectedDate, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 