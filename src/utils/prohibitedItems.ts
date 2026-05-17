export const DEFAULT_PROHIBITED_KEYWORDS = [
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

export interface ProhibitedCheckResult {
  flagged: boolean;
  matchedKeywords: string[];
}

export function checkProhibitedContent(
  description?: string,
  details?: string,
  customKeywords: string[] = []
): ProhibitedCheckResult {
  const text = `${description ?? ""} ${details ?? ""}`.toLowerCase();
  const keywords = Array.from(
    new Set([...DEFAULT_PROHIBITED_KEYWORDS, ...customKeywords.map((k) => k.toLowerCase().trim())])
  ).filter(Boolean);
  const matchedKeywords = keywords.filter((kw) => text.includes(kw));
  return {
    flagged: matchedKeywords.length > 0,
    matchedKeywords,
  };
}
