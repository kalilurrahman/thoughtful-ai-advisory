CREATE TABLE IF NOT EXISTS public.org_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author text NOT NULL CHECK (char_length(author) BETWEEN 1 AND 120),
  topic text NOT NULL DEFAULT 'General' CHECK (char_length(topic) BETWEEN 1 AND 60),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS org_messages_org_created ON public.org_messages (organization_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.org_messages TO authenticated;
GRANT ALL ON public.org_messages TO service_role;
ALTER TABLE public.org_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read discussions" ON public.org_messages FOR SELECT TO authenticated
  USING (public.can_read_org(organization_id));
CREATE POLICY "Members post as themselves" ON public.org_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_read_org(organization_id));
CREATE POLICY "Authors delete own messages" ON public.org_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_messages;