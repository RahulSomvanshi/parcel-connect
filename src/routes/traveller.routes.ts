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
router.post("/", authMiddleware, authorizeRoles("user", "admin"), createTraveller);

router.get("/", authMiddleware, authorizeRoles("user", "admin"), getMyTravellers);

// MATCHING
router.get(
  "/matching/parcels",
  authMiddleware,
  authorizeRoles("user", "admin"),
  getMatchingParcels
);

router.get(
  "/assigned",
  authMiddleware,
  authorizeRoles("user", "admin"),
  getAssignedParcels
);

router.get("/:id", authMiddleware, authorizeRoles("user", "admin"), getTravellerById);

router.put("/:id", authMiddleware, authorizeRoles("user", "admin"), updateTraveller);

router.delete("/:id", authMiddleware, authorizeRoles("user", "admin"), deleteTraveller);

export default router;