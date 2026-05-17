"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const parcel_1 = require("../constants/parcel");
const parcelSchema = new mongoose_1.Schema({
    traveller: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignedTripId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Traveller",
        default: null,
    },
    pickupCity: { type: String, required: true },
    dropCity: { type: String, required: true },
    normalizedPickupCity: { type: String, required: true },
    normalizedDropCity: { type: String, required: true },
    pickup: {
        city: { type: String, required: true },
        address: { type: String, required: true },
    },
    drop: {
        city: { type: String, required: true },
        address: { type: String, required: true },
    },
    weight: {
        type: Number,
        required: true,
    },
    parcelDate: {
        type: Date,
        required: true,
    },
    preferredTravelDate: {
        type: Date,
        default: null,
    },
    description: String,
    price: Number,
    status: {
        type: String,
        enum: [
            ...parcel_1.PARCEL_STATUSES,
            "PENDING",
            "MATCHED",
            "searching",
            "matched",
            "in_transit",
            "delivered",
        ],
        default: "PENDING",
    },
    isFlagged: {
        type: Boolean,
        default: false,
    },
    flaggedKeywords: {
        type: [String],
        default: [],
    },
}, { timestamps: true });
parcelSchema.index({ sender: 1, status: 1, createdAt: -1 });
parcelSchema.index({ traveller: 1, status: 1, createdAt: -1 });
parcelSchema.index({ status: 1, "pickup.city": 1, "drop.city": 1 });
parcelSchema.index({ normalizedPickupCity: 1, normalizedDropCity: 1, status: 1 });
parcelSchema.index({ normalizedPickupCity: 1, normalizedDropCity: 1, parcelDate: 1, status: 1 });
parcelSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model("Parcel", parcelSchema);
