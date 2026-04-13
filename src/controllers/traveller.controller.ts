import { Request, Response } from "express";
import Traveller from "../models/traveller.model";
import Parcel from "../models/parcel.model";

// CREATE
export const createTraveller = async (req: any, res: Response) => {
  try {
    const data = await Traveller.create({
      ...req.body,
      user: req.user.userId,
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL (my plans)
export const getMyTravellers = async (req: any, res: Response) => {
  try {
    const data = await Traveller.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE
export const getTravellerById = async (req: any, res: Response) => {
  try {
    const data = await Traveller.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

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
    const traveller = await Traveller.findOne({
      user: req.user.userId,
      isAvailable: true,
    }).sort({ createdAt: -1 });

    if (!traveller) {
      return res.status(400).json({
        message: "No active travel plan found",
      });
    }

    const parcels = await Parcel.find({
      status: "searching",
      "pickup.city": traveller.from,
      "drop.city": traveller.to,
      weight: { $lte: traveller.availableWeight },
    }).sort({ createdAt: -1 });

    res.json(parcels);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 Traveller ke assigned parcels
export const getAssignedParcels = async (req: any, res: any) => {
  try {
    const parcels = await Parcel.find({
      traveller: req.user.userId
    })
      .populate("sender", "fullName phone") // sender info
      .sort({ createdAt: -1 });

    res.json(parcels);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};