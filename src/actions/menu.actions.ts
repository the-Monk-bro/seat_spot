"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import MenuItem from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
import type { ActionResult } from "@/types";

const menuItemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  category: z.string().min(2, "Category is required"),
});

async function verifyOwnership(restaurantId: string, ownerId: string) {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, owner: ownerId });
  return !!restaurant;
}

export async function createMenuItem(
  restaurantId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const image = formData.get("image") as string | null;

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    const item = await MenuItem.create({
      ...parsed.data,
      restaurant: restaurantId,
      ...(image && { image }),
    });
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    revalidatePath(`/restaurants/${restaurantId}`);
    return { success: true, data: { id: item._id.toString() } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[createMenuItem]", msg);
    return { success: false, error: msg };
  }
}

export async function updateMenuItem(
  itemId: string,
  restaurantId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const image = formData.get("image") as string | null;

  try {
    await connectDB();
    const isOwner = await verifyOwnership(restaurantId, session.user.id);
    if (!isOwner) return { success: false, error: "Restaurant not found." };

    await MenuItem.findByIdAndUpdate(itemId, {
      ...parsed.data,
      ...(image && { image }),
    });
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    revalidatePath(`/restaurants/${restaurantId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[updateMenuItem]", msg);
    return { success: false, error: msg };
  }
}

export async function deleteMenuItem(
  itemId: string,
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

    await MenuItem.findByIdAndDelete(itemId);
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    revalidatePath(`/restaurants/${restaurantId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete menu item." };
  }
}
