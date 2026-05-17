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
exports.getMyParcelsWithTraveller = exports.updateParcelStatusByTraveller = exports.respondToParcel = exports.deleteParcel = exports.updateParcel = exports.getParcelById = exports.getMyParcels = exports.getProhibitedItems = exports.createParcel = void 0;
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const sendEmail_1 = require("../utils/sendEmail");
const prohibitedItems_1 = require("../utils/prohibitedItems");
const parcel_1 = require("../constants/parcel");
const system_config_model_1 = __importDefault(require("../models/system-config.model"));
const traveller_model_1 = __importDefault(require("../models/traveller.model"));
const city_1 = require("../utils/city");
const pagination_1 = require("../utils/pagination");
const PROHIBITED_ITEMS_KEY = "prohibited_items";
function getConfiguredProhibitedItems() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield system_config_model_1.default.findOne({ key: PROHIBITED_ITEMS_KEY }).lean();
        const custom = ((config === null || config === void 0 ? void 0 : config.stringValues) || []).map((v) => String(v).trim().toLowerCase());
        return Array.from(new Set([...prohibitedItems_1.DEFAULT_PROHIBITED_KEYWORDS, ...custom])).filter(Boolean);
    });
}
const createParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pickup, drop, weight, parcelDate, preferredTravelDate, description, price } = req.body;
        if (!(pickup === null || pickup === void 0 ? void 0 : pickup.city) || !(drop === null || drop === void 0 ? void 0 : drop.city)) {
            return res.status(400).json({ message: "Pickup and drop city are required" });
        }
        if (!parcelDate) {
            return res.status(400).json({ message: "parcelDate is required" });
        }
        const prohibitedItems = yield getConfiguredProhibitedItems();
        const prohibited = (0, prohibitedItems_1.checkProhibitedContent)(description, undefined, prohibitedItems);
        if (prohibited.flagged) {
            return res.status(400).json({
                message: `Parcel cannot be created with restricted items: ${prohibited.matchedKeywords.join(", ")}`,
                blockedItems: prohibited.matchedKeywords,
            });
        }
        const parcel = yield parcel_model_1.default.create({
            senderId: req.user.userId,
            pickup: {
                city: pickup.city.trim(),
                address: (pickup.address || pickup.city).trim(),
            },
            drop: {
                city: drop.city.trim(),
                address: (drop.address || drop.city).trim(),
            },
            pickupCity: pickup.city.trim(),
            dropCity: drop.city.trim(),
            normalizedPickupCity: (0, city_1.normalizeCityName)(pickup.city),
            normalizedDropCity: (0, city_1.normalizeCityName)(drop.city),
            weight,
            parcelDate: new Date(parcelDate),
            preferredTravelDate: preferredTravelDate ? new Date(preferredTravelDate) : undefined,
            description,
            price,
            sender: req.user.userId,
            status: "PENDING",
            isFlagged: false,
            flaggedKeywords: [],
        });
        return res.json(parcel);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.createParcel = createParcel;
/** Sender/traveller UI list of prohibited/disclaimer items */
const getProhibitedItems = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield getConfiguredProhibitedItems();
        return res.json({ items });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getProhibitedItems = getProhibitedItems;
const getMyParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const filter = { sender: req.user.userId };
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            parcel_model_1.default.countDocuments(filter),
        ]);
        return res.json({ parcels, pagination: (0, pagination_1.paginationMeta)(total, page, limit), total, page, limit });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getMyParcels = getMyParcels;
const getParcelById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcel = yield parcel_model_1.default.findOne({
            _id: req.params.id,
            sender: req.user.userId,
        });
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found" });
        }
        return res.json(parcel);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getParcelById = getParcelById;
const updateParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const payload = Object.assign({}, req.body);
        if ((_a = payload.pickup) === null || _a === void 0 ? void 0 : _a.city) {
            payload.pickupCity = String(payload.pickup.city).trim();
            payload.normalizedPickupCity = (0, city_1.normalizeCityName)(payload.pickup.city);
        }
        if ((_b = payload.drop) === null || _b === void 0 ? void 0 : _b.city) {
            payload.dropCity = String(payload.drop.city).trim();
            payload.normalizedDropCity = (0, city_1.normalizeCityName)(payload.drop.city);
        }
        if (payload.parcelDate) {
            payload.parcelDate = new Date(payload.parcelDate);
        }
        if (payload.preferredTravelDate) {
            payload.preferredTravelDate = new Date(payload.preferredTravelDate);
        }
        const openFilter = (0, parcel_1.openStatusFilter)();
        const parcel = yield parcel_model_1.default.findOneAndUpdate({
            _id: req.params.id,
            sender: req.user.userId,
            status: openFilter,
        }, payload, { new: true });
        if (!parcel) {
            return res.status(400).json({ message: "Cannot update parcel" });
        }
        return res.json(parcel);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.updateParcel = updateParcel;
const deleteParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcel = yield parcel_model_1.default.findOneAndDelete({
            _id: req.params.id,
            sender: req.user.userId,
            status: (0, parcel_1.openStatusFilter)(),
        });
        if (!parcel) {
            return res.status(400).json({ message: "Cannot delete parcel" });
        }
        return res.json({ message: "Parcel deleted" });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.deleteParcel = deleteParcel;
const STATUS_TRANSITIONS = {
    accept: { from: ["PENDING", "OPEN", "searching"], to: "MATCHED" },
    reject: { from: ["PENDING", "OPEN", "searching"], to: "CANCELLED" },
    pick_up: { from: ["MATCHED", "ACCEPTED", "matched"], to: "PICKED_UP" },
    in_transit: { from: ["PICKED_UP", "MATCHED", "ACCEPTED", "matched"], to: "IN_TRANSIT" },
    deliver: { from: ["IN_TRANSIT", "PICKED_UP", "MATCHED", "matched", "in_transit"], to: "DELIVERED" },
    cancel: {
        from: ["PENDING", "OPEN", "MATCHED", "PICKED_UP", "IN_TRANSIT", "searching", "matched", "in_transit"],
        to: "CANCELLED",
    },
};
const respondToParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parcelId, action } = req.body;
        if (!parcelId || !action) {
            return res.status(400).json({ message: "parcelId & action required" });
        }
        const transition = STATUS_TRANSITIONS[action];
        if (!transition) {
            return res.status(400).json({
                message: "Invalid action. Use: accept, reject, pick_up, in_transit, deliver, cancel",
            });
        }
        // Reject without assignment — traveller declines before accepting
        if (action === "reject") {
            const parcel = yield parcel_model_1.default.findById(parcelId).populate("sender");
            if (!parcel) {
                return res.status(404).json({ message: "Parcel not found" });
            }
            const sender = parcel.sender;
            if (sender === null || sender === void 0 ? void 0 : sender.email) {
                yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel declined", `A traveller declined your parcel from ${parcel.pickup.city} to ${parcel.drop.city}.`);
            }
            return res.json({ message: "Parcel rejected by traveller" });
        }
        // Atomic accept — only one traveller wins
        if (action === "accept") {
            const updatedParcel = yield parcel_model_1.default.findOneAndUpdate({
                _id: parcelId,
                status: (0, parcel_1.openStatusFilter)(),
                traveller: null,
            }, {
                traveller: req.user.userId,
                status: "MATCHED",
            }, { new: true }).populate("sender", "email fullName");
            if (!updatedParcel) {
                return res.status(400).json({
                    message: "Parcel already accepted by another traveller",
                });
            }
            const sender = updatedParcel.sender;
            if (sender === null || sender === void 0 ? void 0 : sender.email) {
                yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel accepted", `Your parcel from ${updatedParcel.pickup.city} to ${updatedParcel.drop.city} was accepted.`);
            }
            return res.json({
                message: "Parcel accepted",
                parcel: updatedParcel,
                warning: updatedParcel.isFlagged
                    ? "This parcel was flagged for prohibited content. Review before pickup."
                    : undefined,
            });
        }
        const updatedParcel = yield parcel_model_1.default.findOneAndUpdate({
            _id: parcelId,
            traveller: req.user.userId,
            status: { $in: transition.from },
        }, { status: transition.to }, { new: true }).populate("sender", "email");
        if (!updatedParcel) {
            return res.status(400).json({ message: "Status update not allowed" });
        }
        const sender = updatedParcel.sender;
        if (action === "deliver" && (sender === null || sender === void 0 ? void 0 : sender.email)) {
            yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel delivered", `Your parcel from ${updatedParcel.pickup.city} to ${updatedParcel.drop.city} was delivered.`);
        }
        return res.json({ message: `Parcel ${action}`, parcel: updatedParcel });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.respondToParcel = respondToParcel;
const updateParcelStatusByTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parcelId } = req.params;
        const { status } = req.body;
        const allowedStatuses = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Allowed statuses: PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED",
            });
        }
        const parcel = yield parcel_model_1.default.findOneAndUpdate({
            _id: parcelId,
            traveller: req.user.userId,
            status: {
                $in: status === "PICKED_UP"
                    ? ["MATCHED", "matched", "ACCEPTED"]
                    : status === "IN_TRANSIT"
                        ? ["PICKED_UP", "MATCHED", "matched", "ACCEPTED"]
                        : status === "OUT_FOR_DELIVERY"
                            ? ["IN_TRANSIT", "in_transit", "PICKED_UP", "MATCHED", "matched"]
                            : ["OUT_FOR_DELIVERY", "IN_TRANSIT", "in_transit", "PICKED_UP", "MATCHED", "matched"],
            },
        }, { status }, { new: true });
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found or status transition denied" });
        }
        if (parcel.assignedTripId) {
            if (status === "PICKED_UP" || status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") {
                yield traveller_model_1.default.findByIdAndUpdate(parcel.assignedTripId, {
                    status: "IN_TRANSIT",
                    isAvailable: false,
                });
            }
            if (status === "DELIVERED") {
                const pendingInTrip = yield parcel_model_1.default.countDocuments({
                    assignedTripId: parcel.assignedTripId,
                    status: {
                        $in: [
                            "PENDING",
                            "MATCHED",
                            "PICKED_UP",
                            "IN_TRANSIT",
                            "OUT_FOR_DELIVERY",
                            "OPEN",
                            "searching",
                            "matched",
                            "in_transit",
                        ],
                    },
                });
                if (pendingInTrip === 0) {
                    yield traveller_model_1.default.findByIdAndUpdate(parcel.assignedTripId, {
                        status: "COMPLETED",
                        isAvailable: false,
                    });
                }
            }
        }
        return res.json({ message: "Parcel status updated", parcel });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.updateParcelStatusByTraveller = updateParcelStatusByTraveller;
const getMyParcelsWithTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const filter = { sender: req.user.userId };
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find(filter)
                .populate("traveller", "fullName phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            parcel_model_1.default.countDocuments(filter),
        ]);
        return res.json({ parcels, pagination: (0, pagination_1.paginationMeta)(total, page, limit), total, page, limit });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getMyParcelsWithTraveller = getMyParcelsWithTraveller;
