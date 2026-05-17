import mongoose, { Schema, Document } from "mongoose";

export interface ITraveller extends Document {
  user: mongoose.Types.ObjectId;
  travellerId: mongoose.Types.ObjectId;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  normalizedFromCity: string;
  normalizedToCity: string;
  travelDate: Date;
  vehicleType: "bus" | "train" | "car";
  availableWeight: number;
  isAvailable: boolean;
  status:
    | "PLANNED"
    | "ACTIVE"
    | "IN_TRANSIT"
    | "COMPLETED"
    | "CANCELLED"
    | "scheduled"
    | "in_transit"
    | "completed"
    | "cancelled";
}

const travellerSchema = new Schema<ITraveller>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: { type: String, required: true },
    to: { type: String, required: true },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    normalizedFromCity: { type: String, required: true },
    normalizedToCity: { type: String, required: true },

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

    status: {
      type: String,
      enum: [
        "PLANNED",
        "ACTIVE",
        "IN_TRANSIT",
        "COMPLETED",
        "CANCELLED",
        "scheduled",
        "in_transit",
        "completed",
        "cancelled",
      ],
      default: "PLANNED",
    },
  },
  { timestamps: true }
);

travellerSchema.index({ normalizedFromCity: 1, normalizedToCity: 1, status: 1 });
travellerSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model<ITraveller>("Traveller", travellerSchema);