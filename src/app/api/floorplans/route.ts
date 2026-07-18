import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FloorPlan from "@/models/FloorPlan";
import Reservation from "@/models/Reservation";
import { timeRangesOverlap } from "@/lib/utils";
import type { IFloorPlanWithAvailability } from "@/types";

/**
 * GET /api/floorplans?restaurantId=X[&date=Y&startTime=Z&endTime=W]
 *
 * Returns all floor plans for a restaurant.
 * If date + startTime + endTime are provided, each table in each plan
 * also gets an `available` boolean based on existing reservations.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
  }

  await connectDB();

  const plans = await FloorPlan.find({ restaurant: restaurantId })
    .sort({ createdAt: 1 })
    .lean();

  // If no slot provided → all tables are available (just show the layout)
  if (!date || !startTime || !endTime) {
    const result: IFloorPlanWithAvailability[] = plans.map((p) => ({
      _id: p._id.toString(),
      restaurant: p.restaurant.toString(),
      name: p.name,
      rows: p.rows,
      cols: p.cols,
      northLabel: p.northLabel,
      southLabel: p.southLabel,
      eastLabel: p.eastLabel,
      westLabel: p.westLabel,
      tables: p.tables.map((t) => ({
        tableNumber: t.tableNumber,
        tableDocId: t.tableDocId.toString(),
        cells: t.cells,
        available: true,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    return NextResponse.json(result);
  }

  // Collect all tableDocIds across all plans for this restaurant
  const allTableDocIds = plans.flatMap((p) =>
    p.tables.map((t) => t.tableDocId.toString())
  );

  // Fetch reservations for the given date that overlap the requested slot
  const reservations = await Reservation.find({
    restaurant: restaurantId,
    date,
    status: { $ne: "CANCELLED" },
  }).lean();

  const bookedTableIds = new Set(
    reservations
      .filter((r) => timeRangesOverlap(startTime, endTime, r.startTime, r.endTime))
      .map((r) => r.table.toString())
  );

  const result: IFloorPlanWithAvailability[] = plans.map((p) => ({
    _id: p._id.toString(),
    restaurant: p.restaurant.toString(),
    name: p.name,
    rows: p.rows,
    cols: p.cols,
    northLabel: p.northLabel,
    southLabel: p.southLabel,
    eastLabel: p.eastLabel,
    westLabel: p.westLabel,
    tables: p.tables.map((t) => ({
      tableNumber: t.tableNumber,
      tableDocId: t.tableDocId.toString(),
      cells: t.cells,
      available: !bookedTableIds.has(t.tableDocId.toString()),
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Suppress unused variable warning
  void allTableDocIds;

  return NextResponse.json(result);
}
