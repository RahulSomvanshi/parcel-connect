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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = (to, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("📧 Starting email send process...");
        console.log("📧 Email config check - EMAIL_FROM:", process.env.EMAIL_FROM ? "✅ Set" : "❌ Missing");
        console.log("📧 Email config check - EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Missing");
        console.log("📧 Sending to:", to);
        console.log("📧 Subject:", subject);
        console.log("📧 Message:", text);
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true, // true for 465
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        console.log("📧 Transporter created successfully");
        // Send email
        const info = yield transporter.sendMail({
            from: process.env.EMAIL_FROM, // Sender address
            to, // Receiver address
            subject, // Subject line
            text, // Plain text body
        });
        console.log("✅ Email sent successfully!");
        console.log("✅ Email response:", info.response);
        console.log("✅ Message ID:", info.messageId);
    }
    catch (err) {
        console.error("❌ Email error details:");
        console.error("❌ Error message:", err.message);
        console.error("❌ Error code:", err.code);
        console.error("❌ Error type:", err.name);
        if (err.command) {
            console.error("❌ SMTP command:", err.command);
        }
        if (err.response) {
            console.error("❌ SMTP response:", err.response);
        }
    }
});
exports.sendEmail = sendEmail;
