"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const traveller_controller_1 = require("../controllers/traveller.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// CRUD
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.createTraveller);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.getMyTravellers);
// MATCHING
router.get("/matching/parcels", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.getMatchingParcels);
router.get("/assigned", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.getAssignedParcels);
router.get("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.getTravellerById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.updateTraveller);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("user", "admin"), traveller_controller_1.deleteTraveller);
exports.default = router;
