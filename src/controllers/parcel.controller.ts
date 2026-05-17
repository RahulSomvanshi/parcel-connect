import { Request, Response } from "express";
import Parcel from "../models/parcel.model";
import { sendEmail } from "../utils/sendEmail";
import {
  checkProhibitedContent,
  DEFAULT_PROHIBITED_KEYWORDS,
} from "../utils/prohibitedItems";
import { openStatusFilter } from "../constants/parcel";
import SystemConfig from "../models/system-config.model";
import Traveller from "../models/traveller.model";
import { normalizeCityName } from "../utils/city";
import { getPagination, paginationMeta } from "../utils/pagination";

const PROHIBITED_ITEMS_KEY = "prohibited_items";

async function getConfiguredProhibitedItems(): Promise<string[]> {
  const config = await SystemConfig.findOne({ key: PROHIBITED_ITEMS_KEY }).lean();
  const custom = (config?.stringValues || []).map((v) => String(v).trim().toLowerCase());
  return Array.from(new Set([...DEFAULT_PROHIBITED_KEYWORDS, ...custom])).filter(Boolean);
}

export const createParcel = async (req: any, res: Response) => {
  try {
    const { pickup, drop, weight, parcelDate, preferredTravelDate, description, price } = req.body;

    if (!pickup?.city || !drop?.city) {
      return res.status(400).json({ message: "Pickup and drop city are required" });
    }
    if (!parcelDate) {
      return res.status(400).json({ message: "parcelDate is required" });
    }

    const prohibitedItems = await getConfiguredProhibitedItems();
    const prohibited = checkProhibitedContent(description, undefined, prohibitedItems);
    if (prohibited.flagged) {
      return res.status(400).json({
        message: `Parcel cannot be created with restricted items: ${prohibited.matchedKeywords.join(
          ", "
        )}`,
        blockedItems: prohibited.matchedKeywords,
      });
    }

    const parcel = await Parcel.create({
      senderId: req.user.userId,
      pickup: {
        city: pickup.city.trim(),
        address: (pickup.address || pickup.city).trim(),
      },
      drop: {
        city: drop.city.trim(),
        address: (drop.address || drop.city).trim(),
      },
      pickupCity: pickup.city.trim(),
      dropCity: drop.city.trim(),
      normalizedPickupCity: normalizeCityName(pickup.city),
      normalizedDropCity: normalizeCityName(drop.city),
      weight,
      parcelDate: new Date(parcelDate),
      preferredTravelDate: preferredTravelDate ? new Date(preferredTravelDate) : undefined,
      description,
      price,
      sender: req.user.userId,
      status: "PENDING",
      isFlagged: false,
      flaggedKeywords: [],
    });

    return res.json(parcel);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/** Sender/traveller UI list of prohibited/disclaimer items */
export const getProhibitedItems = async (_req: Request, res: Response) => {
  try {
    const items = await getConfiguredProhibitedItems();
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyParcels = async (req: any, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const filter = { sender: req.user.userId };
    const [parcels, total] = await Promise.all([
      Parcel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Parcel.countDocuments(filter),
    ]);

    return res.json({ parcels, pagination: paginationMeta(total, page, limit), total, page, limit });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getParcelById = async (req: any, res: Response) => {
  try {
    const parcel = await Parcel.findOne({
      _id: req.params.id,
      sender: req.user.userId,
    });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    return res.json(parcel);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateParcel = async (req: any, res: Response) => {
  try {
    const payload = { ...req.body };
    if (payload.pickup?.city) {
      payload.pickupCity = String(payload.pickup.city).trim();
      payload.normalizedPickupCity = normalizeCityName(payload.pickup.city);
    }
    if (payload.drop?.city) {
      payload.dropCity = String(payload.drop.city).trim();
      payload.normalizedDropCity = normalizeCityName(payload.drop.city);
    }
    if (payload.parcelDate) {
      payload.parcelDate = new Date(payload.parcelDate);
    }
    if (payload.preferredTravelDate) {
      payload.preferredTravelDate = new Date(payload.preferredTravelDate);
    }

    const openFilter = openStatusFilter();
    const parcel = await Parcel.findOneAndUpdate(
      {
        _id: req.params.id,
        sender: req.user.userId,
        status: openFilter,
      },
      payload,
      { new: true }
    );

    if (!parcel) {
      return res.status(400).json({ message: "Cannot update parcel" });
    }

    return res.json(parcel);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteParcel = async (req: any, res: Response) => {
  try {
    const parcel = await Parcel.findOneAndDelete({
      _id: req.params.id,
      sender: req.user.userId,
      status: openStatusFilter(),
    });

    if (!parcel) {
      return res.status(400).json({ message: "Cannot delete parcel" });
    }

    return res.json({ message: "Parcel deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

const STATUS_TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  accept: { from: ["PENDING", "OPEN", "searching"], to: "MATCHED" },
  reject: { from: ["PENDING", "OPEN", "searching"], to: "CANCELLED" },
  pick_up: { from: ["MATCHED", "ACCEPTED", "matched"], to: "PICKED_UP" },
  in_transit: { from: ["PICKED_UP", "MATCHED", "ACCEPTED", "matched"], to: "IN_TRANSIT" },
  deliver: { from: ["IN_TRANSIT", "PICKED_UP", "MATCHED", "matched", "in_transit"], to: "DELIVERED" },
  cancel: {
    from: ["PENDING", "OPEN", "MATCHED", "PICKED_UP", "IN_TRANSIT", "searching", "matched", "in_transit"],
    to: "CANCELLED",
  },
};

export const respondToParcel = async (req: any, res: Response) => {
  try {
    const { parcelId, action } = req.body;

    if (!parcelId || !action) {
      return res.status(400).json({ message: "parcelId & action required" });
    }

    const transition = STATUS_TRANSITIONS[action];
    if (!transition) {
      return res.status(400).json({
        message:
          "Invalid action. Use: accept, reject, pick_up, in_transit, deliver, cancel",
      });
    }

    // Reject without assignment — traveller declines before accepting
    if (action === "reject") {
      const parcel = await Parcel.findById(parcelId).populate("sender");
      if (!parcel) {
        return res.status(404).json({ message: "Parcel not found" });
      }
      const sender: any = parcel.sender;
      if (sender?.email) {
        await sendEmail(
          sender.email,
          "Parcel declined",
          `A traveller declined your parcel from ${parcel.pickup.city} to ${parcel.drop.city}.`
        );
      }
      return res.json({ message: "Parcel rejected by traveller" });
    }

    // Atomic accept — only one traveller wins
    if (action === "accept") {
      const updatedParcel = await Parcel.findOneAndUpdate(
        {
          _id: parcelId,
          status: openStatusFilter(),
          traveller: null,
        },
        {
          traveller: req.user.userId,
          status: "MATCHED",
        },
        { new: true }
      ).populate("sender", "email fullName");

      if (!updatedParcel) {
        return res.status(400).json({
          message: "Parcel already accepted by another traveller",
        });
      }

      const sender: any = updatedParcel.sender;
      if (sender?.email) {
        await sendEmail(
          sender.email,
          "Parcel accepted",
          `Your parcel from ${updatedParcel.pickup.city} to ${updatedParcel.drop.city} was accepted.`
        );
      }

      return res.json({
        message: "Parcel accepted",
        parcel: updatedParcel,
        warning: updatedParcel.isFlagged
          ? "This parcel was flagged for prohibited content. Review before pickup."
          : undefined,
      });
    }

    const updatedParcel = await Parcel.findOneAndUpdate(
      {
        _id: parcelId,
        traveller: req.user.userId,
        status: { $in: transition.from },
      },
      { status: transition.to },
      { new: true }
    ).populate("sender", "email");

    if (!updatedParcel) {
      return res.status(400).json({ message: "Status update not allowed" });
    }

    const sender: any = updatedParcel.sender;
    if (action === "deliver" && sender?.email) {
      await sendEmail(
        sender.email,
        "Parcel delivered",
        `Your parcel from ${updatedParcel.pickup.city} to ${updatedParcel.drop.city} was delivered.`
      );
    }

    return res.json({ message: `Parcel ${action}`, parcel: updatedParcel });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateParcelStatusByTraveller = async (req: any, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { status } = req.body as { status?: string };

    const allowedStatuses = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Allowed statuses: PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED",
      });
    }

    const parcel = await Parcel.findOneAndUpdate(
      {
        _id: parcelId,
        traveller: req.user.userId,
        status: {
          $in:
            status === "PICKED_UP"
              ? ["MATCHED", "matched", "ACCEPTED"]
              : status === "IN_TRANSIT"
              ? ["PICKED_UP", "MATCHED", "matched", "ACCEPTED"]
              : status === "OUT_FOR_DELIVERY"
              ? ["IN_TRANSIT", "in_transit", "PICKED_UP", "MATCHED", "matched"]
              : ["OUT_FOR_DELIVERY", "IN_TRANSIT", "in_transit", "PICKED_UP", "MATCHED", "matched"],
        },
      },
      { status },
      { new: true }
    );

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found or status transition denied" });
    }

    if (parcel.assignedTripId) {
      if (status === "PICKED_UP" || status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") {
        await Traveller.findByIdAndUpdate(parcel.assignedTripId, {
          status: "IN_TRANSIT",
          isAvailable: false,
        });
      }

      if (status === "DELIVERED") {
        const pendingInTrip = await Parcel.countDocuments({
          assignedTripId: parcel.assignedTripId,
          status: {
            $in: [
              "PENDING",
              "MATCHED",
              "PICKED_UP",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY",
              "OPEN",
              "searching",
              "matched",
              "in_transit",
            ],
          },
        });
        if (pendingInTrip === 0) {
          await Traveller.findByIdAndUpdate(parcel.assignedTripId, {
            status: "COMPLETED",
            isAvailable: false,
          });
        }
      }
    }

    return res.json({ message: "Parcel status updated", parcel });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyParcelsWithTraveller = async (req: any, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = { sender: req.user.userId };

    const [parcels, total] = await Promise.all([
      Parcel.find(filter)
        .populate("traveller", "fullName phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Parcel.countDocuments(filter),
    ]);

    return res.json({ parcels, pagination: paginationMeta(total, page, limit), total, page, limit });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
