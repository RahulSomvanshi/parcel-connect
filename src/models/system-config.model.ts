import mongoose, { Schema, Document } from "mongoose";

export interface ISystemConfig extends Document {
  key: string;
  stringValues: string[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, unique: true },
    stringValues: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemConfig>("SystemConfig", systemConfigSchema);
