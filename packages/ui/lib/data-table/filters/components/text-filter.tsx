import * as React from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { BaseFilterProps } from "@repo/ui/types/data-table";
import { useDebouncedCallback } from "@repo/ui/hooks/use-debounced-callback";

export interface TextFilterProps
  extends BaseFilterProps<
    string,
    {
      placeholder?: string;
      test: string;
    }
  > {}

export function TextFilter({
  value = "",
  onChange,
  operator,
  meta,
}: TextFilterProps) {
  const [content, setContent] = React.useState(value);
  
  const debouncedOnChange = useDebouncedCallback((newValue: string) => {
    onChange(newValue);
  }, 1000);

  const placeholder = meta?.placeholder ?? "Filter...";

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
    <Input
      type="text"
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        debouncedOnChange(e.target.value);
      }}
      placeholder={placeholder}
      className="h-8 w-full"
    />
  );
}
