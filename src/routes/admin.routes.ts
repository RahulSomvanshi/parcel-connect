import { Router } from "express";
import {
  getAdminDashboard,
  getAdminStats,
  getAllUsers,
  getAllParcelsAdmin,
  createTravellerUser,
  createTravelPlan,
  getProhibitedItemsAdmin,
  updateProhibitedItemsAdmin,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  getAdminDashboard
);

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("admin"),
  getAdminStats
);

router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  getAllUsers
);

router.get(
  "/parcels",
  authMiddleware,
  authorizeRoles("admin"),
  getAllParcelsAdmin
);

router.post(
  "/travellers",
  authMiddleware,
  authorizeRoles("admin"),
  createTravellerUser
);

router.post(
  "/trips",
  authMiddleware,
  authorizeRoles("admin"),
  createTravelPlan
);

router.get(
  "/prohibited-items",
  authMiddleware,
  authorizeRoles("admin"),
  getProhibitedItemsAdmin
);

router.put(
  "/prohibited-items",
  authMiddleware,
  authorizeRoles("admin"),
  updateProhibitedItemsAdmin
);

export default router;