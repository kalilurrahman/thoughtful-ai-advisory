/**
 * Policy versioning and lifecycle helpers — port of
 * platform/app/policy-engine/veritrail_policy/versioning.py.
 *
 * Every material change produces a new semantic version, resets the policy to `draft`, clears
 * approvals (approvals bind to a reviewed version), records the previous version for rollback
 * and appends to `change_history`. Status changes follow STATUS_TRANSITIONS; `approved` /
 * `active` require recorded human approvals from the required roles (IS-13, GL-04) and are
 * never performed by the advisor or generator.
 */
import { deepClone, isPlainObject, pyRepr, pyStr } from "../../site/engines/shield/py";
import { parseSemver, semverKey, validatePolicy } from "../../site/engines/shield/schema";
import { PolicyPermissionError, STATUS_TRANSITIONS, type Policy } from "./engine";
import { pyEq } from "./pyre";

type Dict = Record<string, unknown>;

export interface ClockOptions {
  /** ISO date used for change-history entries (default: today, UTC). */
  today?: string;
  /** ISO timestamp (seconds, +00:00) used for approvals (default: now, UTC). */
  now?: string;
}

function today(opts?: ClockOptions): string {
  return opts?.today ?? new Date().toISOString().slice(0, 10);
}

function now(opts?: ClockOptions): string {
  return opts?.now ?? `${new Date().toISOString().slice(0, 19)}+00:00`;
}

/** Bump a semantic version. `part` = major | minor | patch. Pre-release tags are dropped. */
export function bumpVersion(version: string, part: "major" | "minor" | "patch" | string = "minor"): string {
  const [ma, mi, pa, pre] = parseSemver(version);
  if (part === "major") return `${ma + 1}.0.0`;
  if (part === "minor") return `${ma}.${mi + 1}.0`;
  if (part === "patch") return pre.length ? `${ma}.${mi}.${pa}` : `${ma}.${mi}.${pa + 1}`;
  throw new Error("part must be one of major, minor, patch");
}

/** Return a copy of `policy` with a change-history entry for its current version. */
export function recordChange(
  policy: Policy,
  author: string,
  summary: string,
  changeType = "modified",
  date?: string | null,
  opts?: ClockOptions,
): Policy {
  const p = deepClone(policy);
  if (!Array.isArray(p["change_history"])) p["change_history"] = [];
  (p["change_history"] as Dict[]).push({
    version: p["version"],
    date: date || today(opts),
    author,
    change_type: changeType,
    summary,
  });
  return p;
}

function deepMerge(base: Dict, upd: Dict): void {
  for (const [k, v] of Object.entries(upd)) {
    if (isPlainObject(v) && isPlainObject(base[k])) deepMerge(base[k] as Dict, v);
    else base[k] = v;
  }
}

/**
 * Create the next draft version of a policy. `changes` is deep-merged into the copy (lists
 * are replaced). The result is `draft` with approvals cleared and `rollback.previous_version`
 * set to the old version.
 */
export function newVersion(
  policy: Policy,
  changes: Dict | null,
  opts: { part?: string; author: string; summary: string } & ClockOptions,
): Policy {
  const p = deepClone(policy);
  if (changes && Object.keys(changes).length) deepMerge(p, deepClone(changes));
  const old = String(policy["version"]);
  p["version"] = bumpVersion(old, opts.part ?? "minor");
  p["status"] = "draft";
  if (!isPlainObject(p["rollback"])) p["rollback"] = {};
  const rb = p["rollback"] as Dict;
  rb["previous_version"] = old;
  if (rb["strategy"] === undefined || rb["strategy"] === null || rb["strategy"] === "disable") {
    rb["strategy"] = "revert_to_previous";
  }
  const appr = p["approval"] as Dict;
  appr["approved_by"] = [];
  appr["approved_at"] = null;
  return recordChange(p, opts.author, opts.summary, "modified", null, opts);
}

export interface DiffEntry {
  path: string;
  change: "added" | "removed" | "changed";
  old: unknown;
  new: unknown;
}

/**
 * Structural diff -> [{path, change: added|removed|changed, old, new}]. Lists of objects with
 * an `id` (tool rules, transforms) are matched by id so diffs stay readable for reviewers.
 */
export function diffPolicies(old: unknown, nu: unknown, path = ""): DiffEntry[] {
  const out: DiffEntry[] = [];
  if (isPlainObject(old) && isPlainObject(nu)) {
    const keys = [...Object.keys(old), ...Object.keys(nu).filter((k) => !(k in old))];
    for (const k of keys) {
      const sub = path ? `${path}.${k}` : k;
      if (!Object.prototype.hasOwnProperty.call(nu, k)) {
        out.push({ path: sub, change: "removed", old: old[k], new: null });
      } else if (!Object.prototype.hasOwnProperty.call(old, k)) {
        out.push({ path: sub, change: "added", old: null, new: nu[k] });
      } else out.push(...diffPolicies(old[k], nu[k], sub));
    }
    return out;
  }
  if (Array.isArray(old) && Array.isArray(nu)) {
    const all = [...old, ...nu];
    const keyed = all.length > 0 && all.every((x) => isPlainObject(x) && "id" in x);
    if (keyed) {
      const idKey = (x: unknown) => JSON.stringify((x as Dict)["id"]);
      const om = new Map<string, Dict>();
      for (const x of old) om.set(idKey(x), x as Dict);
      const nm = new Map<string, Dict>();
      for (const x of nu) nm.set(idKey(x), x as Dict);
      const keys = [...om.keys(), ...[...nm.keys()].filter((k) => !om.has(k))];
      for (const k of keys) {
        const idVal = (om.get(k) ?? nm.get(k))!["id"];
        const sub = `${path}[${pyStr(idVal)}]`;
        if (!nm.has(k)) out.push({ path: sub, change: "removed", old: om.get(k), new: null });
        else if (!om.has(k)) out.push({ path: sub, change: "added", old: null, new: nm.get(k) });
        else out.push(...diffPolicies(om.get(k), nm.get(k), sub));
      }
      return out;
    }
    if (!pyEq(old, nu)) out.push({ path, change: "changed", old, new: nu });
    return out;
  }
  if (!pyEq(old, nu)) out.push({ path, change: "changed", old, new: nu });
  return out;
}

export function summarizeDiff(diff: readonly DiffEntry[]): string[] {
  const lines: string[] = [];
  for (const d of diff) {
    if (d.path.startsWith("change_history")) continue;
    if (d.change === "changed") lines.push(`${d.path}: ${pyRepr(d.old)} -> ${pyRepr(d.new)}`);
    else lines.push(`${d.path}: ${d.change}`);
  }
  return lines;
}

export interface Approver {
  name: string;
  role: string;
}

/**
 * Record a human approval on an `in_review` policy. Enforces: role is a required approver
 * role; separation of duties (the author of the current version cannot approve it) when
 * enabled; no duplicate approver names.
 */
export function addApproval(
  policy: Policy,
  approver: Partial<Approver> | null,
  note = "",
  opts?: ClockOptions,
): Policy {
  if (policy["status"] !== "in_review") {
    throw new Error("approvals can only be recorded while the policy is in_review");
  }
  const name = approver?.name;
  const role = approver?.role;
  if (!name || !role) throw new Error("approver name and role are required");
  const appr = policy["approval"] as Dict;
  if (!(appr["required_approver_roles"] as string[]).includes(role)) {
    throw new PolicyPermissionError(`role '${role}' is not a required approver role for this policy`);
  }
  if (appr["separation_of_duties"] ?? true) {
    const authors = new Set(
      ((policy["change_history"] as Dict[] | undefined) ?? [])
        .filter(
          (h) =>
            h["version"] === policy["version"] &&
            ["created", "modified", "rollback"].includes(String(h["change_type"])),
        )
        .map((h) => h["author"]),
    );
    if (authors.has(name)) {
      throw new PolicyPermissionError(
        "separation of duties: the author of this version cannot approve it",
      );
    }
  }
  if (((appr["approved_by"] as Dict[]) ?? []).some((a) => a["name"] === name)) {
    throw new Error(`${name} has already approved this version`);
  }
  const p = deepClone(policy);
  const entry: Dict = { name, role, approved_at: now(opts) };
  if (note) entry["note"] = note;
  ((p["approval"] as Dict)["approved_by"] as Dict[]).push(entry);
  return p;
}

export function approvalsComplete(policy: Policy): boolean {
  const appr = policy["approval"] as Dict;
  const by = (appr["approved_by"] as Dict[]) ?? [];
  const roles = new Set(by.map((a) => a["role"]));
  const names = new Set(by.map((a) => a["name"]));
  return (
    (appr["required_approver_roles"] as string[]).every((r) => roles.has(r)) &&
    names.size >= Number(appr["min_approvers"])
  );
}

/**
 * Move a policy through its lifecycle, enforcing human approval gates:
 * draft -> in_review -> approved -> active -> retired (in_review/approved -> draft for changes).
 * Returns a validated copy; throws on illegal transitions.
 */
export function transitionStatus(
  policy: Policy,
  toStatus: string,
  actor: Partial<Approver> | null,
  note = "",
  opts?: ClockOptions,
): Policy {
  const frm = String(policy["status"]);
  if (!(STATUS_TRANSITIONS[frm] ?? []).includes(toStatus)) {
    throw new Error(`illegal status transition ${frm} -> ${toStatus}`);
  }
  const name = actor?.name;
  if (!name) throw new Error("actor name is required");
  let p = deepClone(policy);
  const appr = p["approval"] as Dict;
  if (toStatus === "approved") {
    if (!approvalsComplete(p)) {
      throw new PolicyPermissionError(
        "cannot approve: approvals from all required roles are not yet recorded",
      );
    }
    appr["approved_at"] = now(opts);
  }
  if (toStatus === "active") {
    if (!(appr["required_approver_roles"] as string[]).includes(actor?.role ?? "")) {
      throw new PolicyPermissionError(
        "activation must be performed by a holder of a required approver role",
      );
    }
  }
  if (toStatus === "draft") {
    appr["approved_by"] = [];
    appr["approved_at"] = null;
  }
  p["status"] = toStatus;
  const changeType =
    ({ approved: "approved", active: "activated", retired: "retired" } as Record<string, string>)[
      toStatus
    ] ?? "status_change";
  p = recordChange(p, name, note || `status ${frm} -> ${toStatus}`, changeType, null, opts);
  const errors = validatePolicy(p);
  if (errors.length) {
    throw new Error("transition would produce an invalid policy: " + errors.join("; "));
  }
  return p;
}

function cmpKey(a: unknown, b: unknown): number {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = cmpKey(a[i], b[i]);
      if (c) return c;
    }
    return a.length - b.length;
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

/** The highest semantic version (first one wins on ties, like Python's max()). */
export function latest(versions: readonly Policy[]): Policy {
  if (!versions.length) throw new Error("latest() arg is an empty sequence");
  let best = versions[0]!;
  let bestKey = semverKey(String(best["version"]));
  for (const v of versions.slice(1)) {
    const k = semverKey(String(v["version"]));
    if (cmpKey(k, bestKey) > 0) {
      best = v;
      bestKey = k;
    }
  }
  return best;
}
