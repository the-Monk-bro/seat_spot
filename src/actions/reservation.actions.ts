"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Reservation from "@/models/Reservation";
import Table from "@/models/Table";
import Restaurant from "@/models/Restaurant";
import { timeRangesOverlap } from "@/lib/utils";
import type { ActionResult } from "@/types";

const reservationSchema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  partySize: z.coerce.number().int().min(1),
  notes: z.string().optional(),
});

export async function createReservation(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "CUSTOMER") {
    return { success: false, error: "You must be logged in as a customer to reserve." };
  }

  const parsed = reservationSchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    tableId: formData.get("tableId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    partySize: formData.get("partySize"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { restaurantId, tableId, date, startTime, endTime, partySize, notes } = parsed.data;

  if (startTime >= endTime) {
    return { success: false, error: "End time must be after start time." };
  }

  // Prevent past reservations
  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return { success: false, error: "Cannot reserve for a past date." };
  }

  try {
    await connectDB();

    // Verify restaurant is APPROVED
    const restaurant = await Restaurant.findOne({ _id: restaurantId, status: "APPROVED" });
    if (!restaurant) return { success: false, error: "Restaurant is not available." };

    // Verify table belongs to restaurant and has enough capacity
    const table = await Table.findOne({ _id: tableId, restaurant: restaurantId });
    if (!table) return { success: false, error: "Table not found." };
    if (table.capacity < partySize) {
      return { success: false, error: `This table only seats ${table.capacity} guests.` };
    }

    // Server-side double-booking check
    const existingReservations = await Reservation.find({
      table: tableId,
      date,
      status: { $ne: "CANCELLED" },
    });

    const hasConflict = existingReservations.some((r) =>
      timeRangesOverlap(startTime, endTime, r.startTime, r.endTime)
    );

    if (hasConflict) {
      return { success: false, error: "This table is already booked for the selected time slot." };
    }

    const reservation = await Reservation.create({
      date,
      startTime,
      endTime,
      partySize,
      notes,
      user: session.user.id,
      table: tableId,
      restaurant: restaurantId,
      status: "PENDING",
    });

    revalidatePath("/customer/reservations");
    return { success: true, data: { id: reservation._id.toString() } };
  } catch {
    return { success: false, error: "Failed to create reservation. Please try again." };
  }
}

export async function cancelReservation(reservationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return { success: false, error: "Reservation not found." };

    // Customers can only cancel their own reservations
    if (
      session.user.role === "CUSTOMER" &&
      reservation.user.toString() !== session.user.id
    ) {
      return { success: false, error: "Unauthorized" };
    }

    // Owners can only cancel reservations at their restaurants
    if (session.user.role === "OWNER") {
      const restaurant = await Restaurant.findOne({
        _id: reservation.restaurant,
        owner: session.user.id,
      });
      if (!restaurant) return { success: false, error: "Unauthorized" };
    }

    if (reservation.status === "CANCELLED") {
      return { success: false, error: "Reservation is already cancelled." };
    }

    await Reservation.findByIdAndUpdate(reservationId, { status: "CANCELLED" });
    revalidatePath("/customer/reservations");
    revalidatePath("/owner/reservations");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to cancel reservation." };
  }
}

export async function confirmReservation(reservationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return { success: false, error: "Reservation not found." };

    const restaurant = await Restaurant.findOne({
      _id: reservation.restaurant,
      owner: session.user.id,
    });
    if (!restaurant) return { success: false, error: "Unauthorized" };

    await Reservation.findByIdAndUpdate(reservationId, { status: "CONFIRMED" });
    revalidatePath("/owner/reservations");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to confirm reservation." };
  }
}
