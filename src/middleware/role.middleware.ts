import { Response, NextFunction } from "express";

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    console.log("req.user?.role",req.user?.role);
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};