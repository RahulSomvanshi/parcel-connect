import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateOTP } from "../utils/otp";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // check existing
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate OTP
    const otp = generateOTP();
    const allowedRoles = ["sender", "traveller"];

    let finalRole = "sender";

    if (role && allowedRoles.includes(role)) {
      finalRole = role;
    }
    await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: finalRole,
      otp,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log("OTP:", otp); // later SMS/email

    return res.json({
      message: "Registered successfully. Verify OTP",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// VERIFY OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user || user.otp !== otp || user.otpExpiry! < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;

    await user.save();

    return res.json({ message: "Account verified successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    // 1. check user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2. check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. check verified

    if (!user.isVerified) {
      const otp = generateOTP();

      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      console.log("New OTP:", otp);

      return res.status(400).json({
        message: "OTP sent. Please verify",
        isVerified: false,
      });
    }

    // 4. generate token
    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;

    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET as string,
    );

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateToken(user._id.toString(), user.role);

    return res.json({ accessToken: newAccessToken });
  } catch {
    return res.status(403).json({ message: "Token expired" });
  }
};



export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Already verified" });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    console.log("New OTP:", otp);

    return res.json({
      message: "OTP resent successfully"
    });

  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};