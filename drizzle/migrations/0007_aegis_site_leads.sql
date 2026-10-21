CREATE TABLE public.site_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form text NOT NULL CHECK (form IN ('baseline','demo','contact','newsletter','blueprint','design_partner','waitlist','assessment')),
  email text NOT NULL CHECK (char_length(email) <= 254),
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 160),
  company text NOT NULL DEFAULT '' CHECK (char_length(company) <= 160),
  role text NOT NULL DEFAULT '' CHECK (char_length(role) <= 160),
  industry text NOT NULL DEFAULT '' CHECK (char_length(industry) <= 60),
  ai_systems text NOT NULL DEFAULT '' CHECK (char_length(ai_systems) <= 20),
  tool text NOT NULL DEFAULT '' CHECK (char_length(tool) <= 80),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 4000),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent boolean NOT NULL CHECK (consent),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_leads_created_at_idx ON public.site_leads (created_at DESC);
GRANT ALL ON public.site_leads TO service_role;
ALTER TABLE public.site_leads ENABLE ROW LEVEL SECURITY;
