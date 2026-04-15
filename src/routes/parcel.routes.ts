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

// User/Admin routes
router.post("/", authMiddleware, authorizeRoles("user", "admin"), createParcel);

router.get("/", authMiddleware, authorizeRoles("user", "admin"), getMyParcels);



router.post(
  "/respond",
  authMiddleware,
  authorizeRoles("user", "admin"),
  respondToParcel
);

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("user", "admin"),
  getMyParcelsWithTraveller
);

router.get("/:id", authMiddleware, authorizeRoles("user", "admin"), getParcelById);

router.put("/:id", authMiddleware, authorizeRoles("user", "admin"), updateParcel);

router.delete("/:id", authMiddleware, authorizeRoles("user", "admin"), deleteParcel);
export default router;