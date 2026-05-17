import { Request, Response } from "express";
import Parcel from "../models/parcel.model";
import User from "../models/user.model";
import { splitEarnings, sumParcelPrices } from "../utils/earnings";

export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const [totalParcels, totalUsers, routes] = await Promise.all([
      Parcel.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Parcel.aggregate([
        {
          $group: {
            _id: {
              from: "$pickup.city",
              to: "$drop.city",
            },
          },
        },
        { $count: "count" },
      ]),
    ]);

    res.json({
      totalParcels,
      totalUsers,
      activeRoutes: routes[0]?.count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
