import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ITableDocument extends Document {
  number: number;
  capacity: number;
  restaurant: Types.ObjectId;
  /** Set when this Table belongs to a FloorPlan. Null for legacy standalone tables. */
  floorPlanId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITableDocument>(
  {
    number: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    floorPlanId: {
      type: Schema.Types.ObjectId,
      ref: "FloorPlan",
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure table numbers are unique per restaurant
tableSchema.index({ restaurant: 1, number: 1 }, { unique: true });

const Table: Model<ITableDocument> =
  mongoose.models.Table ?? mongoose.model<ITableDocument>("Table", tableSchema);

export default Table;
