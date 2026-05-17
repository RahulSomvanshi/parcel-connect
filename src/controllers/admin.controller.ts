import Parcel from "../models/parcel.model";
import User from "../models/user.model";
import Traveller from "../models/traveller.model";
import bcrypt from "bcryptjs";
import { splitEarnings, sumParcelPrices } from "../utils/earnings";
import { sendEmail } from "../utils/sendEmail";
import SystemConfig from "../models/system-config.model";
import { DEFAULT_PROHIBITED_KEYWORDS } from "../utils/prohibitedItems";
import { normalizeCityName } from "../utils/city";
import { getPagination, paginationMeta } from "../utils/pagination";

const PROHIBITED_ITEMS_KEY = "prohibited_items";

async function fetchAdminStats() {
  const [
    totalUsers,
    senders,
    travellers,
    admins,
    verifiedUsers,
    totalParcels,
    searchingParcels,
    matchedParcels,
    inTransitParcels,
    deliveredParcels,
    totalTrips,
    activeTrips,
    allParcelsForRevenue,
    recentUsers,
    recentParcels,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "sender" }),
    User.countDocuments({ role: "traveller" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isVerified: true }),
    Parcel.countDocuments(),
    Parcel.countDocuments({ status: { $in: ["PENDING", "OPEN", "searching"] } }),
    Parcel.countDocuments({ status: { $in: ["MATCHED", "ACCEPTED", "matched"] } }),
    Parcel.countDocuments({ status: { $in: ["IN_TRANSIT", "PICKED_UP", "in_transit"] } }),
    Parcel.countDocuments({ status: { $in: ["DELIVERED", "delivered"] } }),
    Traveller.countDocuments(),
    Traveller.countDocuments({ status: { $in: ["ACTIVE", "ONGOING", "scheduled", "in_transit"] } }),
    Parcel.find().select("price status").lean(),
    User.find().select("-password").sort({ createdAt: -1 }).limit(5).lean(),
    Parcel.find()
      .populate("sender", "fullName phone")
      .populate("traveller", "fullName phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const totalRevenue = sumParcelPrices(allParcelsForRevenue);
  const deliveredRevenue = sumParcelPrices(
    allParcelsForRevenue.filter((p) =>
      ["DELIVERED", "delivered"].includes(p.status)
    )
  );
  const { companyShare, travellerEarning } = splitEarnings(deliveredRevenue);

  return {
    users: {
      total: totalUsers,
      senders,
      travellers,
      admins,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
    },
    parcels: {
      total: totalParcels,
      searching: searchingParcels,
      matched: matchedParcels,
      in_transit: inTransitParcels,
      delivered: deliveredParcels,
    },
    trips: {
      total: totalTrips,
      active: activeTrips,
    },
    revenue: {
      total: totalRevenue,
      delivered: deliveredRevenue,
      companyShare,
      travellerShare: travellerEarning,
      companyFeePercent: 20,
    },
    recentUsers,
    recentParcels,
  };
}

async function fetchUsersPage(page: number, limit: number, role?: string) {
  const skip = (page - 1) * limit;
  const filter = role ? { role } : {};
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    pagination: {
      ...paginationMeta(total, page, limit),
    },
  };
}

async function fetchParcelsPage(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [parcels, total] = await Promise.all([
    Parcel.find()
      .populate("sender", "fullName phone role")
      .populate("traveller", "fullName phone role")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Parcel.countDocuments(),
  ]);

  return {
    data: parcels,
    pagination: {
      ...paginationMeta(total, page, limit),
    },
  };
}

/** Single bundle: stats + first page users/parcels + travellers (one round trip) */
export const getAdminDashboard = async (req: any, res: any) => {
  try {
    const { page, limit } = getPagination(req);

    const [stats, users, parcels, travellers] = await Promise.all([
      fetchAdminStats(),
      fetchUsersPage(page, limit),
      fetchParcelsPage(page, limit),
      User.find({ role: "traveller" })
        .select("-password")
        .sort({ fullName: 1 })
        .lean(),
    ]);

    res.json({ stats, users, parcels, travellers });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminStats = async (_req: any, res: any) => {
  try {
    const stats = await fetchAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req: any, res: any) => {
  try {
    const { page, limit } = getPagination(req);
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    res.json(await fetchUsersPage(page, limit, role));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllParcelsAdmin = async (req: any, res: any) => {
  try {
    const { page, limit } = getPagination(req);
    res.json(await fetchParcelsPage(page, limit));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ADMIN: Create a Traveller User (auto-verified)
export const createTravellerUser = async (req: any, res: any) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: "traveller",
      isVerified: true,
    });

    if (user.email) {
      await sendEmail(
        user.email,
        "Welcome to Zippora - Traveller account created",
        `Hi ${user.fullName}, your traveller account was created by admin.\n\nLogin Email: ${user.email}\nLogin Phone: ${user.phone}\nPassword: ${password}\n\nPlease login and change your password after first sign in.`
      );
    }

    return res.status(201).json({
      message: "Traveller created successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ADMIN: Create a Travel Plan for an existing Traveller user
export const createTravelPlan = async (req: any, res: any) => {
  try {
    const { userId, from, to, travelDate, vehicleType, availableWeight } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "traveller") {
      return res.status(400).json({ message: "Valid Traveller User ID is required" });
    }

    const travelPlan = await Traveller.create({
      user: userId,
      travellerId: userId,
      from: String(from).trim(),
      to: String(to).trim(),
      fromCity: String(from).trim(),
      toCity: String(to).trim(),
      normalizedFromCity: normalizeCityName(from),
      normalizedToCity: normalizeCityName(to),
      travelDate,
      vehicleType,
      availableWeight,
      status: "ACTIVE",
      isAvailable: true,
    });

    if (user.email) {
      await sendEmail(
        user.email,
        "New travel trip assigned by admin",
        `Hi ${user.fullName}, admin created a new trip for you.\n\nRoute: ${from} -> ${to}\nDate: ${new Date(travelDate).toDateString()}\nVehicle: ${vehicleType}\nCapacity: ${availableWeight} kg\n\nPlease login and manage parcel matches from your dashboard.`
      );
    }

    return res.status(201).json({
      message: "Travel plan created successfully",
      data: travelPlan,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getProhibitedItemsAdmin = async (_req: any, res: any) => {
  try {
    const config = await SystemConfig.findOne({ key: PROHIBITED_ITEMS_KEY }).lean();
    const customItems = (config?.stringValues || []).map((v) => String(v).trim()).filter(Boolean);
    return res.json({
      defaultItems: DEFAULT_PROHIBITED_KEYWORDS,
      customItems,
      allItems: Array.from(
        new Set([
          ...DEFAULT_PROHIBITED_KEYWORDS,
          ...customItems.map((v) => v.toLowerCase()),
        ])
      ),
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProhibitedItemsAdmin = async (req: any, res: any) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const normalized = Array.from(
      new Set(
        items
          .map((item: unknown) => String(item).trim().toLowerCase())
          .filter((item: string) => item.length > 0)
      )
    );

    const updated = await SystemConfig.findOneAndUpdate(
      { key: PROHIBITED_ITEMS_KEY },
      {
        key: PROHIBITED_ITEMS_KEY,
        stringValues: normalized,
        updatedBy: req.user.userId,
      },
      { new: true, upsert: true }
    ).lean();

    return res.json({
      message: "Prohibited item list updated",
      customItems: updated?.stringValues || [],
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};