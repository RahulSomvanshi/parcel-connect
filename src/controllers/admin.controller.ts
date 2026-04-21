import Parcel from "../models/parcel.model";
import User from "../models/user.model";


export const getAllUsers = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      User.countDocuments()
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ADMIN: get all parcels with pagination
export const getAllParcelsAdmin = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [parcels, total] = await Promise.all([
      Parcel.find()
        .populate("sender", "fullName phone role")
        .populate("traveller", "fullName phone role")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      Parcel.countDocuments()
    ]);

    res.json({
      data: parcels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};