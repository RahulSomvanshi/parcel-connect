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
exports.getAssignedParcels = exports.getMatchingParcels = exports.deleteTraveller = exports.updateTraveller = exports.getTravellerById = exports.getMyTravellers = exports.createTraveller = void 0;
const traveller_model_1 = __importDefault(require("../models/traveller.model"));
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
// CREATE
const createTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.create(Object.assign(Object.assign({}, req.body), { user: req.user.userId }));
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.createTraveller = createTraveller;
// GET ALL (my plans)
const getMyTravellers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.find({
            user: req.user.userId,
        }).sort({ createdAt: -1 });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMyTravellers = getMyTravellers;
// GET SINGLE
const getTravellerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield traveller_model_1.default.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });
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
        const traveller = yield traveller_model_1.default.findOne({
            user: req.user.userId,
            isAvailable: true,
        }).sort({ createdAt: -1 });
        if (!traveller) {
            return res.status(400).json({
                message: "No active travel plan found",
            });
        }
        const parcels = yield parcel_model_1.default.find({
            status: "searching",
            "pickup.city": traveller.from,
            "drop.city": traveller.to,
            weight: { $lte: traveller.availableWeight },
        }).sort({ createdAt: -1 });
        res.json(parcels);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMatchingParcels = getMatchingParcels;
// 🔥 Traveller  assigned parcels
const getAssignedParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcels = yield parcel_model_1.default.find({
            traveller: req.user.userId
        })
            .populate("sender", "fullName phone") // sender info
            .sort({ createdAt: -1 });
        res.json(parcels);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAssignedParcels = getAssignedParcels;
