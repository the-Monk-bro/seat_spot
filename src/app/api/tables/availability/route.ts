import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Table from "@/models/Table";
import Reservation from "@/models/Reservation";
import { timeRangesOverlap } from "@/lib/utils";

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

  const tables = await Table.find({ restaurant: restaurantId })
    .sort({ number: 1 })
    .lean();

  // If no date/time provided, return all tables as available (for initial map render)
  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      tables.map((t) => ({
        _id: t._id.toString(),
        number: t.number,
        capacity: t.capacity,
        available: true,
      }))
    );
  }

  // Fetch all non-cancelled reservations for the restaurant on the given date
  const reservations = await Reservation.find({
    restaurant: restaurantId,
    date,
    status: { $ne: "CANCELLED" },
  }).lean();

  const result = tables.map((table) => {
    const tableId = table._id.toString();
    const isOccupied = reservations.some(
      (r) =>
        r.table.toString() === tableId &&
        timeRangesOverlap(startTime, endTime, r.startTime, r.endTime)
    );
    return {
      _id: tableId,
      number: table.number,
      capacity: table.capacity,
      available: !isOccupied,
    };
  });

  return NextResponse.json(result);
}
