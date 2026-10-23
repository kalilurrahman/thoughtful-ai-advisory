---
title: "Pilot data-access & privacy safeguards"
applies_to: [Pilot A, Pilot B, Governance Baseline]
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead with VERITRAIL Security & Privacy Lead
status: template — to be agreed with each design partner before any data access
---

# Pilot data-access & privacy safeguards

These safeguards apply to every VERITRAIL pilot and Governance Baseline. They are signed off by the design partner's
security and privacy leads in Week 1, **before** any access is granted. They mirror the controls VERITRAIL asks customers
to operate: privacy assessment and minimisation (IS-03), redaction (IS-04), least privilege (IS-11), evidence
retention (SE-02) and tamper-evident logging (SE-08).

## 1. Default posture: metadata-only ingestion

| Data category | Default | Allowed only with written approval | Never |
|---|---|---|---|
| AI system metadata (name, purpose, owner role, tier factors, vendor, model family, tool names) | **In scope** | — | — |
| Governance documents (policies, RACI, approval records, test summaries) | In scope, redacted copies preferred | Unredacted copies, view-only | — |
| Configuration excerpts (runtime policy, tool permission manifests, prompt templates without user data) | Not by default | Redacted excerpts | Secrets, keys, credentials |
| Logs and decision samples | Not by default | Small redacted samples, viewed in partner environment | Bulk log export |
| Personal data, special-category data, customer data, production prompts/responses | **Out of scope** | Only if essential, minimised, under DPA, in partner environment | Transfer to any external LLM |

**Rule:** no production data — personal, confidential or customer content — is sent to any external LLM by VERITRAIL,
under any circumstance. Agent features used during the pilot run on metadata and governance documents only, and all
text passes through `veritrail_common.redaction.redact()` before any external model call or log write.

## 2. Legal and contractual prerequisites

| # | Item | Owner | Gate |
|---|---|---|---|
| 1 | Mutual NDA executed | VERITRAIL commercial lead / partner legal | Before discovery calls beyond public information |
| 2 | Pilot agreement (scope, no-fee or fee terms, IP, feedback licence, publication restrictions) | VERITRAIL commercial lead | Before Week 1 |
| 3 | Data processing agreement (DPA) where any personal data could be processed, including sub-processor list and transfer mechanism | VERITRAIL privacy lead / partner DPO | Before any personal data access |
| 4 | Security questionnaire answered (hosting, encryption, access control, logging, incident notice) | VERITRAIL security lead | Before Week 1 |
| 5 | Written approval for any exception to §1 defaults, naming data, purpose, location and expiry | Partner security + privacy leads | Per exception |
| 6 | Publication restriction: no use of partner name, logo, quotes or metrics without written approval (see case-study template) | VERITRAIL commercial lead | Always |

## 3. Access roles (least privilege)

| Role | Who | Access | Cannot |
|---|---|---|---|
| Partner pilot sponsor | Partner executive | Pilot workspace (read), reports | — |
| Partner pilot lead | Partner governance lead | Pilot workspace (read/write), approve exceptions with security/privacy | Approve own data-access exceptions alone |
| Partner system owners | Business/technical owners | Their own system records | See other units' records unless agreed |
| VERITRAIL delivery lead | Named individual | Pilot workspace (read/write), evidence index | Download unredacted evidence; access partner production |
| VERITRAIL analyst | Named individuals (max 3) | Pilot workspace (read/write) | Export evidence; send external communications |
| VERITRAIL Agent (tool) | Software | Read tools on pilot workspace; write tools create **drafts** only | Change risk tiers, approve exceptions, export evidence, send communications (all require human approval) |

Access is reviewed at the end of Weeks 2 and 4 and revoked at pilot close (IS-11).

## 4. Redaction

- Partner-supplied documents are redacted at source where possible (names → roles, identifiers removed).
- VERITRAIL applies automated redaction (`veritrail_common.redaction`) to all text before external model calls and log writes;
  redaction coverage is spot-checked by the VERITRAIL delivery lead on a sample each week and recorded.
- Evidence items are referenced by ID in reports; content is quoted only where necessary and redacted.

## 5. Hosting, logging and evidence handling

- Pilot workspace hosted in a single region agreed with the partner; encryption in transit and at rest.
- All material actions (record edits, tier proposals, approvals, exports) are appended to the hash-chained VERITRAIL audit
  log with trace IDs (SE-08). Logs record metadata only; raw prompts are not logged.
- Evidence index records: evidence ID, description, owner, location (partner system by default), reviewer, review date,
  evidence label (Verified / User-asserted / Inferred / Missing evidence / Critical gap).

## 6. Retention and deletion

| Item | Retention | Deletion |
|---|---|---|
| Pilot workspace data (metadata, drafts) | Pilot duration + 30 days (for readout follow-up) unless the partner converts to a contract | Deleted on day 30 after close, or earlier on request; deletion confirmed in writing |
| Partner documents | Not retained by VERITRAIL beyond the pilot; prefer viewing in partner systems | Deleted with workspace |
| Audit log | Retained for pilot duration + 30 days, exported to the partner on request | Deleted with workspace after export |
| Feedback survey responses | Retained for product improvement, pseudonymised | On request |
| Aggregated, anonymised learnings (e.g. "assessment took N minutes") | Retained | Only with partner consent if identifiable |

## 7. Incident handling

Any suspected data incident involving pilot data is reported to the partner's named security contact within the
timeframe set in the pilot agreement (default target: 24 hours from detection), followed by a written report. The
pilot pauses until both sides agree to resume (SE-04).

## 8. Week-1 sign-off

| Safeguard | Agreed (Y/N) | Partner signatory (role) | Date |
|---|---|---|---|
| Metadata-only default (§1) | | | |
| Legal prerequisites complete (§2) | | | |
| Access roles and named users (§3) | | | |
| Redaction approach (§4) | | | |
| Hosting region and logging (§5) | | | |
| Retention and deletion (§6) | | | |
| Incident contact and timeframe (§7) | | | |
