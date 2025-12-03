"use client";

import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  value: DateRangeValue | null;
  onChange: (range: DateRangeValue | null) => void;
  className?: string;
}

type QuickSelectOption = {
  label: string;
  getValue: () => DateRangeValue;
};

const quickSelectOptions: QuickSelectOption[] = [
  {
    label: "Today",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This Week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last Month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "Last 3 Months",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfDay(new Date()),
    }),
  },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );

  const handleQuickSelect = (option: QuickSelectOption) => {
    const range = option.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
    }
  };

  const handleClear = () => {
    onChange(null);
    setTempRange(undefined);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value) return "All Time";
    return `${format(value.from, "MMM d")} - ${format(value.to, "MMM d, yyyy")}`;
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Quick Select Buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {quickSelectOptions.map((option) => (
          <Button
            key={option.label}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs h-8 border-gray-300",
              value &&
                format(value.from, "yyyy-MM-dd") === format(option.getValue().from, "yyyy-MM-dd") &&
                format(value.to, "yyyy-MM-dd") === format(option.getValue().to, "yyyy-MM-dd")
                ? "bg-black text-white border-black"
                : ""
            )}
            onClick={() => handleQuickSelect(option)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Custom Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs h-8 gap-2 border-gray-300",
              value && !quickSelectOptions.some(opt =>
                format(value.from, "yyyy-MM-dd") === format(opt.getValue().from, "yyyy-MM-dd") &&
                format(value.to, "yyyy-MM-dd") === format(opt.getValue().to, "yyyy-MM-dd")
              )
                ? "bg-black text-white border-black"
                : ""
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            Custom Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            defaultMonth={value?.from || subMonths(new Date(), 1)}
          />
          <div className="flex justify-end p-3 border-t">
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Range Display & Clear */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-sm text-gray-600">{formatDateRange()}</span>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
