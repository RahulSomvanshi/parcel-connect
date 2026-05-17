"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitySearchValues = exports.normalizeCityName = void 0;
const CITY_ALIASES = {
    banglore: "bangalore",
    bengaluru: "bangalore",
    "u.p": "uttar pradesh",
    "u.p.": "uttar pradesh",
    up: "uttar pradesh",
};
const normalizeCityName = (city) => {
    const normalized = String(city || "")
        .toLowerCase()
        .trim()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
    return CITY_ALIASES[normalized] || normalized;
};
exports.normalizeCityName = normalizeCityName;
const getCitySearchValues = (city) => {
    const normalized = (0, exports.normalizeCityName)(city);
    const values = new Set([normalized]);
    for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
        if (canonical === normalized) {
            values.add(alias);
        }
    }
    return Array.from(values);
};
exports.getCitySearchValues = getCitySearchValues;
