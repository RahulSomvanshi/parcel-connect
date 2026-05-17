"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = void 0;
const WINDOW_MS = 5 * 60 * 1000;
const LIMIT = 30;
const store = new Map();
const SENSITIVE_PATHS = new Set([
    "/login",
    "/register",
    "/verify-otp",
    "/resend-otp",
    "/refresh-token",
]);
function getClientKey(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }
    return req.ip || "unknown";
}
function getIdentityKey(req) {
    const body = (req.body || {});
    const identity = (typeof body.phone === "string" && body.phone.trim().toLowerCase()) ||
        (typeof body.email === "string" && body.email.trim().toLowerCase()) ||
        "anonymous";
    return identity;
}
const authRateLimit = (req, res, next) => {
    // Only rate limit auth mutation endpoints.
    if (!SENSITIVE_PATHS.has(req.path)) {
        return next();
    }
    // Prevent one user's attempts from blocking all users behind same IP.
    const key = `${req.path}:${getClientKey(req)}:${getIdentityKey(req)}`;
    const now = Date.now();
    const current = store.get(key);
    if (!current || now > current.resetAt) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }
    current.count += 1;
    if (current.count > LIMIT) {
        return res.status(429).json({
            message: "Too many auth requests. Please try again in a few minutes.",
        });
    }
    return next();
};
exports.authRateLimit = authRateLimit;
