import * as React from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { BaseFilterProps } from "@repo/ui/types/data-table";

export interface MultiSelectFilterProps extends BaseFilterProps<string[]> {
  meta?: {
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
    showInputForEmptyOperators?: boolean;
  };
}

export function MultiSelectFilter({ 
  value = [], 
  onChange,
  operator,
  meta 
}: MultiSelectFilterProps) {
  const options = meta?.options ?? [];
  const placeholder = meta?.placeholder ?? "Select options...";
  const [open, setOpen] = React.useState(false);
  const selectedValues = new Set(value);

  // Check if we should hide input for isEmpty/isNotEmpty operators
  const shouldHideInput = (operator === "isEmpty" || operator === "isNotEmpty") && 
    meta?.showInputForEmptyOperators !== true;

  if (shouldHideInput) {
    return (
      <div 
        role="status"
        aria-live="polite"
        aria-label={`Filter is ${operator === "isEmpty" ? "empty" : "not empty"}`}
        className="h-8 w-full rounded border border-dashed"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-between"
        >
          <div className="flex flex-wrap gap-1">
            {selectedValues.size > 0 ? (
              Array.from(selectedValues).map((selectedValue) => (
                <Badge
                  key={selectedValue}
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {options.find((opt) => opt.value === selectedValue)?.label ||
                    selectedValue}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = selectedValues.has(option.value);
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const newSelectedValues = new Set(selectedValues);
                    if (isSelected) {
                      newSelectedValues.delete(option.value);
                    } else {
                      newSelectedValues.add(option.value);
                    }
                    onChange(Array.from(newSelectedValues));
                  }}
                >
                  <div
                    className={cn(
                      "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("size-4")} />
                  </div>
                  {option.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}