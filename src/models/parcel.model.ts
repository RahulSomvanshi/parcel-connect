import mongoose, { Schema, Document } from "mongoose";
import { PARCEL_STATUSES, ParcelStatus } from "../constants/parcel";

export interface IParcel extends Document {
  traveller: mongoose.Types.ObjectId | null;
  sender: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  assignedTripId: mongoose.Types.ObjectId | null;
  pickupCity: string;
  dropCity: string;
  normalizedPickupCity: string;
  normalizedDropCity: string;
  pickup: {
    city: string;
    address: string;
  };
  drop: {
    city: string;
    address: string;
  };
  weight: number;
  parcelDate: Date;
  preferredTravelDate?: Date;
  description?: string;
  price?: number;
  status: ParcelStatus | string;
  isFlagged: boolean;
  flaggedKeywords: string[];
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
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTripId: {
      type: Schema.Types.ObjectId,
      ref: "Traveller",
      default: null,
    },
    pickupCity: { type: String, required: true },
    dropCity: { type: String, required: true },
    normalizedPickupCity: { type: String, required: true },
    normalizedDropCity: { type: String, required: true },
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
    parcelDate: {
      type: Date,
      required: true,
    },
    preferredTravelDate: {
      type: Date,
      default: null,
    },
    description: String,
    price: Number,
    status: {
      type: String,
      enum: [
        ...PARCEL_STATUSES,
        "PENDING",
        "MATCHED",
        "searching",
        "matched",
        "in_transit",
        "delivered",
      ],
      default: "PENDING",
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedKeywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

parcelSchema.index({ sender: 1, status: 1, createdAt: -1 });
parcelSchema.index({ traveller: 1, status: 1, createdAt: -1 });
parcelSchema.index({ status: 1, "pickup.city": 1, "drop.city": 1 });
parcelSchema.index({ normalizedPickupCity: 1, normalizedDropCity: 1, status: 1 });
parcelSchema.index({ normalizedPickupCity: 1, normalizedDropCity: 1, parcelDate: 1, status: 1 });
parcelSchema.index({ createdAt: -1 });

export default mongoose.model<IParcel>("Parcel", parcelSchema);
