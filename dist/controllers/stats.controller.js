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
exports.getPublicStats = void 0;
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getPublicStats = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const [totalParcels, totalUsers, routes] = yield Promise.all([
            parcel_model_1.default.countDocuments(),
            user_model_1.default.countDocuments({ isVerified: true }),
            parcel_model_1.default.aggregate([
                {
                    $group: {
                        _id: {
                            from: "$pickup.city",
                            to: "$drop.city",
                        },
                    },
                },
                { $count: "count" },
            ]),
        ]);
        res.json({
            totalParcels,
            totalUsers,
            activeRoutes: ((_a = routes[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getPublicStats = getPublicStats;
