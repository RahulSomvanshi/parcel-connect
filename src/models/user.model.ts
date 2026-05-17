import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email?: string;
  phone: string;
  password: string;
  role: "admin" | "sender" | "traveller";
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "sender", "traveller"],
      default: "sender",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpiry: Date,
    refreshToken: String,
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);