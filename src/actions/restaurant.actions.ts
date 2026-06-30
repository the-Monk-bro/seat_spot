"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import Table from "@/models/Table";
import MenuItem from "@/models/MenuItem";
import Reservation from "@/models/Reservation";
import type { ActionResult, RestaurantStatus } from "@/types";

const restaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  cuisine: z.string().min(2, "Cuisine is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(7, "Valid phone number is required"),
});

export async function createRestaurant(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    cuisine: formData.get("cuisine"),
    address: formData.get("address"),
    city: formData.get("city"),
    phone: formData.get("phone"),
  };

  const parsed = restaurantSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const logo = formData.get("logo") as string | null;
  const coverImage = formData.get("coverImage") as string | null;

  try {
    await connectDB();
    const restaurant = await Restaurant.create({
      ...parsed.data,
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      owner: session.user.id,
      status: "PENDING",
    });
    revalidatePath("/owner/restaurants");
    return { success: true, data: { id: restaurant._id.toString() } };
  } catch {
    return { success: false, error: "Failed to create restaurant." };
  }
}

export async function updateRestaurant(
  restaurantId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    cuisine: formData.get("cuisine"),
    address: formData.get("address"),
    city: formData.get("city"),
    phone: formData.get("phone"),
  };

  const parsed = restaurantSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const logo = formData.get("logo") as string | null;
  const coverImage = formData.get("coverImage") as string | null;

  try {
    await connectDB();
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: session.user.id,
    });
    if (!restaurant) return { success: false, error: "Restaurant not found." };

    await Restaurant.findByIdAndUpdate(restaurantId, {
      ...parsed.data,
      ...(logo && { logo }),
      ...(coverImage && { coverImage }),
    });
    revalidatePath(`/owner/restaurants/${restaurantId}`);
    revalidatePath("/owner/restaurants");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update restaurant." };
  }
}

export async function deleteRestaurant(restaurantId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: session.user.id,
    });
    if (!restaurant) return { success: false, error: "Restaurant not found." };

    // Cascade delete related data
    await Table.deleteMany({ restaurant: restaurantId });
    await MenuItem.deleteMany({ restaurant: restaurantId });
    await Reservation.deleteMany({ restaurant: restaurantId });
    await Restaurant.findByIdAndDelete(restaurantId);

    revalidatePath("/owner/restaurants");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete restaurant." };
  }
}

export async function approveRestaurant(
  restaurantId: string,
  status: RestaurantStatus
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return { success: false, error: "Invalid status." };
  }

  try {
    await connectDB();
    await Restaurant.findByIdAndUpdate(restaurantId, { status });
    revalidatePath("/admin/restaurants");
    revalidatePath("/restaurants");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update restaurant status." };
  }
}
