"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const parcel_routes_1 = __importDefault(require("./routes/parcel.routes"));
const traveller_routes_1 = __importDefault(require("./routes/traveller.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const security_middleware_1 = require("./middleware/security.middleware");
const app = (0, express_1.default)();
app.set("etag", false);
// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});
app.use("/api/auth", security_middleware_1.authRateLimit);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/parcels", parcel_routes_1.default);
app.use("/api/traveller", traveller_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/stats", stats_routes_1.default);
// Test route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});
exports.default = app;
