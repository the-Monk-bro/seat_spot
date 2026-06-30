"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import type { ActionResult } from "@/types";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "OWNER"]),
});

export async function registerUser(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password, role } = parsed.data;

  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashedPassword, role });

    return { success: true, data: { email } };
  } catch {
    return { success: false, error: "Registration failed. Please try again." };
  }
}
