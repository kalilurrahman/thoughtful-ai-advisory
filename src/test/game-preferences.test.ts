import { describe, expect, it } from "vitest";
import {
  emptyGamePreferences,
  parseGamePreferences,
} from "@/features/governance/games/preferences";
describe("local arcade preferences", () => {
  it("safely defaults on missing or invalid storage", () => {
    expect(parseGamePreferences(null)).toEqual(emptyGamePreferences());
    expect(parseGamePreferences("not-json")).toEqual(emptyGamePreferences());
  });
  it("validates preference arrays and caps recently played history", () => {
    expect(
      parseGamePreferences(
        JSON.stringify({ favorites: ["a", 1], recentlyPlayed: ["a", "b", "c", "d", "e", "f"] }),
      ),
    ).toEqual({ favorites: ["a"], recentlyPlayed: ["a", "b", "c", "d", "e"] });
  });
});
