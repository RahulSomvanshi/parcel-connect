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
exports.getAllUsers = exports.resendOtp = exports.refreshToken = exports.login = exports.verifyOtp = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const otp_1 = require("../utils/otp");
const jwt_1 = require("../utils/jwt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendSMS_1 = require("../utils/sendSMS");
const sendEmail_1 = require("../utils/sendEmail");
// REGISTER
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, phone, password, role } = req.body;
        // check existing
        const existingUser = yield user_model_1.default.findOne({
            $or: [{ email }],
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // generate OTP
        const otp = (0, otp_1.generateOTP)();
        const allowedRoles = ["user", "admin"];
        let finalRole = "user";
        if (role && allowedRoles.includes(role)) {
            finalRole = role;
        }
        const user = yield user_model_1.default.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: finalRole,
            otp, // store (later hash kar sakte ho)
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
            isVerified: false,
        });
        // 📱 send OTP (SMS or Email) - Non-blocking
        // Don't await these to avoid blocking registration
        (0, sendSMS_1.sendSMS)(phone, otp).catch(err => {
        });
        (0, sendEmail_1.sendEmail)(email, "OTP Verification", `Your OTP is ${otp}`).catch(err => {
        });
        return res.json({
            message: "Registered successfully. OTP sent",
            phone: user.phone, // frontend use karega
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.register = register;
// VERIFY OTP
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, otp } = req.body;
        const user = yield user_model_1.default.findOne({ phone });
        if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        user.isVerified = true;
        user.otp = undefined;
        yield user.save();
        return res.json({ message: "Account verified successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.verifyOtp = verifyOtp;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, password } = req.body;
        // 1. check user by phone or email
        const user = yield user_model_1.default.findOne({
            $or: [
                { phone: phone },
                { email: phone } // treat phone field as email if it contains @
            ]
        });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        // 2. check password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // 3. check verified
        if (!user.isVerified) {
            const otp = (0, otp_1.generateOTP)();
            user.otp = otp;
            user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
            yield user.save();
            return res.status(400).json({
                message: "OTP sent. Please verify",
                isVerified: false,
            });
        }
        // 4. generate token
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        yield user.save();
        return res.json({
            message: "Login successful",
            token,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.login = login;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_SECRET);
        const user = yield user_model_1.default.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        return res.json({ accessToken: newAccessToken });
    }
    catch (_a) {
        return res.status(403).json({ message: "Token expired" });
    }
});
exports.refreshToken = refreshToken;
const resendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = req.body;
        const user = yield user_model_1.default.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "Already verified" });
        }
        const otp = (0, otp_1.generateOTP)();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        yield (0, sendSMS_1.sendSMS)(phone, otp);
        yield user.save();
        return res.json({
            message: "OTP resent successfully"
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.resendOtp = resendOtp;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.default.find().select("-password");
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllUsers = getAllUsers;
