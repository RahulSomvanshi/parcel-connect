import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateOTP } from "../utils/otp";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import jwt from "jsonwebtoken";
import { sendSMS } from "../utils/sendSMS";
import { sendEmail } from "../utils/sendEmail";

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    
    const { fullName, email, phone, password, role } = req.body;


    // check existing
    const existingUser = await User.findOne({
      $or: [{ email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }


    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate OTP
    const otp = generateOTP();
    
    const allowedRoles = ["user", "admin"];

    let finalRole = "user";

    if (role && allowedRoles.includes(role)) {
      finalRole = role;
    }
    
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: finalRole,
      otp, // store (later hash kar sakte ho)
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      isVerified: false,
    });

    
    // 📱 send OTP (SMS or Email) - Non-blocking
    // Don't await these to avoid blocking registration
    sendSMS(phone, otp).catch(err => {
    });
    
    sendEmail(email, "OTP Verification", `Your OTP is ${otp}`).catch(err => {
    });


    return res.json({
      message: "Registered successfully. OTP sent",
      phone: user.phone, // frontend use karega
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

    // 1. check user by phone or email
    const user = await User.findOne({
      $or: [
        { phone: phone },
        { email: phone } // treat phone field as email if it contains @
      ]
    });

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


      return res.status(400).json({
        message: "OTP sent. Please verify",
        isVerified: false,
      });
    }

    // 4. generate token
    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
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
    await sendSMS(phone, otp);
    await user.save();

    
    return res.json({
      message: "OTP resent successfully"
    });

  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req: any, res: any) => {
  try {
    const users = await User.find().select("-password");

    res.json(users);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};