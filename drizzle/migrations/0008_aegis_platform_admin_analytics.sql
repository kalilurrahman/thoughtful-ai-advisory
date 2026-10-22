-- AEGIS platform admin console + cookieless website analytics.
-- site_admins: who may use the admin console (leads, forms, funnel). Granted by an operator:
--   insert into public.site_admins (user_id) values ('<auth user id>');
CREATE TABLE public.site_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_admins TO authenticated;
GRANT ALL ON public.site_admins TO service_role;
ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_admins_select_own ON public.site_admins
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- site_events: allow-listed, cookieless analytics events (no IP, user agent or identifiers).
-- Written only by the trackEvent server function with the service role; no client policies.
CREATE TABLE public.site_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (name IN ('page_view','cta_click','assessment_start','assessment_step','assessment_preliminary','assessment_gate_view','assessment_lead_submitted','assessment_report_download','form_submit','tool_use','outbound_click')),
  props jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(props) = 'object' AND octet_length(props::text) <= 2048),
  path text NOT NULL DEFAULT '' CHECK (char_length(path) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_events_name_created_at_idx ON public.site_events (name, created_at);
GRANT ALL ON public.site_events TO service_role;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
