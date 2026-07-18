import mongoose, { Document, Schema, Model, Types } from "mongoose";

/** A single grid cell position */
export interface IFloorPlanCellDoc {
  row: number;
  col: number;
}

/** One named table within the floor plan */
export interface IFloorPlanTableDoc {
  tableNumber: number;
  /** Reference to the thin Table document (for Reservation linkage) */
  tableDocId: Types.ObjectId;
  cells: IFloorPlanCellDoc[];
}

export interface IFloorPlanDocument extends Document {
  restaurant: Types.ObjectId;
  name: string;
  rows: number;
  cols: number;
  /** Boundary labels — what's on each side of the floor */
  northLabel: string;
  southLabel: string;
  eastLabel: string;
  westLabel: string;
  tables: IFloorPlanTableDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const cellSchema = new Schema<IFloorPlanCellDoc>(
  { row: { type: Number, required: true }, col: { type: Number, required: true } },
  { _id: false }
);

const floorPlanTableSchema = new Schema<IFloorPlanTableDoc>(
  {
    tableNumber: { type: Number, required: true },
    tableDocId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    cells: { type: [cellSchema], default: [] },
  },
  { _id: false }
);

const floorPlanSchema = new Schema<IFloorPlanDocument>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    rows: { type: Number, required: true, min: 1, max: 60 },
    cols: { type: Number, required: true, min: 1, max: 60 },
    northLabel: { type: String, default: "" },
    southLabel: { type: String, default: "" },
    eastLabel:  { type: String, default: "" },
    westLabel:  { type: String, default: "" },
    tables: { type: [floorPlanTableSchema], default: [] },
  },
  { timestamps: true }
);

const FloorPlan: Model<IFloorPlanDocument> =
  mongoose.models.FloorPlan ??
  mongoose.model<IFloorPlanDocument>("FloorPlan", floorPlanSchema);

export default FloorPlan;
