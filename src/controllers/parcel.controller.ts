import { Request, Response } from "express";
import Parcel from "../models/parcel.model";

// CREATE
export const createParcel = async (req: any, res: Response) => {
  try {
    const parcel = await Parcel.create({
      ...req.body,
      sender: req.user.userId,
    });

    return res.json(parcel);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyParcels = async (req: any, res: Response) => {
  try {
    const parcels = await Parcel.find({
      sender: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.json(parcels);
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
    const parcel = await Parcel.findOneAndUpdate(
      {
        _id: req.params.id,
        sender: req.user.userId,
        status: "searching", // only editable before match
      },
      req.body,
      { new: true }
    );

    if (!parcel) {
      return res.status(400).json({
        message: "Cannot update parcel",
      });
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
      status: "searching", // only before match
    });

    if (!parcel) {
      return res.status(400).json({
        message: "Cannot delete parcel",
      });
    }

    return res.json({ message: "Parcel deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const respondToParcel = async (req: any, res: Response) => {
  try {
    const { parcelId, action } = req.body;

    // ✅ basic validation
    if (!parcelId || !action) {
      return res.status(400).json({ message: "parcelId & action required" });
    }

    // ❌ DECLINE (MVP simple)
    if (action === "decline") {
      return res.json({
        message: "Parcel declined",
      });
    }

    // ✅ ACCEPT (IMPORTANT 🔥)
    if (action === "accept") {
      const parcel = await Parcel.findOneAndUpdate(
        {
          _id: parcelId,
          status: "searching", // 🔥 only allow if still available
        },
        {
          traveller: req.user.userId,
          status: "matched",
        },
        { new: true }
      );

      // ❌ already taken
      if (!parcel) {
        return res.status(400).json({
          message: "Parcel already accepted by someone else",
        });
      }

      return res.json({
        message: "Parcel accepted successfully",
        parcel,
      });
    }

    // ❌ invalid action
    return res.status(400).json({
      message: "Invalid action (accept/decline only)",
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};


// 🔥 Sender ke parcels with traveller info
export const getMyParcelsWithTraveller = async (req: any, res: any) => {
  try {
    const parcels = await Parcel.find({
      sender: req.user.userId
    })
      .populate("traveller", "fullName phone") // 🔥 traveller info
      .sort({ createdAt: -1 });

    res.json(parcels);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};