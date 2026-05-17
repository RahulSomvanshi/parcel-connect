const CITY_ALIASES: Record<string, string> = {
  banglore: "bangalore",
  bengaluru: "bangalore",
  "u.p": "uttar pradesh",
  "u.p.": "uttar pradesh",
  up: "uttar pradesh",
};

export const normalizeCityName = (city: string): string => {
  const normalized = String(city || "")
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");

  return CITY_ALIASES[normalized] || normalized;
};

export const getCitySearchValues = (city: string): string[] => {
  const normalized = normalizeCityName(city);
  const values = new Set([normalized]);

  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (canonical === normalized) {
      values.add(alias);
    }
  }

  return Array.from(values);
};
