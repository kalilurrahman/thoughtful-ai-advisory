import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CircleNotch, CreditCard } from "@phosphor-icons/react";
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
  ) {
    setBusy(key);
    setMessage(null);
    try {
      const res = await run();
      if (res.ok && res.url) {
        window.location.assign(res.url);
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
                  disabled={busy !== null || isCurrent || Boolean(paid) || !available}
                  onClick={() =>
                    void redirect(p.id, () =>
                      checkout({ data: { plan: p.id as "team" | "business", interval } }),
                    )
                  }
                >
                  {busy === p.id ? <CircleNotch className="spin" /> : null}
                  {isCurrent
                    ? "Current plan"
                    : paid
                      ? "Change in Manage billing"
                      : available === false
                        ? `${interval === "monthly" ? "Monthly" : "Annual"} not available`
                        : `Choose ${p.name}`}
                  {!isCurrent && !paid && available ? <ArrowRight /> : null}
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
    </>
  );
}
