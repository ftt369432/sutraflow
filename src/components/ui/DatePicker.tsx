import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  children?: React.ReactNode;
  className?: string;
}

export function DatePicker({ date, onSelect, children, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          footer={
            <div className="flex justify-between px-4 py-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  // Set to today
                  onSelect(new Date());
                }}
              >
                Today
              </Button>
              {date && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    // Clear date
                    onSelect(undefined);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  );
} 