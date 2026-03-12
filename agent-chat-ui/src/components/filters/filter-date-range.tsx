import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "@/lib/filter-data";

interface FilterDateRangeProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export const FilterDateRange: React.FC<FilterDateRangeProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const hasRange = dateRange.from !== undefined;

  return (
    <div className="rounded-lg border border-border/50 bg-transparent p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Date range
        </div>
        {hasRange && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left text-xs font-normal h-8",
              !hasRange && "text-muted-foreground",
            )}
          >
            {hasRange
              ? `${formatDate(dateRange.from!)}${dateRange.to ? ` ~ ${formatDate(dateRange.to)}` : ""}`
              : "Select date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={
              dateRange.from
                ? { from: dateRange.from, to: dateRange.to }
                : undefined
            }
            onSelect={(range) =>
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
