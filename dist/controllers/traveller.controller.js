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
exports.getEarningsPreview = exports.getTravellerStats = exports.updateTripStatus = exports.getAssignedParcels = exports.acceptParcelForTrip = exports.getMatchingParcels = exports.deleteTraveller = exports.updateTraveller = exports.getTravellerById = exports.getTravellerDashboard = exports.getMyTravellers = exports.createTraveller = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const traveller_model_1 = __importDefault(require("../models/traveller.model"));
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const earnings_1 = require("../utils/earnings");
const city_1 = require("../utils/city");
const pagination_1 = require("../utils/pagination");
const ACTIVE_TRIP_STATUSES = ["PLANNED", "ACTIVE", "IN_TRANSIT", "scheduled", "in_transit"];
const DELIVERED_PARCEL_STATUSES = ["DELIVERED", "delivered"];
const ACTIVE_PARCEL_STATUSES = ["MATCHED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT", "matched", "in_transit"];
const toObjectId = (id) => new mongoose_1.default.Types.ObjectId(id);
const getUtcDayRange = (date) => {
    const value = new Date(date);
    const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
};
const parcelDateMatchFilter = (start, end) => ({
    $or: [
        { preferredTravelDate: { $gte: start, $lte: end } },
        {
            $and: [
                {
                    $or: [
                        { preferredTravelDate: { $exists: false } },
                        { preferredTravelDate: null },
                    ],
                },
                { parcelDate: { $gte: start, $lte: end } },
            ],
        },
    ],
});
// CREATE
const createTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fromCity = String(req.body.from || "").trim();
        const toCity = String(req.body.to || "").trim();
        const availableWeight = Number(req.body.availableWeight);
        if (!fromCity || !toCity || !availableWeight) {
            return res.status(400).json({ message: "from, to and availableWeight are required" });
        }
        const data = yield traveller_model_1.default.create(Object.assign(Object.assign({}, req.body), { user: req.user.userId, travellerId: req.user.userId, from: fromCity, to: toCity, fromCity,
            toCity, normalizedFromCity: (0, city_1.normalizeCityName)(fromCity), normalizedToCity: (0, city_1.normalizeCityName)(toCity), status: "PLANNED", isAvailable: true, availableWeight }));
        const matchingParcels = yield parcel_model_1.default.find({
            normalizedPickupCity: { $in: (0, city_1.getCitySearchValues)(fromCity) },
            normalizedDropCity: { $in: (0, city_1.getCitySearchValues)(toCity) },
            status: { $in: ["PENDING", "OPEN", "searching"] },
            traveller: null,
            weight: { $lte: data.availableWeight },
        })
            .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        res.json({ trip: data, matchingParcels });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.createTraveller = createTraveller;
// GET ALL (my plans)
const getMyTravellers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const filter = { user: req.user.userId };
        const [data, total] = yield Promise.all([
            traveller_model_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            traveller_model_1.default.countDocuments(filter),
        ]);
        res.json({ data, pagination: (0, pagination_1.paginationMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMyTravellers = getMyTravellers;
const getTravellerDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const userObjectId = toObjectId(userId);
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const tripsFilter = { user: userId };
        const assignedFilter = { traveller: userObjectId };
        const [trips, totalTrips, recentDeliveries, parcelStats, activeTrips] = yield Promise.all([
            traveller_model_1.default.find(tripsFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            traveller_model_1.default.countDocuments(tripsFilter),
            parcel_model_1.default.find(assignedFilter)
                .populate("sender", "fullName phone")
                .sort({ createdAt: -1 })
                .limit(2)
                .lean(),
            parcel_model_1.default.aggregate([
                { $match: assignedFilter },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalPrice: { $sum: { $ifNull: ["$price", 0] } },
                    },
                },
            ]),
            traveller_model_1.default.countDocuments({
                user: userId,
                status: { $in: ACTIVE_TRIP_STATUSES },
            }),
        ]);
        const activeTrip = trips.find((trip) => trip.isAvailable !== false && ACTIVE_TRIP_STATUSES.includes(String(trip.status || "")));
        let topMatching = [];
        if (activeTrip) {
            const { start, end } = getUtcDayRange(activeTrip.travelDate);
            const pickupCities = (0, city_1.getCitySearchValues)(activeTrip.normalizedFromCity || activeTrip.from);
            const dropCities = (0, city_1.getCitySearchValues)(activeTrip.normalizedToCity || activeTrip.to);
            topMatching = yield parcel_model_1.default.find(Object.assign({ status: { $in: ["PENDING", "OPEN", "searching"] }, traveller: null, normalizedPickupCity: { $in: pickupCities }, normalizedDropCity: { $in: dropCities }, weight: { $lte: activeTrip.availableWeight } }, parcelDateMatchFilter(start, end)))
                .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
                .sort({ createdAt: -1 })
                .limit(1)
                .lean();
        }
        let totalDeliveries = 0;
        let completedDeliveries = 0;
        let activeDeliveries = 0;
        let completedValue = 0;
        let pendingValue = 0;
        for (const item of parcelStats) {
            const status = String(item._id || "");
            const count = Number(item.count || 0);
            const totalPrice = Number(item.totalPrice || 0);
            totalDeliveries += count;
            if (DELIVERED_PARCEL_STATUSES.includes(status)) {
                completedDeliveries += count;
                completedValue += totalPrice;
            }
            if (ACTIVE_PARCEL_STATUSES.includes(status)) {
                activeDeliveries += count;
                pendingValue += totalPrice;
            }
        }
        const completedSplit = (0, earnings_1.splitEarnings)(completedValue);
        const pendingSplit = (0, earnings_1.splitEarnings)(pendingValue);
        return res.json({
            trips: {
                data: trips,
                pagination: (0, pagination_1.paginationMeta)(totalTrips, page, limit),
            },
            recentDeliveries,
            topMatching,
            stats: {
                totalDeliveries,
                completedDeliveries,
                activeDeliveries,
                totalTrips,
                activeTrips,
                totalParcelValue: completedValue + pendingValue,
                companyShare: completedSplit.companyShare + pendingSplit.companyShare,
                travellerEarnings: completedSplit.travellerEarning,
                pendingEarnings: pendingSplit.travellerEarning,
                companyFeePercent: earnings_1.COMPANY_FEE_PERCENT,
                travellerSharePercent: earnings_1.TRAVELLER_SHARE_PERCENT,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getTravellerDashboard = getTravellerDashboard;
// GET SINGLE
const getTravellerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.findOne({
            _id: req.params.id,
            user: req.user.userId,
        }).lean();
        if (!data) {
            return res.status(404).json({ message: "Not found" });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getTravellerById = getTravellerById;
// UPDATE
const updateTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.findOneAndUpdate({
            _id: req.params.id,
            user: req.user.userId,
        }, req.body, { new: true, runValidators: true });
        if (!data) {
            return res.status(400).json({ message: "Cannot update" });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.updateTraveller = updateTraveller;
// DELETE
const deleteTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId,
        });
        if (!data) {
            return res.status(400).json({ message: "Cannot delete" });
        }
        res.json({ message: "Deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.deleteTraveller = deleteTraveller;
// 🔥 MATCHING PARCELS
const getMatchingParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tripId } = req.query;
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const travellerQuery = {
            user: req.user.userId,
            isAvailable: true,
        };
        if (tripId) {
            travellerQuery._id = tripId;
        }
        const traveller = yield traveller_model_1.default.findOne(travellerQuery).sort({ createdAt: -1 }).lean();
        if (!traveller) {
            return res.status(400).json({
                message: tripId
                    ? "Travel plan not found or unavailable"
                    : "No active travel plan found. Add a trip first.",
            });
        }
        const { start, end } = getUtcDayRange(traveller.travelDate);
        const pickupCities = (0, city_1.getCitySearchValues)(traveller.normalizedFromCity || traveller.from);
        const dropCities = (0, city_1.getCitySearchValues)(traveller.normalizedToCity || traveller.to);
        const filter = Object.assign({ status: { $in: ["PENDING", "OPEN", "searching"] }, traveller: null, normalizedPickupCity: { $in: pickupCities }, normalizedDropCity: { $in: dropCities }, weight: { $lte: traveller.availableWeight } }, parcelDateMatchFilter(start, end));
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find(filter)
                .select("_id pickup drop pickupCity dropCity weight price status description parcelDate preferredTravelDate isFlagged")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            parcel_model_1.default.countDocuments(filter),
        ]);
        res.json({ data: parcels, pagination: (0, pagination_1.paginationMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMatchingParcels = getMatchingParcels;
const acceptParcelForTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tripId, parcelId } = req.params;
        const trip = yield traveller_model_1.default.findOne({
            _id: tripId,
            user: req.user.userId,
            status: { $in: ACTIVE_TRIP_STATUSES },
            isAvailable: true,
        });
        if (!trip) {
            return res.status(404).json({ message: "Trip not found or inactive" });
        }
        const parcel = yield parcel_model_1.default.findOne({ _id: parcelId });
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found" });
        }
        if (!["PENDING", "OPEN", "searching"].includes(parcel.status)) {
            return res.status(400).json({ message: "Parcel already matched" });
        }
        if (parcel.weight > trip.availableWeight) {
            return res.status(400).json({ message: "Trip does not have enough available weight" });
        }
        const updatedParcel = yield parcel_model_1.default.findOneAndUpdate({ _id: parcelId, status: { $in: ["PENDING", "OPEN", "searching"] }, traveller: null }, {
            status: "MATCHED",
            assignedTripId: trip._id,
            traveller: req.user.userId,
        }, { new: true });
        if (!updatedParcel) {
            return res.status(400).json({ message: "Parcel already accepted by another traveller" });
        }
        const updatedTrip = yield traveller_model_1.default.findByIdAndUpdate(trip._id, {
            $inc: { availableWeight: -updatedParcel.weight },
        }, { new: true });
        return res.json({
            message: "Parcel accepted",
            parcel: updatedParcel,
            trip: updatedTrip,
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.acceptParcelForTrip = acceptParcelForTrip;
// 🔥 Traveller  assigned parcels
const getAssignedParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const filter = { traveller: req.user.userId };
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find(filter)
                .populate("sender", "fullName phone") // sender info
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            parcel_model_1.default.countDocuments(filter),
        ]);
        res.json({ data: parcels, pagination: (0, pagination_1.paginationMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAssignedParcels = getAssignedParcels;
// 🔥 UPDATE TRIP STATUS
const updateTripStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rawStatus = String(req.body.status || "");
        const statusMap = {
            PLANNED: "PLANNED",
            ACTIVE: "ACTIVE",
            IN_TRANSIT: "IN_TRANSIT",
            COMPLETED: "COMPLETED",
            CANCELLED: "CANCELLED",
            scheduled: "PLANNED",
            in_transit: "IN_TRANSIT",
            completed: "COMPLETED",
            cancelled: "CANCELLED",
        };
        const status = statusMap[rawStatus];
        const allowedStatuses = ["PLANNED", "ACTIVE", "IN_TRANSIT", "COMPLETED", "CANCELLED"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const trip = yield traveller_model_1.default.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { status, isAvailable: status === "PLANNED" || status === "ACTIVE" }, { new: true });
        if (!trip) {
            return res.status(404).json({ message: "Trip not found or unauthorized" });
        }
        // Sync assigned parcel status when trip moves to in_transit or completed
        if (status === "IN_TRANSIT") {
            yield parcel_model_1.default.updateMany({
                traveller: req.user.userId,
                status: { $in: ["MATCHED", "ACCEPTED", "matched", "PICKED_UP"] },
            }, { status: "IN_TRANSIT" });
        }
        if (status === "COMPLETED") {
            yield parcel_model_1.default.updateMany({
                traveller: req.user.userId,
                status: { $in: ["IN_TRANSIT", "in_transit"] },
            }, { status: "DELIVERED" });
        }
        return res.json({ message: "Trip status updated", data: trip });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.updateTripStatus = updateTripStatus;
const getTravellerStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const userObjectId = toObjectId(userId);
        const [parcelStats, trips, activeTrips] = yield Promise.all([
            parcel_model_1.default.aggregate([
                { $match: { traveller: userObjectId } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalPrice: { $sum: { $ifNull: ["$price", 0] } },
                    },
                },
            ]),
            traveller_model_1.default.countDocuments({ user: userId }),
            traveller_model_1.default.countDocuments({
                user: userId,
                status: { $in: ACTIVE_TRIP_STATUSES },
            }),
        ]);
        let totalDeliveries = 0;
        let completedDeliveries = 0;
        let activeDeliveries = 0;
        let completedValue = 0;
        let pendingValue = 0;
        for (const item of parcelStats) {
            const status = String(item._id || "");
            const count = Number(item.count || 0);
            const totalPrice = Number(item.totalPrice || 0);
            totalDeliveries += count;
            if (DELIVERED_PARCEL_STATUSES.includes(status)) {
                completedDeliveries += count;
                completedValue += totalPrice;
            }
            if (ACTIVE_PARCEL_STATUSES.includes(status)) {
                activeDeliveries += count;
                pendingValue += totalPrice;
            }
        }
        const completedSplit = (0, earnings_1.splitEarnings)(completedValue);
        const pendingSplit = (0, earnings_1.splitEarnings)(pendingValue);
        res.json({
            totalDeliveries,
            completedDeliveries,
            activeDeliveries,
            totalTrips: trips,
            activeTrips,
            totalParcelValue: completedValue + pendingValue,
            companyShare: completedSplit.companyShare + pendingSplit.companyShare,
            travellerEarnings: completedSplit.travellerEarning,
            pendingEarnings: pendingSplit.travellerEarning,
            companyFeePercent: earnings_1.COMPANY_FEE_PERCENT,
            travellerSharePercent: earnings_1.TRAVELLER_SHARE_PERCENT,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getTravellerStats = getTravellerStats;
const getEarningsPreview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const from = String(req.query.from || "").trim();
        const to = String(req.query.to || "").trim();
        const availableWeight = Number(req.query.availableWeight) || undefined;
        if (!from || !to) {
            return res.status(400).json({ message: "from and to cities are required" });
        }
        const query = {
            status: { $in: ["PENDING", "OPEN", "searching"] },
            traveller: null,
            normalizedPickupCity: { $in: (0, city_1.getCitySearchValues)(from) },
            normalizedDropCity: { $in: (0, city_1.getCitySearchValues)(to) },
        };
        if (availableWeight) {
            query.weight = { $lte: availableWeight };
        }
        const parcels = yield parcel_model_1.default.find(query).select("price").lean();
        const totalValue = (0, earnings_1.sumParcelPrices)(parcels);
        const { companyShare, travellerEarning } = (0, earnings_1.splitEarnings)(totalValue);
        res.json({
            matchingCount: parcels.length,
            totalParcelValue: totalValue,
            companyShare,
            tripEarning: travellerEarning,
            companyFeePercent: earnings_1.COMPANY_FEE_PERCENT,
            travellerSharePercent: earnings_1.TRAVELLER_SHARE_PERCENT,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getEarningsPreview = getEarningsPreview;
