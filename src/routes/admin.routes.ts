import { Router } from "express";
import { getAllUsers, getAllParcelsAdmin } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// 🔥 only admin allowed
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

export default router;