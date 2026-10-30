import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CircleNotch, CreditCard } from "@phosphor-icons/react";
import { PlansArt } from "@/features/site/illustrations-tools";
import { Button } from "@/components/ui/button";
import { PLANS, type Plan } from "@/data/plans";
import { Kicker } from "@/features/governance/screens-core";
import { useGovernance } from "@/features/governance/store";
import {
  getBillingStatus,
  openBillingPortal,
  startCheckout,
  type BillingStatus,
} from "./billing.functions";
import type { BillingInterval } from "./entitlements";
import { describeBilling } from "./describe";

const BASELINE = { _splat: "contact/book-governance-baseline/" };

export function PlansScreen() {
  const { userId } = useGovernance();
  const fetchStatus = useServerFn(getBillingStatus);
  const checkout = useServerFn(startCheckout);
  const portal = useServerFn(openBillingPortal);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [interval, setBillingInterval] = useState<BillingInterval>("annual");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<{
    plan: Plan;
    interval: BillingInterval;
  } | null>(null);
  const returned =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("checkout") === "returned";

  const refresh = useCallback(async () => {
    if (!userId) return setStatus(null);
    try {
      setStatus(await fetchStatus());
    } catch {
      setStatus(null);
    }
  }, [userId, fetchStatus]);

  useEffect(() => {
    void refresh();
    if (!returned || !userId) return;
    // The plan changes when Dodo's webhook arrives, usually within seconds of payment.
    const timer = window.setInterval(() => void refresh(), 4000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 60000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [refresh, returned, userId]);

  async function redirect(
    key: string,
    run: () => Promise<{ ok: boolean; url?: string; error?: string }>,
    previewPlan?: Plan,
  ) {
    setBusy(key);
    setMessage(null);
    try {
      const res = await run();
      if (res.ok && res.url) {
        window.location.assign(res.url);
        return;
      }
      // Billing not yet configured — show the checkout preview stub instead of an error.
      if (previewPlan && res.error?.includes("not configured")) {
        setCheckoutPreview({ plan: previewPlan, interval });
        setBusy(null);
        return;
      }
      setMessage(res.error ?? "Something went wrong, so nothing was charged.");
    } catch {
      setMessage("We could not reach the billing service, so nothing was charged.");
    }
    setBusy(null);
  }

  const paid = status && status.plan !== "free";

  function action(p: Plan) {
    if (p.id === "free")
      return (
        <Link to="/start">
          Start free
          <ArrowRight />
        </Link>
      );
    if (!p.selfServe)
      return (
        <Link to="/$" params={BASELINE}>
          Talk to us
          <ArrowRight />
        </Link>
      );
    if (!userId)
      return (
        <Link to="/auth">
          Sign in to choose {p.name}
          <ArrowRight />
        </Link>
      );
    return null;
  }

  return (
    <>
      <div className="plans-art" aria-hidden="true">
        <PlansArt />
      </div>
      <p className="muted">
        Start free, upgrade when your team needs more systems and seats. Approvers and viewers never
        need a paid seat.
      </p>

      {userId && status && (
        <section className="billing-status" aria-live="polite">
          <CreditCard weight="duotone" aria-hidden />
          <div>
            <strong>{describeBilling(status)}</strong>
            {returned && !paid && (
              <p className="muted">
                Thanks. If you completed payment, your plan updates here as soon as Dodo Payments
                confirms it, usually within a minute.
              </p>
            )}
          </div>
          {status.canManage && (
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => void redirect("portal", () => portal())}
            >
              {busy === "portal" ? <CircleNotch className="spin" /> : null}
              Manage billing
            </Button>
          )}
        </section>
      )}

      {userId && (
        <div className="billing-interval" role="radiogroup" aria-label="Billing interval">
          {(["monthly", "annual"] as const).map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={interval === i}
              className={interval === i ? "active" : ""}
              onClick={() => setBillingInterval(i)}
            >
              {i === "monthly" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
      )}

      {message && (
        <p className="billing-error" role="alert">
          {message}
        </p>
      )}

      <div className="plans-grid">
        {PLANS.map((p) => {
          const link = action(p);
          const isCurrent = status?.plan === p.id;
          const available =
            p.id === "team" || p.id === "business" ? status?.checkout[p.id][interval] : false;
          return (
            <article
              className={
                "plan-card " +
                (p.id === "team" ? "success" : p.id === "enterprise" ? "danger" : "neutral")
              }
              key={p.id}
            >
              <Kicker>{isCurrent ? "Your plan" : p.buyer}</Kicker>
              <h2>{p.name}</h2>
              <p>{p.summary}</p>
              <ul className="plan-includes">
                {p.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <strong className="price-line">{p.priceLabel}</strong>
              {link ? (
                <Button
                  asChild
                  variant={p.id === "team" ? "default" : "outline"}
                  className="full-button"
                >
                  {link}
                </Button>
              ) : (
                <Button
                  variant={p.id === "team" ? "default" : "outline"}
                  className="full-button"
                  disabled={busy !== null || isCurrent || Boolean(paid)}
                  onClick={() =>
                    void redirect(
                      p.id,
                      () => checkout({ data: { plan: p.id as "team" | "business", interval } }),
                      p,
                    )
                  }
                >
                  {busy === p.id ? <CircleNotch className="spin" /> : null}
                  {isCurrent
                    ? "Current plan"
                    : paid
                      ? "Change in Manage billing"
                      : `Choose ${p.name}`}
                  {!isCurrent && !paid ? <ArrowRight /> : null}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      <section>
        <h2>Governance Baseline</h2>
        <p className="muted">
          A fixed-scope 4–6 week engagement: inventory, evidence-backed maturity baseline, gap
          register and roadmap. Its fee is credited to a first-year subscription.
        </p>
        <Button variant="link" asChild>
          <Link to="/$" params={BASELINE}>
            Book a Governance Baseline
            <ArrowRight />
          </Link>
        </Button>
      </section>
      <p className="footnote">
        Payments are processed by Dodo Payments, our merchant of record, which shows the price with
        applicable taxes at checkout and issues the invoice. VERITRAIL supports readiness; it does
        not certify compliance.
      </p>

      {checkoutPreview && (
        <div className="checkout-preview-stub" role="dialog" aria-modal="true" aria-label="Checkout preview">
          <div className="checkout-preview-card">
            <h2>{checkoutPreview.plan.name} — Checkout Preview</h2>
            <p className="stub-badge-inline">
              <span className="chip stub-badge">Billing not yet connected (stub-dodo)</span>
            </p>
            <p>{checkoutPreview.plan.summary}</p>
            <ul className="plan-includes">
              {checkoutPreview.plan.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              <strong>Billing interval:</strong>{" "}
              {checkoutPreview.interval === "annual" ? "Annual" : "Monthly"}
            </p>
            <p>
              <strong>Price:</strong> {checkoutPreview.plan.priceLabel}
            </p>
            <p className="stub-notice">
              <strong>Not connected (stub-dodo):</strong> Dodo Payments is not yet configured for
              this environment. To enable checkout, set the{" "}
              <code>DODO_PRODUCT_*</code> and <code>DODO_WEBHOOK_SECRET</code> environment
              variables. See <code>docs/veritrail/BILLING_SETUP.md</code> for the full setup
              checklist. No payment has been taken.
            </p>
            <Button onClick={() => setCheckoutPreview(null)}>Close preview</Button>
          </div>
        </div>
      )}
    </>
  );
}
