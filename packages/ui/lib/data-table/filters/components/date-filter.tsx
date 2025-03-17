import * as React from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Calendar } from "@repo/ui/components/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { BaseFilterProps } from "@repo/ui/types/data-table";

export interface DateFilterProps extends BaseFilterProps<Date | null> {
  meta?: {
    placeholder?: string;
  };
}

export function DateFilter({
  value,
  onChange,
  operator,
  meta,
}: DateFilterProps) {
  const placeholder = meta?.placeholder ?? "Pick a date...";
  const date = value ? new Date(value) : undefined;

  // Skip rendering input for isEmpty/isNotEmpty operators
  if (operator === "isEmpty" || operator === "isNotEmpty") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Filter is ${
          operator === "isEmpty" ? "empty" : "not empty"
        }`}
        className="h-8 w-full rounded border border-dashed"
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "LLL dd, y") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => onChange(newDate ? newDate : null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
