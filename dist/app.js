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
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/parcels", parcel_routes_1.default);
app.use("/api/traveller", traveller_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
// Test route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});
exports.default = app;
