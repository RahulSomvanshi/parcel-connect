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
exports.getMyParcelsWithTraveller = exports.respondToParcel = exports.deleteParcel = exports.updateParcel = exports.getParcelById = exports.getMyParcels = exports.createParcel = void 0;
const parcel_model_1 = __importDefault(require("../models/parcel.model"));
const sendEmail_1 = require("../utils/sendEmail");
// CREATE
const createParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcel = yield parcel_model_1.default.create(Object.assign(Object.assign({}, req.body), { sender: req.user.userId }));
        return res.json(parcel);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.createParcel = createParcel;
const getMyParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcels = yield parcel_model_1.default.find({
            sender: req.user.userId,
        }).sort({ createdAt: -1 });
        return res.json(parcels);
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
    try {
        const parcel = yield parcel_model_1.default.findOneAndUpdate({
            _id: req.params.id,
            sender: req.user.userId,
            status: "searching", // only editable before match
        }, req.body, { new: true });
        if (!parcel) {
            return res.status(400).json({
                message: "Cannot update parcel",
            });
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
            status: "searching", // only before match
        });
        if (!parcel) {
            return res.status(400).json({
                message: "Cannot delete parcel",
            });
        }
        return res.json({ message: "Parcel deleted" });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.deleteParcel = deleteParcel;
// export const respondToParcel = async (req: any, res: Response) => {
//   try {
//     const { parcelId, action } = req.body;
//     // ✅ basic validation
//     if (!parcelId || !action) {
//       return res.status(400).json({ message: "parcelId & action required" });
//     }
//     // ❌ DECLINE (MVP simple)
//     if (action === "decline") {
//       return res.json({
//         message: "Parcel declined",
//       });
//     }
//     // ✅ ACCEPT (IMPORTANT 🔥)
//     if (action === "accept") {
//       const parcel = await Parcel.findOneAndUpdate(
//         {
//           _id: parcelId,
//           status: "searching", // 🔥 only allow if still available
//         },
//         {
//           traveller: req.user.userId,
//           status: "matched",
//         },
//         { new: true }
//       );
//       // ❌ a   lready taken
//       if (!parcel) {
//         return res.status(400).json({
//           message: "Parcel already accepted by someone else",
//         });
//       }
//       return res.json({
//         message: "Parcel accepted successfully",
//         parcel,
//       });
//     }
//     if (action === "deliver") {
//       const parcel = await Parcel.findOneAndUpdate(
//         {
//           _id: parcelId,
//           traveller: req.user.userId, // 🔥 only assigned traveller
//           status: "matched",          // 🔥 must be matched
//         },
//         {
//           status: "delivered",
//         },
//         { new: true }
//       );
//       if (!parcel) {
//         return res.status(400).json({
//           message: "Parcel cannot be delivered",
//         });
//       }
//       return res.json({
//         message: "Parcel marked as delivered",
//         parcel,
//       });
//     }
//     // ❌ invalid action
//     return res.status(400).json({
//       message: "Invalid action (accept/decline only)",
//     });
//   } catch (err: any) {
//     return res.status(500).json({ message: err.message });
//   }
// };
const respondToParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parcelId, action } = req.body;
        // ✅ validation
        if (!parcelId || !action) {
            return res.status(400).json({ message: "parcelId & action required" });
        }
        // 🔍 parcel fetch with sender
        const parcel = yield parcel_model_1.default.findById(parcelId).populate("sender");
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found" });
        }
        const sender = parcel.sender;
        // ❌ DECLINE
        if (action === "decline") {
            yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel Declined ❌", `Your parcel from ${parcel.pickup.city} to ${parcel.drop.city} was declined by a traveller. Please wait for another traveller.`);
            return res.json({
                message: "Parcel declined & email sent",
            });
        }
        // ✅ ACCEPT
        if (action === "accept") {
            const updatedParcel = yield parcel_model_1.default.findOneAndUpdate({
                _id: parcelId,
                status: "searching",
            }, {
                traveller: req.user.userId,
                status: "matched",
            }, { new: true });
            if (!updatedParcel) {
                return res.status(400).json({
                    message: "Parcel already accepted by someone else",
                });
            }
            yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel Accepted 🎉", `Good news! Your parcel from ${parcel.pickup.city} to ${parcel.drop.city} has been accepted by a traveller.`);
            return res.json({
                message: "Parcel accepted successfully & email sent",
                parcel: updatedParcel,
            });
        }
        // 📦 DELIVER
        if (action === "deliver") {
            const updatedParcel = yield parcel_model_1.default.findOneAndUpdate({
                _id: parcelId,
                traveller: req.user.userId,
                status: "matched",
            }, {
                status: "delivered",
            }, { new: true });
            if (!updatedParcel) {
                return res.status(400).json({
                    message: "Parcel cannot be delivered",
                });
            }
            yield (0, sendEmail_1.sendEmail)(sender.email, "Parcel Delivered ✅", `Your parcel from ${parcel.pickup.city} to ${parcel.drop.city} has been successfully delivered.`);
            return res.json({
                message: "Parcel marked as delivered & email sent",
                parcel: updatedParcel,
            });
        }
        // ❌ invalid
        return res.status(400).json({
            message: "Invalid action (accept/decline/deliver only)",
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.respondToParcel = respondToParcel;
// 🔥 Sender ke parcels with traveller info
const getMyParcelsWithTraveller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcels = yield parcel_model_1.default.find({
            sender: req.user.userId
        })
            .populate("traveller", "fullName phone") // 🔥 traveller info
            .sort({ createdAt: -1 });
        res.json(parcels);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMyParcelsWithTraveller = getMyParcelsWithTraveller;
