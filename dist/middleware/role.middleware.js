"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a, _b;
        console.log("req.user?.role", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        if (!roles.includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
