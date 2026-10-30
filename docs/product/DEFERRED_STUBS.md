# Deferred stubs — connection guide

Items in this file are partially implemented and marked with a `TODO` tag so
they can be found with `grep -r "TODO: stub-"`. Each entry explains what has
been done, what is still missing, and the minimal connection work required.

---

## stub-sod — Server-side separation of duties for corrective actions

**Status:** soft advisory check implemented in `actions-model.ts`  
**Files:** `src/features/governance/actions-model.ts`

### What is done
`transitionCorrectiveAction` compares the verifier's name string against the
opener's name string (`history[0].actor`). If they match, closure is rejected
with a clear error message. This prevents accidental self-verification when
operators enter their name consistently.

### What is missing
The check is name-string only. A determined user can bypass it by using a
different capitalisation or spelling. A proper identity check requires:

1. **User identity in history entries** — store the Supabase `user.id` (not
   just the display name) in each `history` entry when a workspace member
   performs a transition. Migration needed to add `actorId: uuid` to the
   history item type in `actions-schema.ts`.

2. **Server-function enforcement** — move the `"Closed"` transition through a
   server function (`transit_corrective_action`) that reads `context.user.id`
   from the session and compares it to the `actorId` of `history[0]`.

3. **UI display** — show the acting user's own identity so they cannot
   accidentally use a different name.

### Connection steps
- Add `actorId?: string` to `correctiveActionSchema` history item (nullable for
  back-compat).
- Populate it from `userId` (available in `GovernanceProvider`) when dispatching
  `transition-corrective-action`.
- Add the server-function ID comparison as the authoritative check; keep the
  name-string check as a fallback for workspaces without sign-in.

---

## stub-playbook-ui — Full UI tests for PlaybookScreen

**Status:** ✅ Implemented — rendering tests complete  
**Files:** `src/test/playbook.test.ts`, `src/features/governance/screens-playbook.tsx`

### What is done
`playbook.test.ts` verifies (3 data-layer + 5 rendering tests):
- At least one chapter exists
- Every chapter has unique ids, non-empty title/part/standfirst
- Every chapter has at least one outcome and one section with a non-empty heading
- Part filter shows only chapters matching the selected part
- Search input filters chapters by title/content
- "Mark chapter reviewed" persists chapter id in `localStorage` under `veritrail-playbook-progress-v1`
- Chapter notes persist in `localStorage` under the same key
- Deep-link hash opens the matching chapter (via `useLocation` mock)

### How it was connected
`@tanstack/react-router` is mocked at the module level using `vi.mock` so `useLocation`
returns a controllable `{ hash, pathname }` without a full router setup.
`localStorage` is cleared in `beforeEach` and read directly in assertions.

---

## stub-templates-ui — Full UI tests for TemplatesScreen

**Status:** ✅ Implemented — rendering tests complete  
**Files:** `src/test/templates.test.ts`, `src/features/governance/screens-templates.tsx`

### What is done
`templates.test.ts` verifies (3 data-layer + 5 rendering tests):
- At least one template exists
- Every template has a unique id, non-empty title/description, and a known category
- Every template has at least one section with a non-empty heading
- Category filter button hides templates outside the selected category
- Search input filters templates by title/description
- Context fields (organisation, owner, system) interpolate into the generated Markdown
- "Copy draft" calls `navigator.clipboard.writeText` with the full Markdown string
- "Download Markdown" calls `URL.createObjectURL` and triggers an anchor click

### How it was connected
`navigator.clipboard.writeText` mocked with `vi.stubGlobal`.
`URL.createObjectURL` / `URL.revokeObjectURL` spied on via `vi.spyOn`.
`HTMLAnchorElement.prototype.click` spied on to confirm the download anchor fires.
No router wrapper needed — this screen does not use `useLocation`.

---

## stub-gate-per-system — Per-system guardrail gate scores

**Status:** gap documented; no stub code added  
**Files:** `src/features/governance/model.ts` (`gateStatus`), `src/features/governance/screens-operations.tsx`

### What is done
`gateStatus` computes one workspace-wide gate score from the aggregate pillar
scores and the workspace tier. This is meaningful and correct for a single-system
workspace.

### What is missing
For multi-system workspaces the gate should be computed per-registered-system,
using that system's own tier (already stored on the `System` record) and the
subset of controls that apply to it. This requires:

1. A per-system answers slice (workspace answers are currently a flat map keyed
   by control id, shared across all systems).
2. A `systemGateStatus(systemAnswers, systemTier)` helper alongside the existing
   `gateStatus`.
3. A UI column on the inventory card showing each system's gate state.

### Connection steps
This is an architecture change. Discuss with product whether per-system answers
is the right model or whether a lighter approach (e.g. tagging answers by system)
is preferable before implementing.

---

## stub-smtp — Email notifications (invitations, submission confirmations)

**Status:** invite flow UI done; delivery deferred  
**Files:** `src/features/governance/screens-operations.tsx` (team section)

### What is missing
No transactional email provider is configured. The Cloudflare Workers runtime
does not expose SMTP. Options:
- **Resend** — `npm i resend`; set `RESEND_API_KEY` in the environment; call
  `resend.emails.send(...)` from the invite server function.
- **Postmark** or **SendGrid** — similar pattern.

Once a provider is chosen, wire the `sendInviteEmail(email, inviteUrl)` call
into the `create_organization_invite` server function.

---

## stub-dodo — Dodo Payments billing integration

**Status:** plan limits enforced in UI; payment processing deferred  
**Files:** `src/features/billing/`, `docs/veritrail/BILLING_SETUP.md`

### What is missing
- Dodo Payments account with products matching `src/data/plans.ts`
- `DODO_WEBHOOK_SECRET` and `DODO_*` env vars in the deployment environment
- Webhook handler to update `organization_plan` on checkout completion

See `docs/veritrail/BILLING_SETUP.md` for the full setup checklist.
