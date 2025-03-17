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
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { cn } from "@repo/ui/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { ScrollArea } from "@repo/ui/components/shadcn/scroll-area";
import { Filter, FilterAdapter, FiltersInstance } from "@repo/ui/types/data-table";

interface DataTableFilterListProps<TAdapter extends FilterAdapter> {
  instance: FiltersInstance<TAdapter>;
  selectedFilters: string[];
  setSelectedFilters: (value: string[]) => void;
  onFiltersChange?: (filters: Filter<TAdapter>[]) => void;
  filters: Filter<TAdapter>[];
}

export function DataTableFilterList<TAdapter extends FilterAdapter>({
  selectedFilters,
  setSelectedFilters,
  onFiltersChange,
  instance,
  filters,
}: DataTableFilterListProps<TAdapter>) {
  const {
    actions: { generateFilter },
    config: {
      adapter,
      filters: { value: filtersConfig },
    },
  } = instance;

  const [open, setOpen] = React.useState(false);

  // Initialize new filters when selectedFilters changes
  React.useEffect(() => {
    const newFilters = [...filters];
    let hasChanges = false;

    selectedFilters.forEach((filterId) => {
      const filterConfig = filtersConfig.find((f) => f.id === filterId);
      if (!filterConfig) return;

      const activeFilter = filters.find((f) => f.configId === filterId);
      
      if (!activeFilter) {
        const filterDef = adapter.getFilterTypeDef(filterConfig.type);
        const newFilter = generateFilter({
          id: filterConfig.id,
          type: filterConfig.type,
          label: filterConfig.label,
        });
        
        newFilters.push(newFilter);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onFiltersChange?.(newFilters);
    }
  }, [selectedFilters, filtersConfig, filters, generateFilter, onFiltersChange, adapter]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {selectedFilters.map((filterId) => {
          const filterConfig = filtersConfig.find((f) => f.id === filterId);
          if (!filterConfig) return null;

          // Find the active filter if it exists
          const activeFilter = filters.find((f) => f.configId === filterId);
          if (!activeFilter) return null;
          
          // Get the filter definition from the adapter
          const filterDef = adapter.getFilterTypeDef(filterConfig.type);

          return (
            <div key={filterId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="w-fit">
                  {filterConfig.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setSelectedFilters(selectedFilters.filter((f) => f !== filterId));
                    onFiltersChange?.(filters.filter((f) => f.id !== activeFilter.id));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="w-[200px]">
                {filterDef.component({
                  selectedOperator: activeFilter.state.operator,
                  props: {
                    label: activeFilter.label,
                    value: activeFilter.state.value,
                    onChange: (value: any) => {
                      const updatedFilters = filters.map((f) =>
                        f.id === activeFilter.id
                          ? {
                              ...f,
                              state: {
                                ...f.state,
                                value,
                              },
                            }
                          : f
                      );
                      onFiltersChange?.(updatedFilters);
                    },
                    operator: activeFilter.state.operator,
                    meta: filterConfig.meta,
                  },
                })}
              </div>
            </div>
          );
        })}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add filter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search filters..." />
            <CommandList>
              <CommandEmpty>No filters found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {filtersConfig.map((filter) => (
                    <CommandItem
                      key={filter.id}
                      onSelect={() => {
                        setSelectedFilters(
                          selectedFilters.includes(filter.id)
                            ? selectedFilters.filter((f) => f !== filter.id)
                            : [...selectedFilters, filter.id]
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFilters.includes(filter.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {filter.label}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
