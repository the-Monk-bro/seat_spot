"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Table from "@/models/Table";
import Restaurant from "@/models/Restaurant";
import Reservation from "@/models/Reservation";
import type { ActionResult } from "@/types";

const tableSchema = z.object({
  number: z.coerce.number().int().min(1, "Table number must be at least 1"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
});

async function verifyOwnership(restaurantId: string, ownerId: string) {
  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    owner: ownerId,
  });
  return !!restaurant;
}

export async function createTable(
  restaurantId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = tableSchema.safeParse({
    number: formData.get("number"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    const table = await Table.create({
      ...parsed.data,
      restaurant: restaurantId,
    });
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true, data: { id: table._id.toString() } };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { success: false, error: "Table number already exists in this restaurant." };
    }
    return { success: false, error: "Failed to create table." };
  }
}

export async function updateTable(
  tableId: string,
  restaurantId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = tableSchema.safeParse({
    number: formData.get("number"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    await Table.findByIdAndUpdate(tableId, parsed.data);
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update table." };
  }
}

export async function deleteTable(
  tableId: string,
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

    await Reservation.deleteMany({ table: tableId });
    await Table.findByIdAndDelete(tableId);
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete table." };
  }
}
