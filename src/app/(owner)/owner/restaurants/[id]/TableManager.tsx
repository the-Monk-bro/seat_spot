"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { createTable, updateTable, deleteTable } from "@/actions/table.actions";
import type { ITable } from "@/types";

interface TableManagerProps {
  tables: ITable[];
  restaurantId: string;
}

function TableForm({
  restaurantId,
  table,
  onSuccess,
}: {
  restaurantId: string;
  table?: ITable;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = table
      ? await updateTable(table._id, restaurantId, fd)
      : await createTable(restaurantId, fd);

    if (result.success) {
      toast.success(table ? "Table updated" : "Table added");
      onSuccess();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="table-number">Table Number</Label>
        <Input id="table-number" name="number" type="number" min={1} defaultValue={table?.number} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="table-cap">Seating Capacity</Label>
        <Input id="table-cap" name="capacity" type="number" min={1} defaultValue={table?.capacity} required />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {table ? "Update Table" : "Add Table"}
      </Button>
    </form>
  );
}

export function TableManager({ tables: initial, restaurantId }: TableManagerProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editTable, setEditTable] = useState<ITable | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deleteTable(id, restaurantId);
    if (result.success) {
      toast.success("Table deleted");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Tables ({initial.length})</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Table</DialogTitle></DialogHeader>
            <TableForm restaurantId={restaurantId} onSuccess={() => { setAddOpen(false); router.refresh(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tables yet. Add your first table to accept reservations.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {initial.map((t) => (
            <div key={t._id} className="rounded-xl border bg-white p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">Table {t.number}</div>
                <div className="text-xs text-muted-foreground">Seats {t.capacity}</div>
              </div>
              <div className="flex gap-1">
                <Dialog open={editTable?._id === t._id} onOpenChange={(o) => !o && setEditTable(null)}>
                  <DialogTrigger asChild>
                    <button onClick={() => setEditTable(t)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Table</DialogTitle></DialogHeader>
                    <TableForm
                      restaurantId={restaurantId}
                      table={t}
                      onSuccess={() => { setEditTable(null); router.refresh(); }}
                    />
                  </DialogContent>
                </Dialog>
                <button
                  onClick={() => handleDelete(t._id)}
                  disabled={deleting === t._id}
                  className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                >
                  {deleting === t._id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    : <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
