"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateFloorPlan } from "@/actions/floorplan.actions";
import type { IFloorPlan } from "@/types";

// ─── Grid constants ────────────────────────────────────────────────────────────
const CELL_PX = 34; // editor cell size
const GAP_PX = 2;

// Palette for assigned table colors (cycles for table numbers)
const TABLE_COLORS: string[] = [
  "bg-emerald-200 border-emerald-500 text-emerald-900",
  "bg-blue-200 border-blue-500 text-blue-900",
  "bg-purple-200 border-purple-500 text-purple-900",
  "bg-orange-200 border-orange-500 text-orange-900",
  "bg-pink-200 border-pink-500 text-pink-900",
  "bg-cyan-200 border-cyan-500 text-cyan-900",
  "bg-rose-200 border-rose-500 text-rose-900",
  "bg-lime-200 border-lime-500 text-lime-900",
];

function tableColor(tableNumber: number) {
  return TABLE_COLORS[(tableNumber - 1) % TABLE_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a 2D grid from the floor plan. 0=floor, -1=unassigned seat, N>0=table N */
function buildGrid(plan: IFloorPlan): number[][] {
  const g: number[][] = Array.from({ length: plan.rows }, () =>
    new Array(plan.cols).fill(0)
  );
  for (const t of plan.tables) {
    for (const cell of t.cells) {
      if (cell.row < plan.rows && cell.col < plan.cols) {
        g[cell.row][cell.col] = t.tableNumber;
      }
    }
  }
  return g;
}

/** BFS flood-fill to find a contiguous island of seat cells starting at (r,c) */
function getIsland(
  grid: number[][],
  startR: number,
  startC: number
): { row: number; col: number }[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const queue: { row: number; col: number }[] = [{ row: startR, col: startC }];
  const island: { row: number; col: number }[] = [];

  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    const key = `${row},${col}`;
    if (visited.has(key)) continue;
    if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
    if (grid[row][col] === 0) continue; // floor cell — stop

    visited.add(key);
    island.push({ row, col });
    queue.push(
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    );
  }
  return island;
}

/** Extract table list from grid (all N>0 groups) */
function extractTables(
  grid: number[][]
): { tableNumber: number; cells: { row: number; col: number }[] }[] {
  const map = new Map<number, { row: number; col: number }[]>();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const v = grid[r][c];
      if (v > 0) {
        if (!map.has(v)) map.set(v, []);
        map.get(v)!.push({ row: r, col: c });
      }
    }
  }
  return Array.from(map.entries()).map(([tableNumber, cells]) => ({
    tableNumber,
    cells,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  plan: IFloorPlan;
  restaurantId: string;
}

export default function FloorPlanEditorClient({ plan, restaurantId }: Props) {
  const router = useRouter();

  // Grid state: 0=floor, -1=unassigned seat, N>0=table N
  const [grid, setGrid] = useState<number[][]>(() => buildGrid(plan));
  const [name, setName] = useState(plan.name);
  const [northLabel, setNorthLabel] = useState(plan.northLabel);
  const [southLabel, setSouthLabel] = useState(plan.southLabel);
  const [eastLabel, setEastLabel] = useState(plan.eastLabel);
  const [westLabel, setWestLabel] = useState(plan.westLabel);

  // Drag selection state
  const isDragging = useRef(false);
  const dragStart = useRef<{ row: number; col: number } | null>(null);
  const [dragRect, setDragRect] = useState<{
    r1: number; c1: number; r2: number; c2: number
  } | null>(null);

  // Table assignment dialog
  const [assignIsland, setAssignIsland] = useState<
    { row: number; col: number }[] | null
  >(null);
  const [tableNumberInput, setTableNumberInput] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Grid mutation helpers ────────────────────────────────────────────────

  const toggleCell = useCallback((row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      const current = next[row][col];

      if (current === 0) {
        // Floor → unassigned seat
        next[row][col] = -1;
      } else if (current === -1) {
        // Unassigned seat → floor
        next[row][col] = 0;
      } else {
        // Assigned table cell clicked → ungroup entire table
        const tableNum = current;
        for (let r = 0; r < next.length; r++) {
          for (let c = 0; c < next[r].length; c++) {
            if (next[r][c] === tableNum) next[r][c] = -1;
          }
        }
      }
      return next;
    });
  }, []);

  const fillRect = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (next[r][c] === 0) next[r][c] = -1; // floor → unassigned seat
          // Don't overwrite already-assigned table cells
        }
      }
      return next;
    });
  }, []);

  // ── Mouse events on cells ───────────────────────────────────────────────

  function handleMouseDown(row: number, col: number) {
    isDragging.current = true;
    dragStart.current = { row, col };
    setDragRect({ r1: row, c1: col, r2: row, c2: col });
  }

  function handleMouseEnter(row: number, col: number) {
    if (!isDragging.current || !dragStart.current) return;
    setDragRect({
      r1: dragStart.current.row,
      c1: dragStart.current.col,
      r2: row,
      c2: col,
    });
  }

  function handleMouseUp(row: number, col: number) {
    if (!isDragging.current || !dragStart.current) return;
    isDragging.current = false;
    const start = dragStart.current;
    dragStart.current = null;
    setDragRect(null);

    if (start.row === row && start.col === col) {
      // Single click
      toggleCell(row, col);
    } else {
      // Drag — fill rectangle with seat cells
      fillRect(start.row, start.col, row, col);
    }
  }

  // ── Table assignment ─────────────────────────────────────────────────────

  function handleCellClick(row: number, col: number) {
    // This is handled by mouseDown/Up; here we handle the "assign island" scenario
    // if the cell is an unassigned seat
    if (grid[row][col] === -1) {
      const island = getIsland(grid, row, col).filter((c) => grid[c.row][c.col] === -1);
      if (island.length > 0) {
        setAssignIsland(island);
        setTableNumberInput("");
      }
    }
  }

  function confirmAssign() {
    const num = parseInt(tableNumberInput, 10);
    if (isNaN(num) || num < 1) {
      toast.error("Enter a valid table number (≥ 1).");
      return;
    }
    if (!assignIsland) return;

    // Check uniqueness within grid
    const existing = new Set<number>();
    for (const row of grid) for (const v of row) if (v > 0) existing.add(v);
    if (existing.has(num)) {
      toast.error(`Table ${num} is already assigned. Choose a different number.`);
      return;
    }

    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      for (const { row, col } of assignIsland!) {
        next[row][col] = num;
      }
      return next;
    });
    setAssignIsland(null);
  }

  // ── Save ────────────────────────────────────────────────────────────────

  async function handleSave() {
    // Validate: no unassigned seat cells remain
    let hasUnassigned = false;
    for (const row of grid) {
      for (const v of row) {
        if (v === -1) { hasUnassigned = true; break; }
      }
      if (hasUnassigned) break;
    }
    if (hasUnassigned) {
      toast.error(
        "Some seat cells are not assigned to a table. Click a highlighted island to assign a table number, or deselect those cells."
      );
      return;
    }

    setSaving(true);
    const tables = extractTables(grid);
    const result = await updateFloorPlan(plan._id, restaurantId, {
      name,
      rows: plan.rows,
      cols: plan.cols,
      northLabel,
      southLabel,
      eastLabel,
      westLabel,
      tables,
    });
    setSaving(false);

    if (result.success) {
      toast.success("Floor plan saved!");
      router.push(`/owner/restaurants/${restaurantId}`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Save failed.");
    }
  }

  // ── Rendering helpers ───────────────────────────────────────────────────

  function inDragRect(r: number, c: number): boolean {
    if (!dragRect) return false;
    const minR = Math.min(dragRect.r1, dragRect.r2);
    const maxR = Math.max(dragRect.r1, dragRect.r2);
    const minC = Math.min(dragRect.c1, dragRect.c2);
    const maxC = Math.max(dragRect.c1, dragRect.c2);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  }

  function cellClass(r: number, c: number): string {
    const v = grid[r][c];
    const base = "border transition-colors duration-100 select-none";

    if (inDragRect(r, c) && isDragging.current) {
      return `${base} border-primary bg-primary/20 cursor-crosshair`;
    }
    if (v === 0) {
      return `${base} border-border/40 bg-transparent hover:bg-muted/40 cursor-crosshair`;
    }
    if (v === -1) {
      return `${base} border-amber-400 bg-amber-100 hover:bg-amber-200 cursor-pointer animate-pulse`;
    }
    return `${base} border-2 ${tableColor(v)} cursor-pointer`;
  }

  const { rows, cols } = plan;

  // ── JSX ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/owner/restaurants/${restaurantId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-semibold text-base h-9 max-w-xs"
            placeholder="Floor plan name…"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 shrink-0">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      {/* Legend / hint */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border border-border/40 bg-transparent" />
          Floor cell
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border border-amber-400 bg-amber-100 animate-pulse" />
          Unassigned seat — click to assign table number
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-200" />
          Assigned table
        </span>
        <span className="ml-auto italic">
          Click to toggle · Drag to fill a rectangle with seats · Click assigned table cell to ungroup
        </span>
      </div>

      {/* North label */}
      <div className="flex justify-center">
        <Input
          value={northLabel}
          onChange={(e) => setNorthLabel(e.target.value)}
          placeholder="North boundary (e.g. Glass Window)"
          className="max-w-64 h-8 text-xs text-center"
        />
      </div>

      {/* Grid with West/East labels */}
      <div className="flex items-center gap-3">
        {/* West label */}
        <div className="shrink-0 flex items-center justify-center" style={{ width: 32 }}>
          <Input
            value={westLabel}
            onChange={(e) => setWestLabel(e.target.value)}
            placeholder="West"
            className="h-8 text-xs text-center"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 120, width: 32 }}
          />
        </div>

        {/* The grid */}
        <div
          className="overflow-auto rounded-xl border border-border bg-[#fafaf8] p-3 flex-1"
          onMouseLeave={() => {
            if (isDragging.current && dragStart.current) {
              // cancelled
              isDragging.current = false;
              dragStart.current = null;
              setDragRect(null);
            }
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
              gap: GAP_PX,
              userSelect: "none",
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const v = grid[r][c];
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`rounded-sm ${cellClass(r, c)}`}
                    style={{ width: CELL_PX, height: CELL_PX }}
                    onMouseDown={(e) => { e.preventDefault(); handleMouseDown(r, c); }}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    onMouseUp={() => {
                      handleMouseUp(r, c);
                      if (grid[r][c] === -1) handleCellClick(r, c);
                    }}
                    title={
                      v === 0 ? "Floor" :
                      v === -1 ? "Unassigned seat — click to assign" :
                      `Table ${v}`
                    }
                  >
                    {v > 0 && (
                      <span className="flex items-center justify-center h-full text-[9px] font-bold leading-none">
                        T{v}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* East label */}
        <div className="shrink-0 flex items-center justify-center" style={{ width: 32 }}>
          <Input
            value={eastLabel}
            onChange={(e) => setEastLabel(e.target.value)}
            placeholder="East"
            className="h-8 text-xs text-center"
            style={{ writingMode: "vertical-rl", height: 120, width: 32 }}
          />
        </div>
      </div>

      {/* South label */}
      <div className="flex justify-center">
        <Input
          value={southLabel}
          onChange={(e) => setSouthLabel(e.target.value)}
          placeholder="South boundary (e.g. Entrance)"
          className="max-w-64 h-8 text-xs text-center"
        />
      </div>

      {/* Table assignment dialog */}
      <Dialog open={!!assignIsland} onOpenChange={(o) => !o && setAssignIsland(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Table Number</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This island has <strong>{assignIsland?.length}</strong> seat cell
            {assignIsland?.length !== 1 ? "s" : ""} (= seating capacity).
            Give this group a table number.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="table-num-input">Table Number</Label>
            <Input
              id="table-num-input"
              type="number"
              min={1}
              value={tableNumberInput}
              onChange={(e) => setTableNumberInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmAssign()}
              autoFocus
              placeholder="e.g. 5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignIsland(null)}>Cancel</Button>
            <Button onClick={confirmAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
