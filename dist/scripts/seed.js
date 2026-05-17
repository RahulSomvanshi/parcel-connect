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
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const user_model_1 = __importDefault(require("../models/user.model"));
dotenv_1.default.config();
const SEED_USERS = [
    {
        fullName: "Admin User",
        email: "zippora.admin@yopmail.com",
        phone: "9000000001",
        password: "Admin@123",
        role: "admin",
    },
    {
        fullName: "Sender User",
        email: "sender@zippora.com",
        phone: "9000000002",
        password: "Sender@123",
        role: "sender",
    },
    {
        fullName: "Traveler User",
        email: "traveler@zippora.com",
        phone: "9000000003",
        password: "Traveler@123",
        role: "traveller",
    },
];
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        for (const seedUser of SEED_USERS) {
            const existing = yield user_model_1.default.findOne({
                $or: [{ phone: seedUser.phone }, { email: seedUser.email }],
            });
            const hashedPassword = yield bcryptjs_1.default.hash(seedUser.password, 10);
            if (existing) {
                existing.fullName = seedUser.fullName;
                existing.email = seedUser.email;
                existing.role = seedUser.role;
                existing.password = hashedPassword;
                existing.isVerified = true;
                existing.otp = undefined;
                existing.otpExpiry = undefined;
                yield existing.save();
                console.log(`Updated: ${seedUser.role} — ${seedUser.phone} (${seedUser.email})`);
                continue;
            }
            yield user_model_1.default.create({
                fullName: seedUser.fullName,
                email: seedUser.email,
                phone: seedUser.phone,
                password: hashedPassword,
                role: seedUser.role,
                isVerified: true,
            });
            console.log(`Created: ${seedUser.role} — phone ${seedUser.phone}`);
        }
        console.log("\nSeed complete. Default accounts:");
        console.log("  Admin    — phone 9000000001 / Admin@123 / zippora.admin@yopmail.com");
        console.log("  Sender   — 9000000002 / Sender@123");
        console.log("  Traveler — 9000000003 / Traveler@123");
        process.exit(0);
    });
}
seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
