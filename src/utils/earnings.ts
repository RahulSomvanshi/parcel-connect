export const COMPANY_FEE_PERCENT = 20;
export const TRAVELLER_SHARE_PERCENT = 80;

export function splitEarnings(totalAmount: number) {
  const companyShare = Math.round(totalAmount * (COMPANY_FEE_PERCENT / 100));
  const travellerEarning = Math.round(totalAmount - companyShare);
  return { companyShare, travellerEarning, totalAmount };
}

export function sumParcelPrices(parcels: { price?: number }[]) {
  return parcels.reduce((sum, p) => sum + (p.price || 0), 0);
}
