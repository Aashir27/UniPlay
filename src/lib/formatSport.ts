export function getSportEventNoun(sport: string): "game" | "session" {
  return sport.trim().toLowerCase() === "swimming" ? "session" : "game";
}

export function formatSportEvent(sport: string): string {
  const clean = sport.trim();
  if (!clean) return "game";
  return `${clean} ${getSportEventNoun(clean)}`;
}
