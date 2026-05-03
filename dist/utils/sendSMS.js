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
exports.sendSMS = void 0;
const axios_1 = __importDefault(require("axios"));
const sendSMS = (phone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        console.log("📱 Starting SMS send process...");
        console.log("📱 SMS config check - MSG91_AUTH_KEY:", process.env.MSG91_AUTH_KEY ? "✅ Set" : "❌ Missing");
        console.log("📱 SMS config check - MSG91_FLOW_ID:", process.env.MSG91_FLOW_ID ? "✅ Set" : "❌ Missing");
        console.log("📱 Sending to phone:", phone);
        console.log("📱 OTP:", otp);
        const smsData = {
            flow_id: process.env.MSG91_FLOW_ID,
            sender: "MSGIND",
            mobiles: `91${phone}`,
            OTP: otp
        };
        console.log("📱 SMS request data:", smsData);
        const response = yield axios_1.default.post("https://control.msg91.com/api/v5/flow/", smsData, {
            headers: {
                authkey: process.env.MSG91_AUTH_KEY,
                "Content-Type": "application/json"
            }
        });
        console.log("✅ SMS sent successfully!");
        console.log("✅ SMS response:", response.data);
        console.log("✅ SMS response status:", response.status);
    }
    catch (err) {
        console.error("❌ SMS error details:");
        console.error("❌ Error message:", err.message);
        console.error("❌ Error status:", (_a = err.response) === null || _a === void 0 ? void 0 : _a.status);
        console.error("❌ Error data:", (_b = err.response) === null || _b === void 0 ? void 0 : _b.data);
        if ((_c = err.response) === null || _c === void 0 ? void 0 : _c.status) {
            console.error("❌ HTTP Status:", err.response.status);
        }
        if ((_d = err.response) === null || _d === void 0 ? void 0 : _d.data) {
            console.error("❌ Response Data:", JSON.stringify(err.response.data, null, 2));
        }
    }
});
exports.sendSMS = sendSMS;
