"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Grid3x3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createFloorPlan, deleteFloorPlan } from "@/actions/floorplan.actions";
import type { IFloorPlan } from "@/types";

interface FloorPlanManagerProps {
  floorPlans: IFloorPlan[];
  restaurantId: string;
}

function CreateDialog({
  restaurantId,
  onCreated,
}: {
  restaurantId: string;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(12);

  async function handleCreate() {
    if (!name.trim()) { toast.error("Name is required."); return; }
    if (rows < 2 || rows > 60 || cols < 2 || cols > 60) {
      toast.error("Grid dimensions must be between 2 and 60."); return;
    }
    setSubmitting(true);
    const result = await createFloorPlan(restaurantId, name, rows, cols);
    setSubmitting(false);
    if (result.success && result.data) {
      toast.success("Floor plan created!");
      setOpen(false);
      onCreated(result.data.id);
    } else {
      toast.error(result.error ?? "Failed to create.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Floor Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Floor Plan</DialogTitle>
          <DialogDescription>
            Choose a name and grid dimensions, then draw your layout in the editor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fp-name">Name</Label>
            <Input
              id="fp-name"
              placeholder="e.g. Ground Floor, Rooftop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fp-rows">Rows</Label>
              <Input
                id="fp-rows"
                type="number"
                min={2}
                max={60}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fp-cols">Columns</Label>
              <Input
                id="fp-cols"
                type="number"
                min={2}
                max={60}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Grid will be {rows} × {cols} = {rows * cols} cells.
            You&apos;ll draw and label tables in the editor after creation.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create & Open Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  plan,
  restaurantId,
  onDeleted,
}: {
  plan: IFloorPlan;
  restaurantId: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteFloorPlan(plan._id, restaurantId);
    setDeleting(false);
    if (result.success) {
      toast.success("Floor plan deleted.");
      setOpen(false);
      onDeleted();
    } else {
      toast.error(result.error ?? "Failed to delete.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete floor plan">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{plan.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently delete the floor plan, all its tables, and all reservations
            made at those tables. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FloorPlanManager({ floorPlans, restaurantId }: FloorPlanManagerProps) {
  const router = useRouter();

  function handleCreated(id: string) {
    router.push(`/owner/restaurants/${restaurantId}/floorplans/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Floor Plans ({floorPlans.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Draw your restaurant layout and mark which cells are seats.
          </p>
        </div>
        <CreateDialog restaurantId={restaurantId} onCreated={handleCreated} />
      </div>

      {floorPlans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-10 text-center">
          <Grid3x3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm mb-1">No floor plans yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Add a floor plan to visually place tables in your restaurant.
          </p>
          <CreateDialog restaurantId={restaurantId} onCreated={handleCreated} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {floorPlans.map((plan) => (
            <div
              key={plan._id}
              className="rounded-xl border bg-white p-4 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.rows} × {plan.cols} grid · {plan.tables.length} table
                  {plan.tables.length !== 1 ? "s" : ""}
                </p>
                {plan.tables.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tables: {plan.tables.map((t) => `T${t.tableNumber}`).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <Link
                  href={`/owner/restaurants/${restaurantId}/floorplans/${plan._id}`}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Edit floor plan"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <DeleteDialog
                  plan={plan}
                  restaurantId={restaurantId}
                  onDeleted={() => router.refresh()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
