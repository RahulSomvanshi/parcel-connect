import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const authMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const tokenWithoutBearer = token.slice(7);
    const decoded: any = jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET as string
    );

    const user = await User.findById(decoded.userId).select("_id role isVerified").lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      ...decoded,
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};