"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import FloorPlan from "@/models/FloorPlan";
import Table from "@/models/Table";
import Reservation from "@/models/Reservation";
import Restaurant from "@/models/Restaurant";
import type { ActionResult } from "@/types";

interface FloorPlanTableInput {
  tableNumber: number;
  cells: { row: number; col: number }[];
}

interface FloorPlanInput {
  name: string;
  rows: number;
  cols: number;
  northLabel: string;
  southLabel: string;
  eastLabel: string;
  westLabel: string;
  tables: FloorPlanTableInput[];
}

async function verifyOwnership(restaurantId: string, ownerId: string) {
  const r = await Restaurant.findOne({ _id: restaurantId, owner: ownerId });
  return !!r;
}

/**
 * Create a brand-new (empty) floor plan with a name and dimensions.
 * The owner then opens the editor to draw seat cells and assign tables.
 */
export async function createFloorPlan(
  restaurantId: string,
  name: string,
  rows: number,
  cols: number
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    if (rows < 1 || rows > 60 || cols < 1 || cols > 60) {
      return { success: false, error: "Grid dimensions must be between 1 and 60." };
    }
    if (!name.trim()) {
      return { success: false, error: "Floor plan name is required." };
    }

    const plan = await FloorPlan.create({
      restaurant: restaurantId,
      name: name.trim(),
      rows,
      cols,
      northLabel: "",
      southLabel: "",
      eastLabel: "",
      westLabel: "",
      tables: [],
    });

    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true, data: { id: plan._id.toString() } };
  } catch {
    return { success: false, error: "Failed to create floor plan." };
  }
}

/**
 * Save the full state of a floor plan after the owner edits it.
 * - Upserts thin Table documents for each table group
 * - Deletes Table docs (+ their Reservations) for groups removed from the plan
 * - Updates the FloorPlan document
 */
export async function updateFloorPlan(
  floorPlanId: string,
  restaurantId: string,
  data: FloorPlanInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    const plan = await FloorPlan.findOne({ _id: floorPlanId, restaurant: restaurantId });
    if (!plan) return { success: false, error: "Floor plan not found." };

    // Determine which table numbers are being removed
    const previousTableNumbers = new Set(plan.tables.map((t: { tableNumber: number }) => t.tableNumber));
    const newTableNumbers = new Set(data.tables.map((t) => t.tableNumber));
    const removedNumbers = [...previousTableNumbers].filter((n) => !newTableNumbers.has(n));

    // Delete Table docs + Reservations for removed tables
    if (removedNumbers.length > 0) {
      const removedTables = await Table.find({
        floorPlanId,
        number: { $in: removedNumbers },
      });
      const removedIds = removedTables.map((t) => t._id);
      await Reservation.deleteMany({ table: { $in: removedIds } });
      await Table.deleteMany({ _id: { $in: removedIds } });
    }

    // Upsert Table docs for each table in the new layout
    const updatedTables = [];
    for (const tableInput of data.tables) {
      const capacity = tableInput.cells.length;
      // Try to find existing Table doc for this floorPlan + tableNumber
      let tableDoc = await Table.findOne({
        floorPlanId,
        number: tableInput.tableNumber,
        restaurant: restaurantId,
      });

      if (tableDoc) {
        tableDoc.capacity = capacity;
        await tableDoc.save();
      } else {
        // Check for number collision within this restaurant (unique index)
        const existingWithNumber = await Table.findOne({
          restaurant: restaurantId,
          number: tableInput.tableNumber,
        });
        if (existingWithNumber && existingWithNumber.floorPlanId?.toString() !== floorPlanId) {
          return {
            success: false,
            error: `Table number ${tableInput.tableNumber} is already used in another floor plan.`,
          };
        }
        tableDoc = await Table.create({
          number: tableInput.tableNumber,
          capacity,
          restaurant: restaurantId,
          floorPlanId,
        });
      }

      updatedTables.push({
        tableNumber: tableInput.tableNumber,
        tableDocId: tableDoc._id,
        cells: tableInput.cells,
      });
    }

    // Save updated FloorPlan
    await FloorPlan.findByIdAndUpdate(floorPlanId, {
      name: data.name.trim(),
      rows: data.rows,
      cols: data.cols,
      northLabel: data.northLabel,
      southLabel: data.southLabel,
      eastLabel: data.eastLabel,
      westLabel: data.westLabel,
      tables: updatedTables,
    });

    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { success: false, error: "A table with that number already exists in this restaurant." };
    }
    return { success: false, error: "Failed to save floor plan." };
  }
}

/**
 * Delete a floor plan entirely:
 * - Deletes all Reservations for its tables
 * - Deletes all thin Table documents
 * - Deletes the FloorPlan document
 */
export async function deleteFloorPlan(
  floorPlanId: string,
  restaurantId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    const plan = await FloorPlan.findOne({ _id: floorPlanId, restaurant: restaurantId });
    if (!plan) return { success: false, error: "Floor plan not found." };

    // Get all Table docs that belong to this floor plan
    const tableDocs = await Table.find({ floorPlanId });
    const tableIds = tableDocs.map((t) => t._id);

    // Delete reservations for those tables
    if (tableIds.length > 0) {
      await Reservation.deleteMany({ table: { $in: tableIds } });
    }

    // Delete the Table docs
    await Table.deleteMany({ floorPlanId });

    // Delete the FloorPlan
    await FloorPlan.findByIdAndDelete(floorPlanId);

    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete floor plan." };
  }
}
