"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { IFloorPlanWithAvailability, IFloorPlanTableWithAvailability } from "@/types";

// ─── Types re-exported for ReservationForm ────────────────────────────────────
export interface TableSlot {
  _id: string;   // tableDocId
  number: number;
  capacity: number;
  available: boolean;
}

interface FloorMapProps {
  restaurantId: string;
  date: string;
  startTime: string;
  endTime: string;
  selectedTableDocId: string;
  onSelectTable: (table: TableSlot) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL = 28; // customer view cell size (px)
const GAP  = 2;

// ─── Cell class by state ──────────────────────────────────────────────────────
function seatCellClass(
  tableEntry: IFloorPlanTableWithAvailability,
  isSelected: boolean
): string {
  const base = "transition-colors duration-100 border cursor-pointer";
  if (isSelected) return `${base} bg-amber-400 border-amber-500`;
  if (!tableEntry.available) return `${base} bg-rose-200 border-rose-400 cursor-not-allowed opacity-80`;
  return `${base} bg-emerald-200 border-emerald-500 hover:bg-emerald-300`;
}

// ─── Build a lookup: "row,col" → table entry ──────────────────────────────────
function buildCellMap(
  plan: IFloorPlanWithAvailability
): Map<string, IFloorPlanTableWithAvailability> {
  const map = new Map<string, IFloorPlanTableWithAvailability>();
  for (const table of plan.tables) {
    for (const cell of table.cells) {
      map.set(`${cell.row},${cell.col}`, table);
    }
  }
  return map;
}

// ─── Single floor plan grid ───────────────────────────────────────────────────
function FloorPlanGrid({
  plan,
  selectedTableDocId,
  onSelectTable,
}: {
  plan: IFloorPlanWithAvailability;
  selectedTableDocId: string;
  onSelectTable: (t: TableSlot) => void;
}) {
  const cellMap = buildCellMap(plan);

  const availableCount = plan.tables.filter((t) => t.available).length;

  function handleCellClick(tableEntry: IFloorPlanTableWithAvailability) {
    if (!tableEntry.available) {
      toast.info(`Table ${tableEntry.tableNumber} is already booked for this slot.`, {
        description: "Choose a green table.",
      });
      return;
    }
    onSelectTable({
      _id: tableEntry.tableDocId,
      number: tableEntry.tableNumber,
      capacity: tableEntry.cells.length,
      available: tableEntry.available,
    });
  }

  return (
    <div className="floor-plan-section">
      {/* Plan name + stats */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">{plan.name}</h3>
        <div className="floor-map-legend" style={{ padding: 0, marginBottom: 0 }}>
          <span className="legend-dot legend-available" />
          <span className="legend-label">Available ({availableCount})</span>
          <span className="legend-dot legend-occupied" />
          <span className="legend-label">Occupied ({plan.tables.length - availableCount})</span>
        </div>
      </div>

      {/* North label */}
      {plan.northLabel && (
        <p className="text-[10px] text-center text-muted-foreground/70 mb-1 font-medium tracking-wide uppercase">
          {plan.northLabel}
        </p>
      )}

      {/* Grid row with West/East labels */}
      <div className="flex items-center gap-2">
        {plan.westLabel && (
          <p className="text-[10px] text-muted-foreground/70 font-medium tracking-wide uppercase shrink-0"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            {plan.westLabel}
          </p>
        )}

        {/* Grid */}
        <div className="overflow-x-auto flex-1">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${plan.cols}, ${CELL}px)`,
              gap: GAP,
            }}
          >
            {Array.from({ length: plan.rows }).map((_, r) =>
              Array.from({ length: plan.cols }).map((_, c) => {
                const tableEntry = cellMap.get(`${r},${c}`);

                if (!tableEntry) {
                  // Floor cell
                  return (
                    <div
                      key={`${r}-${c}`}
                      aria-hidden="true"
                      style={{ width: CELL, height: CELL }}
                      className="rounded-sm border border-dashed border-border/15 bg-transparent"
                    />
                  );
                }

                const isSelected = tableEntry.tableDocId === selectedTableDocId;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(tableEntry)}
                    disabled={!tableEntry.available}
                    aria-label={`Table ${tableEntry.tableNumber}, ${tableEntry.available ? "available" : "occupied"}`}
                    aria-pressed={isSelected}
                    style={{ width: CELL, height: CELL }}
                    className={`rounded-sm ${seatCellClass(tableEntry, isSelected)}`}
                  />
                );
              })
            )}
          </div>
        </div>

        {plan.eastLabel && (
          <p className="text-[10px] text-muted-foreground/70 font-medium tracking-wide uppercase shrink-0"
            style={{ writingMode: "vertical-rl" }}>
            {plan.eastLabel}
          </p>
        )}
      </div>

      {/* South label */}
      {plan.southLabel && (
        <p className="text-[10px] text-center text-muted-foreground/70 mt-1 font-medium tracking-wide uppercase">
          {plan.southLabel}
        </p>
      )}
    </div>
  );
}

// ─── Main FloorMap component ──────────────────────────────────────────────────
export function FloorMap({
  restaurantId,
  date,
  startTime,
  endTime,
  selectedTableDocId,
  onSelectTable,
}: FloorMapProps) {
  const [plans, setPlans] = useState<IFloorPlanWithAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;

    setLoading(true);
    const params = new URLSearchParams({ restaurantId });
    if (date)      params.set("date",      date);
    if (startTime) params.set("startTime", startTime);
    if (endTime)   params.set("endTime",   endTime);

    fetch(`/api/floorplans?${params.toString()}`)
      .then((r) => r.json())
      .then((data: IFloorPlanWithAvailability[]) => setPlans(data))
      .catch(() => toast.error("Failed to load floor plan."))
      .finally(() => setLoading(false));
  }, [restaurantId, date, startTime, endTime]);

  if (loading) {
    return (
      <div className="floor-map-container">
        <div className="floor-map-loading">
          <div className="floor-map-spinner" />
          <span className="text-sm text-muted-foreground mt-3">Loading floor plan…</span>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="floor-map-container">
        <p className="text-sm text-muted-foreground text-center py-8">
          This restaurant hasn&apos;t set up their floor plan yet.
        </p>
      </div>
    );
  }

  const hasNoTables = plans.every((p) => p.tables.length === 0);
  if (hasNoTables) {
    return (
      <div className="floor-map-container">
        <p className="text-sm text-muted-foreground text-center py-8">
          No tables have been added to the floor plan yet.
        </p>
      </div>
    );
  }

  return (
    <div className="floor-map-wrapper">
      {/* All floor plans stacked */}
      <div className="floor-map-container space-y-8">
        <div className="floor-map-grid-bg" aria-hidden="true" />
        <div className="relative z-10 space-y-8">
          {plans.map((plan, idx) => (
            <div key={plan._id}>
              {idx > 0 && <div className="h-px bg-border/40 my-2" />}
              <FloorPlanGrid
                plan={plan}
                selectedTableDocId={selectedTableDocId}
                onSelectTable={onSelectTable}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      {!selectedTableDocId && (
        <p className="text-center text-xs text-muted-foreground mt-2 animate-pulse">
          Tap any green cell to select a table
        </p>
      )}
      {selectedTableDocId && (
        <p className="text-center text-xs text-emerald-700 font-medium mt-2">
          ✓ Table selected — fill in the details below
        </p>
      )}
    </div>
  );
}
