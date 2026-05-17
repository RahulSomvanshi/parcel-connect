"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProhibitedItemsAdmin = exports.getProhibitedItemsAdmin = exports.createTravelPlan = exports.createTravellerUser = exports.getAllParcelsAdmin = exports.getAllUsers = exports.getAdminStats = exports.getAdminDashboard = void 0;
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const traveller_model_1 = __importDefault(require("../models/traveller.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const earnings_1 = require("../utils/earnings");
const sendEmail_1 = require("../utils/sendEmail");
const system_config_model_1 = __importDefault(require("../models/system-config.model"));
const prohibitedItems_1 = require("../utils/prohibitedItems");
const city_1 = require("../utils/city");
const pagination_1 = require("../utils/pagination");
const PROHIBITED_ITEMS_KEY = "prohibited_items";
function fetchAdminStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const [totalUsers, senders, travellers, admins, verifiedUsers, totalParcels, searchingParcels, matchedParcels, inTransitParcels, deliveredParcels, totalTrips, activeTrips, allParcelsForRevenue, recentUsers, recentParcels,] = yield Promise.all([
            user_model_1.default.countDocuments(),
            user_model_1.default.countDocuments({ role: "sender" }),
            user_model_1.default.countDocuments({ role: "traveller" }),
            user_model_1.default.countDocuments({ role: "admin" }),
            user_model_1.default.countDocuments({ isVerified: true }),
            parcel_model_1.default.countDocuments(),
            parcel_model_1.default.countDocuments({ status: { $in: ["PENDING", "OPEN", "searching"] } }),
            parcel_model_1.default.countDocuments({ status: { $in: ["MATCHED", "ACCEPTED", "matched"] } }),
            parcel_model_1.default.countDocuments({ status: { $in: ["IN_TRANSIT", "PICKED_UP", "in_transit"] } }),
            parcel_model_1.default.countDocuments({ status: { $in: ["DELIVERED", "delivered"] } }),
            traveller_model_1.default.countDocuments(),
            traveller_model_1.default.countDocuments({ status: { $in: ["ACTIVE", "ONGOING", "scheduled", "in_transit"] } }),
            parcel_model_1.default.find().select("price status").lean(),
            user_model_1.default.find().select("-password").sort({ createdAt: -1 }).limit(5).lean(),
            parcel_model_1.default.find()
                .populate("sender", "fullName phone")
                .populate("traveller", "fullName phone")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);
        const totalRevenue = (0, earnings_1.sumParcelPrices)(allParcelsForRevenue);
        const deliveredRevenue = (0, earnings_1.sumParcelPrices)(allParcelsForRevenue.filter((p) => ["DELIVERED", "delivered"].includes(p.status)));
        const { companyShare, travellerEarning } = (0, earnings_1.splitEarnings)(deliveredRevenue);
        return {
            users: {
                total: totalUsers,
                senders,
                travellers,
                admins,
                verified: verifiedUsers,
                unverified: totalUsers - verifiedUsers,
            },
            parcels: {
                total: totalParcels,
                searching: searchingParcels,
                matched: matchedParcels,
                in_transit: inTransitParcels,
                delivered: deliveredParcels,
            },
            trips: {
                total: totalTrips,
                active: activeTrips,
            },
            revenue: {
                total: totalRevenue,
                delivered: deliveredRevenue,
                companyShare,
                travellerShare: travellerEarning,
                companyFeePercent: 20,
            },
            recentUsers,
            recentParcels,
        };
    });
}
function fetchUsersPage(page, limit, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const skip = (page - 1) * limit;
        const filter = role ? { role } : {};
        const [users, total] = yield Promise.all([
            user_model_1.default.find(filter)
                .select("-password")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            user_model_1.default.countDocuments(filter),
        ]);
        return {
            data: users,
            pagination: Object.assign({}, (0, pagination_1.paginationMeta)(total, page, limit)),
        };
    });
}
function fetchParcelsPage(page, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const skip = (page - 1) * limit;
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find()
                .populate("sender", "fullName phone role")
                .populate("traveller", "fullName phone role")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            parcel_model_1.default.countDocuments(),
        ]);
        return {
            data: parcels,
            pagination: Object.assign({}, (0, pagination_1.paginationMeta)(total, page, limit)),
        };
    });
}
/** Single bundle: stats + first page users/parcels + travellers (one round trip) */
const getAdminDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, pagination_1.getPagination)(req);
        const [stats, users, parcels, travellers] = yield Promise.all([
            fetchAdminStats(),
            fetchUsersPage(page, limit),
            fetchParcelsPage(page, limit),
            user_model_1.default.find({ role: "traveller" })
                .select("-password")
                .sort({ fullName: 1 })
                .lean(),
        ]);
        res.json({ stats, users, parcels, travellers });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAdminDashboard = getAdminDashboard;
const getAdminStats = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield fetchAdminStats();
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAdminStats = getAdminStats;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, pagination_1.getPagination)(req);
        const role = typeof req.query.role === "string" ? req.query.role : undefined;
        res.json(yield fetchUsersPage(page, limit, role));
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllUsers = getAllUsers;
const getAllParcelsAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = (0, pagination_1.getPagination)(req);
        res.json(yield fetchParcelsPage(page, limit));
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllParcelsAdmin = getAllParcelsAdmin;
// 🔥 ADMIN: Create a Traveller User (auto-verified)
const createTravellerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, phone, password } = req.body;
        const existingUser = yield user_model_1.default.findOne({
            $or: [{ email }, { phone }],
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield user_model_1.default.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: "traveller",
            isVerified: true,
        });
        if (user.email) {
            yield (0, sendEmail_1.sendEmail)(user.email, "Welcome to Zippora - Traveller account created", `Hi ${user.fullName}, your traveller account was created by admin.\n\nLogin Email: ${user.email}\nLogin Phone: ${user.phone}\nPassword: ${password}\n\nPlease login and change your password after first sign in.`);
        }
        return res.status(201).json({
            message: "Traveller created successfully",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.createTravellerUser = createTravellerUser;
// 🔥 ADMIN: Create a Travel Plan for an existing Traveller user
const createTravelPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, from, to, travelDate, vehicleType, availableWeight } = req.body;
        const user = yield user_model_1.default.findById(userId);
        if (!user || user.role !== "traveller") {
            return res.status(400).json({ message: "Valid Traveller User ID is required" });
        }
        const travelPlan = yield traveller_model_1.default.create({
            user: userId,
            travellerId: userId,
            from: String(from).trim(),
            to: String(to).trim(),
            fromCity: String(from).trim(),
            toCity: String(to).trim(),
            normalizedFromCity: (0, city_1.normalizeCityName)(from),
            normalizedToCity: (0, city_1.normalizeCityName)(to),
            travelDate,
            vehicleType,
            availableWeight,
            status: "ACTIVE",
            isAvailable: true,
        });
        if (user.email) {
            yield (0, sendEmail_1.sendEmail)(user.email, "New travel trip assigned by admin", `Hi ${user.fullName}, admin created a new trip for you.\n\nRoute: ${from} -> ${to}\nDate: ${new Date(travelDate).toDateString()}\nVehicle: ${vehicleType}\nCapacity: ${availableWeight} kg\n\nPlease login and manage parcel matches from your dashboard.`);
        }
        return res.status(201).json({
            message: "Travel plan created successfully",
            data: travelPlan,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.createTravelPlan = createTravelPlan;
const getProhibitedItemsAdmin = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield system_config_model_1.default.findOne({ key: PROHIBITED_ITEMS_KEY }).lean();
        const customItems = ((config === null || config === void 0 ? void 0 : config.stringValues) || []).map((v) => String(v).trim()).filter(Boolean);
        return res.json({
            defaultItems: prohibitedItems_1.DEFAULT_PROHIBITED_KEYWORDS,
            customItems,
            allItems: Array.from(new Set([
                ...prohibitedItems_1.DEFAULT_PROHIBITED_KEYWORDS,
                ...customItems.map((v) => v.toLowerCase()),
            ])),
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getProhibitedItemsAdmin = getProhibitedItemsAdmin;
const updateProhibitedItemsAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const items = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.items) ? req.body.items : [];
        const normalized = Array.from(new Set(items
            .map((item) => String(item).trim().toLowerCase())
            .filter((item) => item.length > 0)));
        const updated = yield system_config_model_1.default.findOneAndUpdate({ key: PROHIBITED_ITEMS_KEY }, {
            key: PROHIBITED_ITEMS_KEY,
            stringValues: normalized,
            updatedBy: req.user.userId,
        }, { new: true, upsert: true }).lean();
        return res.json({
            message: "Prohibited item list updated",
            customItems: (updated === null || updated === void 0 ? void 0 : updated.stringValues) || [],
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.updateProhibitedItemsAdmin = updateProhibitedItemsAdmin;
