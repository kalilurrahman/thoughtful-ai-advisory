const KEY = "aegis-governance-games-v1";
export type GamePreferences = { favorites: string[]; recentlyPlayed: string[] };
export const emptyGamePreferences = (): GamePreferences => ({ favorites: [], recentlyPlayed: [] });
export function parseGamePreferences(value: string | null): GamePreferences {
  if (!value) return emptyGamePreferences();
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object") return emptyGamePreferences();
    const record = data as Record<string, unknown>;
    return {
      favorites: Array.isArray(record.favorites)
        ? record.favorites.filter((item): item is string => typeof item === "string")
        : [],
      recentlyPlayed: Array.isArray(record.recentlyPlayed)
        ? record.recentlyPlayed
            .filter((item): item is string => typeof item === "string")
            .slice(0, 5)
        : [],
    };
  } catch {
    return emptyGamePreferences();
  }
}
export function saveGamePreferences(preferences: GamePreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(preferences));
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}
export function loadGamePreferences() {
  if (typeof window === "undefined") return emptyGamePreferences();
  try {
    return parseGamePreferences(window.localStorage.getItem(KEY));
  } catch {
    return emptyGamePreferences();
  }
}
