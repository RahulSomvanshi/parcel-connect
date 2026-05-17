"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSIGNED_STATUSES = exports.OPEN_STATUSES = exports.LEGACY_STATUS_MAP = exports.PARCEL_STATUSES = void 0;
exports.normalizeParcelStatus = normalizeParcelStatus;
exports.openStatusFilter = openStatusFilter;
/** Canonical parcel lifecycle statuses */
exports.PARCEL_STATUSES = [
    "PENDING",
    "MATCHED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
];
/** Legacy DB values → canonical (for reads/migration) */
exports.LEGACY_STATUS_MAP = {
    OPEN: "PENDING",
    ACCEPTED: "MATCHED",
    searching: "PENDING",
    matched: "MATCHED",
    in_transit: "IN_TRANSIT",
    delivered: "DELIVERED",
};
exports.OPEN_STATUSES = ["PENDING"];
exports.ASSIGNED_STATUSES = [
    "MATCHED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
];
function normalizeParcelStatus(status) {
    var _a;
    if (exports.PARCEL_STATUSES.includes(status)) {
        return status;
    }
    return (_a = exports.LEGACY_STATUS_MAP[status]) !== null && _a !== void 0 ? _a : "PENDING";
}
function openStatusFilter() {
    return { $in: ["PENDING", "OPEN", "searching"] };
}
