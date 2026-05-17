"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const traveller_controller_1 = require("../controllers/traveller.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// CRUD
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.createTraveller);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getMyTravellers);
router.get("/dashboard", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getTravellerDashboard);
router.get("/stats", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getTravellerStats);
router.get("/earnings-preview", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getEarningsPreview);
// MATCHING
router.get("/matching/parcels", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getMatchingParcels);
router.get("/assigned", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getAssignedParcels);
router.post("/trips/:tripId/accept/:parcelId", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.acceptParcelForTrip);
router.get("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.getTravellerById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.updateTraveller);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.deleteTraveller);
// UPDATE TRIP STATUS
router.patch("/:id/status", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorizeRoles)("traveller"), traveller_controller_1.updateTripStatus);
exports.default = router;
