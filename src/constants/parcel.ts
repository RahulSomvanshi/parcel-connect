/** Canonical parcel lifecycle statuses */
export const PARCEL_STATUSES = [
  "PENDING",
  "MATCHED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type ParcelStatus = (typeof PARCEL_STATUSES)[number];

/** Legacy DB values → canonical (for reads/migration) */
export const LEGACY_STATUS_MAP: Record<string, ParcelStatus> = {
  OPEN: "PENDING",
  ACCEPTED: "MATCHED",
  searching: "PENDING",
  matched: "MATCHED",
  in_transit: "IN_TRANSIT",
  delivered: "DELIVERED",
};

export const OPEN_STATUSES: ParcelStatus[] = ["PENDING"];
export const ASSIGNED_STATUSES: ParcelStatus[] = [
  "MATCHED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export function normalizeParcelStatus(status: string): ParcelStatus {
  if ((PARCEL_STATUSES as readonly string[]).includes(status)) {
    return status as ParcelStatus;
  }
  return LEGACY_STATUS_MAP[status] ?? "PENDING";
}

export function openStatusFilter() {
  return { $in: ["PENDING", "OPEN", "searching"] };
}
