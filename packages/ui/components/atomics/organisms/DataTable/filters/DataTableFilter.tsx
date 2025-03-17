import * as React from "react";
import { Badge } from "@repo/ui/components/shadcn/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { cn } from "@repo/ui/lib/utils";
import { Filter, FilterAdapter, FiltersInstance } from "@repo/ui/types/data-table";
import { ListFilter, PlusCircle, Trash2 } from "lucide-react";

export interface DataTableFilterProps<TAdapter extends FilterAdapter> {
  instance: FiltersInstance<TAdapter>;
  onFiltersChange?: (filters: Filter<TAdapter>[]) => void;
  onJoinOperatorChange?: (operator: "and" | "or") => void;
  state?: {
    filters?: Filter<TAdapter>[];
    joinOperator?: "and" | "or";
  };
  className?: string;
}

export function DataTableFilter<TAdapter extends FilterAdapter>({
  instance,
  className,
  onFiltersChange,
  onJoinOperatorChange,
  state: { filters = [], joinOperator = "and" } = {
    filters: [],
    joinOperator: "and",
  },
}: DataTableFilterProps<TAdapter>) {
  const {
    actions: { generateFilter },
    config: {
      adapter,
      filters: { value: filtersConfig },
    },
  } = instance;

  // Available filter types from adapter
  const availableFilters = React.useMemo(() => {
    return Object.entries(filtersConfig).map(([key, filter]) => ({
      label: filter.label,
      id: filter.id,
      type: filter.type,
    }));
  }, [adapter.value]);

  // Function to create a new filter
  const handleAddFilter = React.useCallback(
    (opts: {
      type: keyof TAdapter["value"] extends string
        ? string & keyof TAdapter["value"]
        : never;
      id: string;
    }) => {
      const filter = generateFilter({
        id: opts.id,
        type: opts.type,
      });

      onFiltersChange?.([...filters, filter]);
    },
    [generateFilter, filters, joinOperator, onFiltersChange]
  );

  const isFiltered = filters.length > 0;
  const id = React.useId();

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Filter"
          >
            <ListFilter className="size-3" aria-hidden="true" />
            Filters
            {isFiltered && (
              <Badge
                variant="secondary"
                className="h-[1.14rem] rounded-[0.2rem] px-[0.32rem] font-mono text-[0.65rem] font-normal"
              >
                {filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          className={cn(
            "flex min-w-[480px] w-auto origin-[var(--radix-popover-content-transform-origin)] flex-col p-4",
            isFiltered ? "gap-3.5" : "gap-2"
          )}
        >
          {isFiltered ? (
            <h4 className="font-medium leading-none">Filters</h4>
          ) : (
            <div className="flex flex-col gap-1">
              <h4 className="font-medium leading-none">No filters applied</h4>
              <p className="text-sm text-muted-foreground">
                Add filters to refine your results.
              </p>
            </div>
          )}

          {/* Active filters */}
          {isFiltered && (
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto py-0.5 pr-1 overflow-x-hidden">
              {filters.map((filter, index) => {
                // Get the filter component for this filter type
                console.log("call components with", {
                  label: filter.label,
                  value: filter.state.value,
                  onChange: (value: any) => {
                    onFiltersChange?.(
                      filters.map((f) =>
                        f.id === filter.id
                          ? {
                              ...f,
                              state: {
                                ...f.state,
                                value,
                              },
                            }
                          : f
                      )
                    );
                  },
                  operator: filter.state.operator,
                  meta: filtersConfig.find((f) => f.id === filter.configId)
                    ?.meta,
                  filtersConfig,
                  filter,
                });
                const filterDef = adapter.getFilterTypeDef(filter.type);
                const operators = filterDef.operators || [];

                const FilterComponent = filterDef.component({
                  selectedOperator: filter.state.operator,
                  props: {
                    label: filter.label,
                    value: filter.state.value,
                    onChange: (value: any) => {
                      onFiltersChange?.(
                        filters.map((f) =>
                          f.id === filter.id
                            ? {
                                ...f,
                                state: {
                                  ...f.state,
                                  value,
                                },
                              }
                            : f
                        )
                      );
                    },
                    operator: filter.state.operator,
                    meta: filtersConfig.find((f) => f.id === filter.configId)
                      ?.meta,
                  },
                });

                return (
                  <div key={filter.id} className="flex items-center gap-2">
                    <div className="min-w-[4.5rem] text-center">
                      {index === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Where
                        </span>
                      ) : index === 1 ? (
                        <Select
                          value={joinOperator}
                          onValueChange={(value: "and" | "or") =>
                            onJoinOperatorChange?.(value)
                          }
                        >
                          <SelectTrigger
                            aria-label="Select join operator"
                            className="h-8 rounded lowercase"
                          >
                            <SelectValue placeholder={joinOperator} />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            className="min-w-[var(--radix-select-trigger-width)] lowercase"
                          >
                            <SelectItem value="and">And</SelectItem>
                            <SelectItem value="or">Or</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {joinOperator}
                        </span>
                      )}
                    </div>

                    {/* Filter type label */}
                    <div className="min-w-[5rem] max-w-[5rem]">
                      <span
                        className="text-sm font-medium block truncate"
                        title={String(filter.label)}
                      >
                        {String(filter.label).length > 12
                          ? String(filter.label).slice(0, 12) + "..."
                          : String(filter.label)}
                      </span>
                    </div>

                    {/* Operator selection */}
                    <div className="w-32">
                      <Select
                        value={filter.state.operator}
                        onValueChange={(value: string) => {
                          onFiltersChange?.(
                            filters.map((f) =>
                              f.id === filter.id
                                ? {
                                    ...f,
                                    state: {
                                      ...f.state,
                                      operator: value,
                                    },
                                  }
                                : f
                            )
                          );
                        }}
                      >
                        <SelectTrigger
                          aria-label="Select operator"
                          className="h-8 rounded"
                        >
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="min-w-[var(--radix-select-trigger-width)]"
                        >
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter component */}
                    <div className="flex-1">{FilterComponent}</div>

                    {/* Remove filter button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0 rounded"
                      onClick={() =>
                        onFiltersChange?.(
                          filters.filter((f) => f.id !== filter.id)
                        )
                      }
                      aria-label={`Remove ${filter.type} filter`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter actions */}
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" className="h-[1.85rem] rounded">
                  <PlusCircle className="size-3 mr-2" />
                  Add filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search filter types..." />
                  <CommandList>
                    <CommandEmpty>No filter types found.</CommandEmpty>
                    <CommandGroup>
                      {availableFilters.map(({ label, type, id }) => (
                        <CommandItem
                          key={id}
                          onSelect={() =>
                            handleAddFilter({
                              type,
                              id,
                            })
                          }
                        >
                          {label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                className="h-[1.85rem] rounded"
                onClick={() => {
                  onFiltersChange?.([]);
                  onJoinOperatorChange?.(joinOperator);
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
