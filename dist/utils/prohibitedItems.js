"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROHIBITED_KEYWORDS = void 0;
exports.checkProhibitedContent = checkProhibitedContent;
exports.DEFAULT_PROHIBITED_KEYWORDS = [
    "drug",
    "drugs",
    "narcotic",
    "cocaine",
    "heroin",
    "marijuana",
    "weed",
    "weapon",
    "weapons",
    "gun",
    "guns",
    "firearm",
    "ammunition",
    "explosive",
    "explosives",
    "bomb",
    "grenade",
    "illegal chemical",
    "meth",
    "counterfeit",
    "liquor",
    "alcohol",
    "wine",
    "whisky",
];
function checkProhibitedContent(description, details, customKeywords = []) {
    const text = `${description !== null && description !== void 0 ? description : ""} ${details !== null && details !== void 0 ? details : ""}`.toLowerCase();
    const keywords = Array.from(new Set([...exports.DEFAULT_PROHIBITED_KEYWORDS, ...customKeywords.map((k) => k.toLowerCase().trim())])).filter(Boolean);
    const matchedKeywords = keywords.filter((kw) => text.includes(kw));
    return {
        flagged: matchedKeywords.length > 0,
        matchedKeywords,
    };
}
