import * as React from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { BaseFilterProps } from "@repo/ui/types/data-table";

export interface SelectFilterProps extends BaseFilterProps<string> {
  meta?: () => {
    options: Array<{ label: string; value: string }>;
    placeholder: string;
  };
}

export function SelectFilter({ 
  value, 
  onChange, 
  operator,
  meta 
}: SelectFilterProps) {
  console.log('ui')
  console.log(meta?.())

  const options = meta?.()?.options ?? [];
  const placeholder = meta?.()?.placeholder ?? "Select...";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}