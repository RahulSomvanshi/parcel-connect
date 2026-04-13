import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  console.log(token)
  try {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const decoded: any = jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET as string
    );
    console.log(decoded)
    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};