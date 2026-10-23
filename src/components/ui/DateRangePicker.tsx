import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Calendar } from './Calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './Popover';

interface DateRangePickerProps {
  value?: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
  label?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<{ from: Date; to: Date }>(
    value || { from: new Date(), to: new Date() }
  );

  const handleSelect = (newDate: Date | undefined) => {
    if (!newDate) return;

    const newRange = !date.from || date.to
      ? { from: newDate, to: newDate }
      : { from: date.from, to: newDate };

    setDate(newRange);
    onChange(newRange);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 