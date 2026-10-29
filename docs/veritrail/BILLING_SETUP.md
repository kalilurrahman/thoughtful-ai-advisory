# Billing setup — Dodo Payments

VERITRAIL sells the self-serve **Team** and **Business** plans through
[Dodo Payments](https://dodopayments.com), which acts as the merchant of record: it shows the price
with tax at checkout, collects payment (cards, UPI and other local methods), files sales tax and
VAT, issues the invoice and pays out to the Indian company's bank account. VERITRAIL never sees
card details. Free needs no payment; Enterprise and the Governance Baseline are invoiced directly.

## How it fits together

| Piece | Where |
|---|---|
| Plan catalogue (names, what is included, limits) | `src/data/plans.ts` |
| Plan rules: product → plan, which statuses keep a plan | `src/features/billing/entitlements.ts` |
| Checkout, billing status and customer portal (server functions) | `src/features/billing/billing.functions.ts` |
| Dodo REST client | `src/features/billing/dodo.server.ts` |
| Webhook endpoint `POST /api/billing/dodo-webhook` | `src/routes/api.billing.dodo-webhook.ts`, `src/features/billing/webhook.ts` |
| Signature check (Standard Webhooks) | `src/features/billing/standard-webhooks.ts` |
| Tables and the idempotent `record_billing_webhook` function | `drizzle/migrations/0011_veritrail_billing.sql` |
| Plans page | `src/features/billing/plans-screen.tsx` (`/plans`) |

Flow: a signed-in user picks a plan → the server creates (once) a Dodo customer linked to the
user in `billing_customers` → Dodo hosts the checkout → Dodo sends `subscription.*` webhooks → the
endpoint verifies the signature and stores the subscription → every server function that needs a
limit reads the plan with `planForCaller`. The plan changes only from a signed webhook, never from
the browser returning from checkout.

## One-time setup

1. **Apply the migrations** `0010_veritrail_ai_usage_quota.sql` and `0011_veritrail_billing.sql`
   in Lovable Cloud (`0009` is now safe to apply in any order; see `AGENTS.md`).
2. **Create the products** in the Dodo dashboard, starting in **test mode**: subscription products
   for Team monthly, Team annual, Business annual (and Business monthly if offered). Set the prices
   there once the commercial lead approves them — the site shows no figures. Optionally create an
   Enterprise product for negotiated subscriptions.
3. **Add the webhook** in the Dodo dashboard: URL `https://<your domain>/api/billing/dodo-webhook`,
   subscribed to all `subscription.*` events. Copy its signing secret.
4. **Set the secrets** in Lovable Cloud (server-side environment, never `VITE_`):

   | Name | Value |
   |---|---|
   | `DODO_PAYMENTS_API_KEY` | API key from the Dodo dashboard |
   | `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` until launch, then `live_mode` |
   | `DODO_PAYMENTS_WEBHOOK_KEY` | the webhook signing secret (`whsec_…`) |
   | `DODO_PRODUCT_TEAM_MONTHLY`, `DODO_PRODUCT_TEAM_ANNUAL` | product ids (`pdt_…`) |
   | `DODO_PRODUCT_BUSINESS_ANNUAL`, `DODO_PRODUCT_BUSINESS_MONTHLY` | product ids; leave unset to hide that option |
   | `DODO_PRODUCT_ENTERPRISE` | optional, for Enterprise subscriptions created in the dashboard |

5. **Test end to end in test mode**: sign in, open `/plans`, choose Team, pay with a Dodo test
   card, return to `/plans` and check the plan line updates within a minute; open *Manage billing*
   and cancel; check the plan line says it will not renew.
6. **Go live**: switch the API key, webhook secret and product ids to live-mode values and set
   `DODO_PAYMENTS_ENVIRONMENT=live_mode`.

## Rules worth knowing

- A subscription keeps its plan while `active` or `past_due` (Dodo is retrying payment); `on_hold`,
  `paused`, `cancelled`, `expired`, `failed` and `pending` mean the Free plan.
- Webhooks are applied once per `webhook-id`, and an older event never overwrites a newer one.
  Unsigned or stale (over five minutes) requests get `401` and change nothing; a storage failure
  returns `500` so Dodo retries.
- A user on a paid plan changes or cancels it in the Dodo customer portal (*Manage billing*);
  checkout refuses a second subscription.
- If billing cannot be read, the server treats the caller as Free — a fault never grants a paid
  plan.
