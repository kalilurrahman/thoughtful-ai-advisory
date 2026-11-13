-- The evidence trail: an append-only record of every score, evidence status, disposition and
-- sign-off in a workspace (docs/design/assurance/README.md §3.5 and §5). Members of the
-- organization read it; owners, admins and operators append to it; nobody updates or deletes a
-- row, not even the service role, so the record is tamper-evident. Until this migration is
-- applied the app keeps the trail in the browser tab and labels it a preview.

CREATE TABLE IF NOT EXISTS public.workspace_trail (
  id bigserial PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL DEFAULT auth.uid(),
  who text NOT NULL CHECK (char_length(who) BETWEEN 1 AND 120),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 400),
  ref text CHECK (ref IS NULL OR char_length(ref) <= 200),
  outcome text NOT NULL CHECK (outcome IN ('effective', 'partial', 'gap', 'untested', 'info', 'attested')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_trail_org_recorded
  ON public.workspace_trail (organization_id, recorded_at DESC, id DESC);

GRANT SELECT, INSERT ON public.workspace_trail TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.workspace_trail_id_seq TO authenticated;
GRANT SELECT, INSERT ON public.workspace_trail TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.workspace_trail_id_seq TO service_role;

ALTER TABLE public.workspace_trail ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_trail_member_select ON public.workspace_trail;
CREATE POLICY workspace_trail_member_select ON public.workspace_trail
  FOR SELECT TO authenticated USING (public.can_read_org(organization_id));
DROP POLICY IF EXISTS workspace_trail_editor_insert ON public.workspace_trail;
CREATE POLICY workspace_trail_editor_insert ON public.workspace_trail
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND actor_id = (SELECT auth.uid()));
-- No UPDATE or DELETE policy: the trail only grows.

-- Append-only for every role, including service_role, which bypasses row-level security.
CREATE OR REPLACE FUNCTION public.workspace_trail_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The evidence trail is append-only' USING ERRCODE = '42501';
END;
$$;
DROP TRIGGER IF EXISTS workspace_trail_append_only ON public.workspace_trail;
CREATE TRIGGER workspace_trail_append_only
  BEFORE UPDATE OR DELETE ON public.workspace_trail
  FOR EACH ROW EXECUTE FUNCTION public.workspace_trail_append_only();
