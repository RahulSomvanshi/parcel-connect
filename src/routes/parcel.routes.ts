import { Router } from "express";
import {
  createParcel,
  getMyParcels,
  getParcelById,
  updateParcel,
  deleteParcel,
  respondToParcel,
  getMyParcelsWithTraveller,
  getProhibitedItems,
  updateParcelStatusByTraveller,
} from "../controllers/parcel.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// User/Admin routes
router.post("/", authMiddleware, authorizeRoles("sender"), createParcel);

router.get("/", authMiddleware, authorizeRoles("sender"), getMyParcels);
router.get(
  "/prohibited-items",
  authMiddleware,
  authorizeRoles("sender", "traveller", "admin"),
  getProhibitedItems
);



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

router.get("/:id", authMiddleware, authorizeRoles("sender"), getParcelById);

router.patch(
  "/:parcelId/status",
  authMiddleware,
  authorizeRoles("traveller"),
  updateParcelStatusByTraveller
);

router.put("/:id", authMiddleware, authorizeRoles("sender"), updateParcel);

router.delete("/:id", authMiddleware, authorizeRoles("sender"), deleteParcel);
export default router;