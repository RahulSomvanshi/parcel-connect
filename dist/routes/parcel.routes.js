"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcel_controller_1 = require("../controllers/parcel.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// User/Admin routes
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.createParcel);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.getMyParcels);
router.post("/respond", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.respondToParcel);
router.get("/my", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.getMyParcelsWithTraveller);
router.get("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.getParcelById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.updateParcel);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), parcel_controller_1.deleteParcel);
exports.default = router;
