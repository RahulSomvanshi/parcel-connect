import { Router } from "express";
import {
  createParcel,
  getMyParcels,
  getParcelById,
  updateParcel,
  deleteParcel,
  respondToParcel,
  getMyParcelsWithTraveller,
} from "../controllers/parcel.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// Sender only routes
router.post("/", authMiddleware, authorizeRoles("sender"), createParcel);

router.get("/", authMiddleware, authorizeRoles("sender"), getMyParcels);

router.get("/:id", authMiddleware, authorizeRoles("sender"), getParcelById);

router.put("/:id", authMiddleware, authorizeRoles("sender"), updateParcel);

router.delete("/:id", authMiddleware, authorizeRoles("sender"), deleteParcel);

router.post(
  "/respond",
  authMiddleware,
  authorizeRoles("traveller"),
  respondToParcel
);

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("sender"),
  getMyParcelsWithTraveller
);
export default router;