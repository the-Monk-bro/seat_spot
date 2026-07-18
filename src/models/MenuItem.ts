import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IMenuItemDocument extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  restaurant: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    image: { type: String },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.MenuItem) {
  delete (mongoose.models as Record<string, unknown>).MenuItem;
}

const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem ??
  mongoose.model<IMenuItemDocument>("MenuItem", menuItemSchema);

export default MenuItem;
