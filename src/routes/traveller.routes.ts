import { Router } from "express";
import {
  createTraveller,
  getMyTravellers,
  getTravellerById,
  updateTraveller,
  deleteTraveller,
  getMatchingParcels,
  getAssignedParcels,
  updateTripStatus,
  getTravellerStats,
  getEarningsPreview,
  acceptParcelForTrip,
  getTravellerDashboard,
} from "../controllers/traveller.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// CRUD
router.post("/", authMiddleware, authorizeRoles("traveller"), createTraveller);

router.get("/", authMiddleware, authorizeRoles("traveller"), getMyTravellers);

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("traveller"),
  getTravellerDashboard
);

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("traveller"),
  getTravellerStats
);

router.get(
  "/earnings-preview",
  authMiddleware,
  authorizeRoles("traveller"),
  getEarningsPreview
);

// MATCHING
router.get(
  "/matching/parcels",
  authMiddleware,
  authorizeRoles("traveller"),
  getMatchingParcels
);

router.get(
  "/assigned",
  authMiddleware,
  authorizeRoles("traveller"),
  getAssignedParcels
);

router.post(
  "/trips/:tripId/accept/:parcelId",
  authMiddleware,
  authorizeRoles("traveller"),
  acceptParcelForTrip
);

router.get("/:id", authMiddleware, authorizeRoles("traveller"), getTravellerById);

router.put("/:id", authMiddleware, authorizeRoles("traveller"), updateTraveller);

router.delete("/:id", authMiddleware, authorizeRoles("traveller"), deleteTraveller);

// UPDATE TRIP STATUS
router.patch("/:id/status", authMiddleware, authorizeRoles("traveller"), updateTripStatus);

export default router;