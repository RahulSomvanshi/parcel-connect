import mongoose, { Schema, Document } from "mongoose";

export interface IParcel extends Document {
  traveller: mongoose.Types.ObjectId | null;  
  sender: mongoose.Types.ObjectId;
  pickup: {
    city: string;
    address: string;
  };
  drop: {
    city: string;
    address: string;
  };
  weight: number;
  description?: string;
  price?: number;
  status: "searching" | "matched" | "in_transit" | "delivered";
  createdAt: Date;
  updatedAt: Date;
}

const parcelSchema = new Schema<IParcel>(
  {
    traveller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickup: {
      city: { type: String, required: true },
      address: { type: String, required: true },
    },

    drop: {
      city: { type: String, required: true },
      address: { type: String, required: true },
    },

    weight: {
      type: Number,
      required: true,
    },

    description: String,
    price: Number,

    status: {
      type: String,
      enum: ["searching", "matched", "in_transit", "delivered"],
      default: "searching",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IParcel>("Parcel", parcelSchema);
