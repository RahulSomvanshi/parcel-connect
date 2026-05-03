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
exports.getAllParcelsAdmin = exports.getAllUsers = void 0;
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [users, total] = yield Promise.all([
            user_model_1.default.find()
                .select("-password")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            user_model_1.default.countDocuments()
        ]);
        res.json({
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllUsers = getAllUsers;
// 🔥 ADMIN: get all parcels with pagination
const getAllParcelsAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [parcels, total] = yield Promise.all([
            parcel_model_1.default.find()
                .populate("sender", "fullName phone role")
                .populate("traveller", "fullName phone role")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            parcel_model_1.default.countDocuments()
        ]);
        res.json({
            data: parcels,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllParcelsAdmin = getAllParcelsAdmin;
