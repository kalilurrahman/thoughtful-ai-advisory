-- Billing through Dodo Payments (merchant of record).
-- billing_customers links a VERITRAIL user to the Dodo customer created for them before their
-- first checkout; only server functions (service role) write it, so a user cannot claim someone
-- else's customer. billing_subscriptions mirrors Dodo subscriptions from signed webhooks, keyed
-- by Dodo's ids; users read the rows of their own customer. billing_webhook_events makes webhook
-- delivery idempotent (Dodo retries) and keeps a minimal receipt log.
CREATE TABLE public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE CHECK (char_length(customer_id) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_customers TO authenticated;
GRANT ALL ON public.billing_customers TO service_role;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_customers_select_own ON public.billing_customers
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TABLE public.billing_subscriptions (
  subscription_id text PRIMARY KEY CHECK (char_length(subscription_id) BETWEEN 1 AND 100),
  customer_id text NOT NULL CHECK (char_length(customer_id) BETWEEN 1 AND 100),
  product_id text NOT NULL CHECK (char_length(product_id) BETWEEN 1 AND 100),
  plan text CHECK (plan IN ('team', 'business', 'enterprise')),
  status text NOT NULL CHECK (status IN ('pending', 'active', 'on_hold', 'paused', 'cancelled', 'failed', 'expired', 'past_due')),
  next_billing_date timestamptz,
  cancel_at_next_billing_date boolean NOT NULL DEFAULT false,
  event_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_subscriptions_customer_idx ON public.billing_subscriptions (customer_id);
GRANT SELECT ON public.billing_subscriptions TO authenticated;
GRANT ALL ON public.billing_subscriptions TO service_role;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_subscriptions_select_own ON public.billing_subscriptions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.billing_customers c
    WHERE c.customer_id = billing_subscriptions.customer_id AND c.user_id = (SELECT auth.uid())
  ));

CREATE TABLE public.billing_webhook_events (
  webhook_id text PRIMARY KEY CHECK (char_length(webhook_id) BETWEEN 1 AND 200),
  type text NOT NULL CHECK (char_length(type) <= 80),
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.billing_webhook_events TO service_role;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

-- Applies one verified webhook: returns 'duplicate' for a webhook id already applied, otherwise
-- records it and, for subscription events, upserts the subscription unless a newer event for it
-- has already been applied (Dodo does not guarantee delivery order).
CREATE OR REPLACE FUNCTION public.record_billing_webhook(p_webhook_id text, p_type text, p_subscription jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.billing_webhook_events (webhook_id, type)
  VALUES (p_webhook_id, p_type)
  ON CONFLICT (webhook_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN 'duplicate';
  END IF;
  IF p_subscription IS NULL THEN
    RETURN 'ignored';
  END IF;
  INSERT INTO public.billing_subscriptions AS s (
    subscription_id, customer_id, product_id, plan, status,
    next_billing_date, cancel_at_next_billing_date, event_at, updated_at
  ) VALUES (
    p_subscription->>'subscription_id',
    p_subscription->>'customer_id',
    p_subscription->>'product_id',
    p_subscription->>'plan',
    p_subscription->>'status',
    (p_subscription->>'next_billing_date')::timestamptz,
    COALESCE((p_subscription->>'cancel_at_next_billing_date')::boolean, false),
    (p_subscription->>'event_at')::timestamptz,
    now()
  )
  ON CONFLICT (subscription_id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id,
    product_id = EXCLUDED.product_id,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    next_billing_date = EXCLUDED.next_billing_date,
    cancel_at_next_billing_date = EXCLUDED.cancel_at_next_billing_date,
    event_at = EXCLUDED.event_at,
    updated_at = now()
  WHERE s.event_at <= EXCLUDED.event_at;
  RETURN CASE WHEN FOUND THEN 'applied' ELSE 'stale' END;
END;
$$;
REVOKE ALL ON FUNCTION public.record_billing_webhook(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_billing_webhook(text, text, jsonb) TO service_role;
