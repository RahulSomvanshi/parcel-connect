import { Router } from "express";
import {
  createTraveller,
  getMyTravellers,
  getTravellerById,
  updateTraveller,
  deleteTraveller,
  getMatchingParcels,
  getAssignedParcels,
} from "../controllers/traveller.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// CRUD
router.post("/", authMiddleware, authorizeRoles("traveller"), createTraveller);

router.get("/", authMiddleware, authorizeRoles("traveller"), getMyTravellers);

router.get("/:id", authMiddleware, authorizeRoles("traveller"), getTravellerById);

router.put("/:id", authMiddleware, authorizeRoles("traveller"), updateTraveller);

router.delete("/:id", authMiddleware, authorizeRoles("traveller"), deleteTraveller);

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

export default router;