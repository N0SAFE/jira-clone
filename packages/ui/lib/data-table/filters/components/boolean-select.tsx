import * as React from "react";
import { FilterComponentProps } from "@repo/ui/types/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/shadcn/select";

export function BooleanSelectInput({ 
  value, 
  onChange, 
  disabled 
}: FilterComponentProps) {
  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(val === "true")}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Boolean filter"
        className="h-8 w-full rounded bg-transparent"
      >
        <SelectValue placeholder={value ? "True" : "False"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">True</SelectItem>
        <SelectItem value="false">False</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default BooleanSelectInput;