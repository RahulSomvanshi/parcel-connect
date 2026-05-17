"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRAVELLER_SHARE_PERCENT = exports.COMPANY_FEE_PERCENT = void 0;
exports.splitEarnings = splitEarnings;
exports.sumParcelPrices = sumParcelPrices;
exports.COMPANY_FEE_PERCENT = 20;
exports.TRAVELLER_SHARE_PERCENT = 80;
function splitEarnings(totalAmount) {
    const companyShare = Math.round(totalAmount * (exports.COMPANY_FEE_PERCENT / 100));
    const travellerEarning = Math.round(totalAmount - companyShare);
    return { companyShare, travellerEarning, totalAmount };
}
function sumParcelPrices(parcels) {
    return parcels.reduce((sum, p) => sum + (p.price || 0), 0);
}
