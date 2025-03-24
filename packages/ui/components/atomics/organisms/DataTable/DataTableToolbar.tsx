import * as React from "react";
import { X } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { DataTableFilterList } from "./filters/DataTableFilterList";
import {
  FilterAdapter,
  FiltersInstance,
  type Filter,
} from "@repo/ui/types/data-table";

interface DataTableToolbarProps<TData, TAdapter extends FilterAdapter>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  instance: FiltersInstance<TAdapter>;
  filters: Filter<TAdapter>[];
  joinOperator: "and" | "or";
  onFilterChange?: (filters: Filter<TAdapter>[]) => void;
  onJoinOperatorChange?: (operator: "and" | "or") => void;
}

export function DataTableToolbar<TData, TAdapter extends FilterAdapter>({
  table,
  instance,
  filters,
  joinOperator,
  onFilterChange,
  onJoinOperatorChange,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData, TAdapter>) {
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);

  console.log("DataTableToolbar", {
    filters,
    joinOperator,
    selectedFilters,
  });

  const isFiltered = filters.length > 0;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 overflow-auto p-1",
        className
      )}
      {...props}
      role="toolbar"
      aria-label="Options du tableau"
    >
      <div className="flex flex-1 items-center gap-2">
        <DataTableFilterList
          instance={instance}
          filters={filters}
          onFiltersChange={onFilterChange}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
        />
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => {
              onFilterChange?.([]);
              onJoinOperatorChange?.(
                instance.config.filters.defaultJoinOperator
              );
            }}
          >
            Reset
            <X className="ml-2 size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
