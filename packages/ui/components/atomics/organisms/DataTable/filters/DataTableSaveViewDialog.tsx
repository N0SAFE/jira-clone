import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { SavedView } from "@repo/ui/hooks/use-saved-views";
import { FilterAdapter } from "@repo/ui/types/data-table";
import { Table } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { ScrollArea } from "@repo/ui/components/shadcn/scroll-area";

interface SaveViewDialogProps<TData, TAdapter extends FilterAdapter> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (view: Omit<SavedView<TAdapter>, "id">) => void;
  table: Table<TData>;
  filters: any[];
  joinOperator: "and" | "or";
}

export function SaveViewDialog<TData, TAdapter extends FilterAdapter>({
  open,
  onOpenChange,
  onSave,
  table,
  filters,
  joinOperator,
}: SaveViewDialogProps<TData, TAdapter>) {
  const [name, setName] = React.useState("");
  const [saveFields, setSaveFields] = React.useState({
    filters: true,
    sorting: true,
    columnVisibility: true,
    pageSize: true,
  });

  const handleSave = () => {
    if (!name) return;

    const view: Omit<SavedView<TAdapter>, "id"> = {
      name,
      filters: saveFields.filters ? filters : [],
      joinOperator,
      sorting: saveFields.sorting ? table.getState().sorting : undefined,
      columnVisibility: saveFields.columnVisibility
        ? table.getState().columnVisibility
        : undefined,
      pageSize: saveFields.pageSize
        ? table.getState().pagination.pageSize
        : undefined,
      savedFields: saveFields,
    };

    onSave(view);
    onOpenChange(false);
    setName("");
    setSaveFields({
      filters: true,
      sorting: true,
      columnVisibility: true,
      pageSize: true,
    });
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setName("");
    setSaveFields({
      filters: true,
      sorting: true,
      columnVisibility: true,
      pageSize: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Save View</DialogTitle>
          <DialogDescription>
            Create a new view with your current table configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">View Name</Label>
                <Input
                  id="name"
                  placeholder="Enter view name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Save your current view with all settings enabled.
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">View Name</Label>
                <Input
                  id="name"
                  placeholder="Enter view name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Save Settings</Label>
                <ScrollArea className="h-[180px] rounded-md border p-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filters"
                        checked={saveFields.filters}
                        onCheckedChange={(checked) =>
                          setSaveFields((prev) => ({
                            ...prev,
                            filters: !!checked,
                          }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="filters">Filters</Label>
                        <p className="text-sm text-muted-foreground">
                          Save current filter configuration
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sorting"
                        checked={saveFields.sorting}
                        onCheckedChange={(checked) =>
                          setSaveFields((prev) => ({
                            ...prev,
                            sorting: !!checked,
                          }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="sorting">Sorting</Label>
                        <p className="text-sm text-muted-foreground">
                          Save column sorting settings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="columnVisibility"
                        checked={saveFields.columnVisibility}
                        onCheckedChange={(checked) =>
                          setSaveFields((prev) => ({
                            ...prev,
                            columnVisibility: !!checked,
                          }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="columnVisibility">
                          Column Visibility
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Save visible/hidden columns
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pageSize"
                        checked={saveFields.pageSize}
                        onCheckedChange={(checked) =>
                          setSaveFields((prev) => ({
                            ...prev,
                            pageSize: !!checked,
                          }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="pageSize">Rows Per Page</Label>
                        <p className="text-sm text-muted-foreground">
                          Save pagination size setting
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name}>
            Save View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
