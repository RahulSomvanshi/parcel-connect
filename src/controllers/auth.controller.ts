import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateOTP } from "../utils/otp";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import jwt from "jsonwebtoken";
import { sendSMS } from "../utils/sendSMS";
import { sendEmail } from "../utils/sendEmail";

const formatAuthUser = (user: InstanceType<typeof User>) => ({
  _id: user._id.toString(),
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

const OTP_EXPIRY_MS = 5 * 60 * 1000;

const issueOtpForUser = async (user: InstanceType<typeof User>): Promise<string> => {
  const otp = generateOTP();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  return otp;
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    
    const { fullName, email, phone, password, role } = req.body;


    const existingUser = await User.findOne({
      $or: [
        { phone },
        ...(email ? [{ email }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpPlain = generateOTP();
    const otp = await bcrypt.hash(otpPlain, 10);

    // Public registration: sender or traveller only (admin via seed)
    const publicRoles = ["sender", "traveller"];
    let finalRole = "sender";
    if (role && publicRoles.includes(role)) {
      finalRole = role;
    }
    
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: finalRole,
      otp, // store (later hash kar sakte ho)
      otpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
      isVerified: false,
    });

    
    // 📱 send OTP (SMS or Email) - Non-blocking
    // Don't await these to avoid blocking registration
    sendSMS(phone, otpPlain).catch(err => {
    });
    
    if (email) {
      sendEmail(email, "OTP Verification", `Your OTP is ${otpPlain}`).catch(err => {
      });
    }


    return res.json({
      message: "Registered successfully. OTP sent",
      phone: user.phone,
      role: user.role,
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

    if (!user || !user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;

    await user.save();

    return res.json({
      message: "Account verified successfully",
      token,
      refreshToken,
      user: formatAuthUser(user),
    });
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
      const otp = await issueOtpForUser(user);
      await user.save();

      sendSMS(user.phone, otp).catch(() => {});
      if (user.email) {
        sendEmail(user.email, "OTP Verification", `Your OTP is ${otp}`).catch(() => {});
      }

      return res.status(400).json({
        message: "OTP sent. Please verify",
        isVerified: false,
        phone: user.phone,
        role: user.role,
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
      user: formatAuthUser(user),
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: bodyRefreshToken } = req.body;

  if (!bodyRefreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded: any = jwt.verify(
      bodyRefreshToken,
      process.env.REFRESH_SECRET as string,
    );

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== bodyRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const token = generateToken(user._id.toString(), user.role);

    return res.json({
      token,
      refreshToken: bodyRefreshToken,
      user: formatAuthUser(user),
    });
  } catch {
    return res.status(403).json({ message: "Token expired" });
  }
};

/** Current user from DB — source of truth for role after refresh */
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -otp -otpExpiry -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: formatAuthUser(user) });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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

    const otp = await issueOtpForUser(user);
    await sendSMS(phone, otp);
    await user.save();

    
    return res.json({
      message: "OTP resent successfully"
    });

  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
