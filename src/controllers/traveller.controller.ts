import { Request, Response } from "express";
import mongoose from "mongoose";
import Traveller from "../models/traveller.model";
import Parcel from "../models/parcel.model";
import {
  COMPANY_FEE_PERCENT,
  TRAVELLER_SHARE_PERCENT,
  splitEarnings,
  sumParcelPrices,
} from "../utils/earnings";
import { getCitySearchValues, normalizeCityName } from "../utils/city";
import { getPagination, paginationMeta } from "../utils/pagination";

const ACTIVE_TRIP_STATUSES = ["PLANNED", "ACTIVE", "IN_TRANSIT", "scheduled", "in_transit"];
const DELIVERED_PARCEL_STATUSES = ["DELIVERED", "delivered"];
const ACTIVE_PARCEL_STATUSES = ["MATCHED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT", "matched", "in_transit"];

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const getUtcDayRange = (date: Date | string) => {
  const value = new Date(date);
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
};

const parcelDateMatchFilter = (start: Date, end: Date) => ({
  $or: [
    { preferredTravelDate: { $gte: start, $lte: end } },
    {
      $and: [
        {
          $or: [
            { preferredTravelDate: { $exists: false } },
            { preferredTravelDate: null },
          ],
        },
        { parcelDate: { $gte: start, $lte: end } },
      ],
    },
  ],
});

// CREATE
export const createTraveller = async (req: any, res: Response) => {
  try {
    const fromCity = String(req.body.from || "").trim();
    const toCity = String(req.body.to || "").trim();
    const availableWeight = Number(req.body.availableWeight);
    if (!fromCity || !toCity || !availableWeight) {
      return res.status(400).json({ message: "from, to and availableWeight are required" });
    }

    const data = await Traveller.create({
      ...req.body,
      user: req.user.userId,
      travellerId: req.user.userId,
      from: fromCity,
      to: toCity,
      fromCity,
      toCity,
      normalizedFromCity: normalizeCityName(fromCity),
      normalizedToCity: normalizeCityName(toCity),
      status: "PLANNED",
      isAvailable: true,
      availableWeight,
    });

    const { start, end } = getUtcDayRange(data.travelDate);
    const matchingParcels = await Parcel.find({
      normalizedPickupCity: { $in: getCitySearchValues(fromCity) },
      normalizedDropCity: { $in: getCitySearchValues(toCity) },
      status: { $in: ["PENDING", "OPEN", "searching"] },
      traveller: null,
      weight: { $lte: data.availableWeight },
      ...parcelDateMatchFilter(start, end),
    })
      .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({ trip: data, matchingParcels });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL (my plans)
export const getMyTravellers = async (req: any, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = { user: req.user.userId };
    const [data, total] = await Promise.all([
      Traveller.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Traveller.countDocuments(filter),
    ]);

    res.json({ data, pagination: paginationMeta(total, page, limit) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTravellerDashboard = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = getPagination(req);

    const tripsFilter = { user: userId };
    const assignedFilter = { traveller: userObjectId };

    const [trips, totalTrips, recentDeliveries, parcelStats, activeTrips] = await Promise.all([
      Traveller.find(tripsFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Traveller.countDocuments(tripsFilter),
      Parcel.find(assignedFilter)
        .populate("sender", "fullName phone")
        .sort({ createdAt: -1 })
        .limit(2)
        .lean(),
      Parcel.aggregate([
        { $match: assignedFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalPrice: { $sum: { $ifNull: ["$price", 0] } },
          },
        },
      ]),
      Traveller.countDocuments({
        user: userId,
        status: { $in: ACTIVE_TRIP_STATUSES },
      }),
    ]);

    const activeTrip = trips.find(
      (trip) => trip.isAvailable !== false && ACTIVE_TRIP_STATUSES.includes(String(trip.status || ""))
    );

    let topMatching: any[] = [];
    if (activeTrip) {
      const { start, end } = getUtcDayRange(activeTrip.travelDate);

      const pickupCities = getCitySearchValues(activeTrip.normalizedFromCity || activeTrip.from);
      const dropCities = getCitySearchValues(activeTrip.normalizedToCity || activeTrip.to);

      topMatching = await Parcel.find({
        status: { $in: ["PENDING", "OPEN", "searching"] },
        traveller: null,
        normalizedPickupCity: { $in: pickupCities },
        normalizedDropCity: { $in: dropCities },
        weight: { $lte: activeTrip.availableWeight },
        ...parcelDateMatchFilter(start, end),
      })
        .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
        .sort({ createdAt: -1 })
        .limit(1)
        .lean();
    }

    let totalDeliveries = 0;
    let completedDeliveries = 0;
    let activeDeliveries = 0;
    let completedValue = 0;
    let pendingValue = 0;

    for (const item of parcelStats) {
      const status = String(item._id || "");
      const count = Number(item.count || 0);
      const totalPrice = Number(item.totalPrice || 0);
      totalDeliveries += count;

      if (DELIVERED_PARCEL_STATUSES.includes(status)) {
        completedDeliveries += count;
        completedValue += totalPrice;
      }

      if (ACTIVE_PARCEL_STATUSES.includes(status)) {
        activeDeliveries += count;
        pendingValue += totalPrice;
      }
    }

    const completedSplit = splitEarnings(completedValue);
    const pendingSplit = splitEarnings(pendingValue);

    return res.json({
      trips: {
        data: trips,
        pagination: paginationMeta(totalTrips, page, limit),
      },
      recentDeliveries,
      topMatching,
      stats: {
        totalDeliveries,
        completedDeliveries,
        activeDeliveries,
        totalTrips,
        activeTrips,
        totalParcelValue: completedValue + pendingValue,
        companyShare: completedSplit.companyShare + pendingSplit.companyShare,
        travellerEarnings: completedSplit.travellerEarning,
        pendingEarnings: pendingSplit.travellerEarning,
        companyFeePercent: COMPANY_FEE_PERCENT,
        travellerSharePercent: TRAVELLER_SHARE_PERCENT,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// GET SINGLE
export const getTravellerById = async (req: any, res: Response) => {
  try {
    const data = await Traveller.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).lean();

    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateTraveller = async (req: any, res: Response) => {
  try {
    const data = await Traveller.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(400).json({ message: "Cannot update" });
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteTraveller = async (req: any, res: Response) => {
  try {
    const data = await Traveller.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!data) {
      return res.status(400).json({ message: "Cannot delete" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



// 🔥 MATCHING PARCELS
export const getMatchingParcels = async (req: any, res: Response) => {
  try {
    const { tripId } = req.query;
    const { page, limit, skip } = getPagination(req);

    const travellerQuery: Record<string, unknown> = {
      user: req.user.userId,
      isAvailable: true,
    };

    if (tripId) {
      travellerQuery._id = tripId;
    }

    const traveller = await Traveller.findOne(travellerQuery).sort({ createdAt: -1 }).lean();

    if (!traveller) {
      return res.status(400).json({
        message: tripId
          ? "Travel plan not found or unavailable"
          : "No active travel plan found. Add a trip first.",
      });
    }

    const { start, end } = getUtcDayRange(traveller.travelDate);

    const pickupCities = getCitySearchValues(traveller.normalizedFromCity || traveller.from);
    const dropCities = getCitySearchValues(traveller.normalizedToCity || traveller.to);

    const filter = {
      status: { $in: ["PENDING", "OPEN", "searching"] },
      traveller: null,
      normalizedPickupCity: { $in: pickupCities },
      normalizedDropCity: { $in: dropCities },
      weight: { $lte: traveller.availableWeight },
      ...parcelDateMatchFilter(start, end),
    };

    const [parcels, total] = await Promise.all([
      Parcel.find(filter)
        .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Parcel.countDocuments(filter),
    ]);
  

    res.json({ data: parcels, pagination: paginationMeta(total, page, limit) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptParcelForTrip = async (req: any, res: Response) => {
  try {
    const { tripId, parcelId } = req.params;
    const trip = await Traveller.findOne({
      _id: tripId,
      user: req.user.userId,
      status: { $in: ACTIVE_TRIP_STATUSES },
      isAvailable: true,
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or inactive" });
    }

    const parcel = await Parcel.findOne({ _id: parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }
    if (!["PENDING", "OPEN", "searching"].includes(parcel.status)) {
      return res.status(400).json({ message: "Parcel already matched" });
    }
    if (parcel.weight > trip.availableWeight) {
      return res.status(400).json({ message: "Trip does not have enough available weight" });
    }

    const updatedParcel = await Parcel.findOneAndUpdate(
      { _id: parcelId, status: { $in: ["PENDING", "OPEN", "searching"] }, traveller: null },
      {
        status: "MATCHED",
        assignedTripId: trip._id,
        traveller: req.user.userId,
      },
      { new: true }
    );
    if (!updatedParcel) {
      return res.status(400).json({ message: "Parcel already accepted by another traveller" });
    }

    const updatedTrip = await Traveller.findByIdAndUpdate(
      trip._id,
      {
        $inc: { availableWeight: -updatedParcel.weight },
      },
      { new: true }
    );

    return res.json({
      message: "Parcel accepted",
      parcel: updatedParcel,
      trip: updatedTrip,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// 🔥 Traveller  assigned parcels
export const getAssignedParcels = async (req: any, res: any) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = { traveller: req.user.userId };
    const [parcels, total] = await Promise.all([
      Parcel.find(filter)
        .populate("sender", "fullName phone") // sender info
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Parcel.countDocuments(filter),
    ]);

    res.json({ data: parcels, pagination: paginationMeta(total, page, limit) });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE TRIP STATUS
export const updateTripStatus = async (req: any, res: Response) => {
  try {
    const rawStatus = String(req.body.status || "");
    const statusMap: Record<string, string> = {
      PLANNED: "PLANNED",
      ACTIVE: "ACTIVE",
      IN_TRANSIT: "IN_TRANSIT",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED",
      scheduled: "PLANNED",
      in_transit: "IN_TRANSIT",
      completed: "COMPLETED",
      cancelled: "CANCELLED",
    };
    const status = statusMap[rawStatus];
    const allowedStatuses = ["PLANNED", "ACTIVE", "IN_TRANSIT", "COMPLETED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const trip = await Traveller.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { status, isAvailable: status === "PLANNED" || status === "ACTIVE" },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or unauthorized" });
    }

    // Sync assigned parcel status when trip moves to in_transit or completed
    if (status === "IN_TRANSIT") {
      await Parcel.updateMany(
        {
          traveller: req.user.userId,
          status: { $in: ["MATCHED", "ACCEPTED", "matched", "PICKED_UP"] },
        },
        { status: "IN_TRANSIT" }
      );
    }

    if (status === "COMPLETED") {
      await Parcel.updateMany(
        {
          traveller: req.user.userId,
          status: { $in: ["IN_TRANSIT", "in_transit"] },
        },
        { status: "DELIVERED" }
      );
    }

    return res.json({ message: "Trip status updated", data: trip });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTravellerStats = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const userObjectId = toObjectId(userId);

    const [parcelStats, trips, activeTrips] = await Promise.all([
      Parcel.aggregate([
        { $match: { traveller: userObjectId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalPrice: { $sum: { $ifNull: ["$price", 0] } },
          },
        },
      ]),
      Traveller.countDocuments({ user: userId }),
      Traveller.countDocuments({
        user: userId,
        status: { $in: ACTIVE_TRIP_STATUSES },
      }),
    ]);

    let totalDeliveries = 0;
    let completedDeliveries = 0;
    let activeDeliveries = 0;
    let completedValue = 0;
    let pendingValue = 0;

    for (const item of parcelStats) {
      const status = String(item._id || "");
      const count = Number(item.count || 0);
      const totalPrice = Number(item.totalPrice || 0);
      totalDeliveries += count;
      if (DELIVERED_PARCEL_STATUSES.includes(status)) {
        completedDeliveries += count;
        completedValue += totalPrice;
      }
      if (ACTIVE_PARCEL_STATUSES.includes(status)) {
        activeDeliveries += count;
        pendingValue += totalPrice;
      }
    }

    const completedSplit = splitEarnings(completedValue);
    const pendingSplit = splitEarnings(pendingValue);

    res.json({
      totalDeliveries,
      completedDeliveries,
      activeDeliveries,
      totalTrips: trips,
      activeTrips,
      totalParcelValue: completedValue + pendingValue,
      companyShare: completedSplit.companyShare + pendingSplit.companyShare,
      travellerEarnings: completedSplit.travellerEarning,
      pendingEarnings: pendingSplit.travellerEarning,
      companyFeePercent: COMPANY_FEE_PERCENT,
      travellerSharePercent: TRAVELLER_SHARE_PERCENT,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEarningsPreview = async (req: any, res: Response) => {
  try {
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();
    const availableWeight = Number(req.query.availableWeight) || undefined;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to cities are required" });
    }

    const query: Record<string, unknown> = {
      status: { $in: ["PENDING", "OPEN", "searching"] },
      traveller: null,
      normalizedPickupCity: { $in: getCitySearchValues(from) },
      normalizedDropCity: { $in: getCitySearchValues(to) },
    };

    if (availableWeight) {
      query.weight = { $lte: availableWeight };
    }

    const parcels = await Parcel.find(query).select("price").lean();
    const totalValue = sumParcelPrices(parcels);
    const { companyShare, travellerEarning } = splitEarnings(totalValue);

    res.json({
      matchingCount: parcels.length,
      totalParcelValue: totalValue,
      companyShare,
      tripEarning: travellerEarning,
      companyFeePercent: COMPANY_FEE_PERCENT,
      travellerSharePercent: TRAVELLER_SHARE_PERCENT,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};