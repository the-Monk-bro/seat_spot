import mongoose, { Document, Schema, Model, Types } from "mongoose";
import type { RestaurantStatus } from "@/types";

export interface IRestaurantDocument extends Document {
  name: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  phone: string;
  logo?: string;
  coverImage?: string;
  status: RestaurantStatus;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurantDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    cuisine: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true },
    logo: { type: String },
    coverImage: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Restaurant: Model<IRestaurantDocument> =
  mongoose.models.Restaurant ??
  mongoose.model<IRestaurantDocument>("Restaurant", restaurantSchema);

export default Restaurant;
