"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// 🔥 only admin allowed
router.get("/users", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("admin"), admin_controller_1.getAllUsers);
router.get("/parcels", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("admin"), admin_controller_1.getAllParcelsAdmin);
exports.default = router;
