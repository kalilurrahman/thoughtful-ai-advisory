import { describe, expect, it } from "vitest";
import {
  canEdit,
  canManage,
  canManageMembers,
  checkSeat,
  hashInviteToken,
  inviteLink,
  newInviteToken,
  normalizeInviteEmail,
  usesSeat,
} from "@/features/governance/team-model";

// Team workspace rules (src/features/governance/team-model.ts). The database applies the same
// rules in migration 0012; these keep the team screens in step with it.

describe("roles", () => {
  it("charges a seat only for roles that edit", () => {
    expect(["owner", "admin", "operator"].every((r) => usesSeat(r as never))).toBe(true);
    expect(usesSeat("approver")).toBe(false);
    expect(usesSeat("viewer")).toBe(false);
    expect(canEdit("operator")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });

  it("lets owners and admins manage members, never the owner", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("operator")).toBe(false);
    expect(canManage("owner", "admin", false)).toBe(true);
    expect(canManage("admin", "operator", false)).toBe(true);
    expect(canManage("admin", "admin", false)).toBe(false);
    expect(canManage("admin", "admin", true)).toBe(true);
    expect(canManage("owner", "owner", true)).toBe(false);
    expect(canManage("operator", "viewer", false)).toBe(false);
  });
});

describe("seats", () => {
  it("refuses a seat role when the plan's seats are used, but never a free role", () => {
    expect(checkSeat("operator", 4, 5, "Team")).toBeNull();
    expect(checkSeat("operator", 5, 5, "Team")).toMatch(
      /All 5 operator seats are in use on the Team plan/,
    );
    expect(checkSeat("admin", 1, 1, "Free")).toMatch(/1 operator seat is in use/);
    expect(checkSeat("viewer", 99, 1, "Free")).toBeNull();
    expect(checkSeat("approver", 99, 1, "Free")).toBeNull();
  });
});

describe("invitations", () => {
  it("normalizes e-mail addresses and rejects invalid ones", () => {
    expect(normalizeInviteEmail("  Ana@Example.COM ")).toBe("ana@example.com");
    expect(normalizeInviteEmail("not-an-email")).toBeNull();
    expect(normalizeInviteEmail(`${"a".repeat(250)}@x.io`)).toBeNull();
  });

  it("makes unguessable URL-safe tokens and stores only their SHA-256", async () => {
    const a = newInviteToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newInviteToken()).not.toBe(a);
    expect(await hashInviteToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(inviteLink("https://app.example/", a)).toBe(`https://app.example/invite?token=${a}`);
  });
});
