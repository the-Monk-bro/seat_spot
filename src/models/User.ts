import mongoose, { Document, Schema, Model } from "mongoose";
import type { UserRole } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string; // optional for Google OAuth users
  role: UserRole;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false }, // never returned by default
    role: {
      type: String,
      enum: ["CUSTOMER", "OWNER", "ADMIN"],
      default: "CUSTOMER",
    },
    image: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", userSchema);

export default User;
