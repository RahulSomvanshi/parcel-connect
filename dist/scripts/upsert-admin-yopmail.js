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
/**
 * Upsert admin test user with Yopmail (for admin flow testing).
 * Run: npm run seed:admin
 */
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const user_model_1 = __importDefault(require("../models/user.model"));
dotenv_1.default.config();
const ADMIN = {
    fullName: "Admin User",
    email: "zippora.admin@yopmail.com",
    phone: "9000000001",
    password: "Admin@123",
    role: "admin",
};
function upsertAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        const hashedPassword = yield bcryptjs_1.default.hash(ADMIN.password, 10);
        let user = yield user_model_1.default.findOne({
            $or: [{ phone: ADMIN.phone }, { email: ADMIN.email }, { role: "admin" }],
        });
        if (user) {
            user.fullName = ADMIN.fullName;
            user.email = ADMIN.email;
            user.phone = ADMIN.phone;
            user.password = hashedPassword;
            user.role = ADMIN.role;
            user.isVerified = true;
            user.otp = undefined;
            user.otpExpiry = undefined;
            yield user.save();
            console.log("Updated existing admin user.");
        }
        else {
            user = yield user_model_1.default.create(Object.assign(Object.assign({}, ADMIN), { password: hashedPassword, isVerified: true }));
            console.log("Created admin user.");
        }
        console.log("\n--- Admin login (test admin flow) ---");
        console.log("  Phone:    ", ADMIN.phone);
        console.log("  Email:    ", ADMIN.email);
        console.log("  Password: ", ADMIN.password);
        console.log("  Inbox:    https://yopmail.com/en/?login=zippora.admin");
        console.log("\nAfter login, open: /#/dashboard/admin");
        process.exit(0);
    });
}
upsertAdmin().catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
});
