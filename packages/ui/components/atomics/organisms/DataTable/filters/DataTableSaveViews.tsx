import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { SaveViewDialog } from "./DataTableSaveViewDialog";
import { useSavedViews, type SavedView } from "@repo/ui/hooks/use-saved-views";
import { FilterAdapter } from "@repo/ui/types/data-table";
import { Table } from "@tanstack/react-table";

interface DataTableSaveViewsProps<TData, TAdapter extends FilterAdapter> {
  table: Table<TData>;
  tableId: string;
  filters: any[];
  joinOperator: "and" | "or";
  onViewChange: (view: SavedView<TAdapter> | null) => void;
}

export function DataTableSaveViews<TData, TAdapter extends FilterAdapter>({
  table,
  tableId,
  filters,
  joinOperator,
  onViewChange,
}: DataTableSaveViewsProps<TData, TAdapter>) {
  const [open, setOpen] = React.useState(false);
  const { addView } = useSavedViews<TAdapter>(tableId);

  const handleSave = (view: Omit<SavedView<TAdapter>, "id">) => {
    const savedView = addView(view);
    if (savedView) {
      // Apply the view settings immediately after saving
      applyViewSettings(savedView);
      onViewChange(savedView);
    }
  };

  const applyViewSettings = (view: SavedView<TAdapter>) => {
    const { savedFields } = view;

    // Apply sorting if saved
    if (savedFields.sorting && view.sorting) {
      table.setSorting(view.sorting);
    }

    // Apply column visibility if saved
    if (savedFields.columnVisibility && view.columnVisibility) {
      table.setColumnVisibility(view.columnVisibility);
    }

    // Apply page size if saved
    if (savedFields.pageSize && view.pageSize) {
      table.setPageSize(view.pageSize);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Save View
      </Button>
      <SaveViewDialog
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
        table={table}
        filters={filters}
        joinOperator={joinOperator}
      />
    </>
  );
}