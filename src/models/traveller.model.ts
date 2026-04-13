import mongoose, { Schema, Document } from "mongoose";

export interface ITraveller extends Document {
  user: mongoose.Types.ObjectId;
  from: string;
  to: string;
  travelDate: Date;
  vehicleType: "bus" | "train" | "car";
  availableWeight: number;
  isAvailable: boolean;
}

const travellerSchema = new Schema<ITraveller>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: { type: String, required: true },
    to: { type: String, required: true },

    travelDate: { type: Date, required: true },

    vehicleType: {
      type: String,
      enum: ["bus", "train", "car"],
      required: true,
    },

    availableWeight: {
      type: Number,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITraveller>("Traveller", travellerSchema);