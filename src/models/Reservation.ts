import mongoose, { Document, Schema, Model, Types } from "mongoose";
import type { ReservationStatus } from "@/types";

export interface IReservationDocument extends Document {
  date: string; // stored as YYYY-MM-DD string for easy comparison
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  user: Types.ObjectId;
  table: Types.ObjectId;
  restaurant: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservationDocument>(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true }, // HH:MM
    partySize: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    notes: { type: String },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    table: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for conflict detection: table + date queries are fast
reservationSchema.index({ table: 1, date: 1 });
// Index for customer reservation history
reservationSchema.index({ user: 1, date: -1 });
// Index for restaurant-level reservation views
reservationSchema.index({ restaurant: 1, date: -1 });

const Reservation: Model<IReservationDocument> =
  mongoose.models.Reservation ??
  mongoose.model<IReservationDocument>("Reservation", reservationSchema);

export default Reservation;
