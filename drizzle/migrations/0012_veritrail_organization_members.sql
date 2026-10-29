-- Team workspaces: organization members with roles, and single-use invitations.
--
-- Roles: owner (one per organization, its creator), admin (manages members), operator (edits
-- the workspace), approver and viewer (read the workspace). Approvers are read-only for now
-- because the workspace is saved as one snapshot; approval workflows come later.
--
-- Every workspace table moves from owner-only policies to membership: members read, and
-- owner, admin and operator write. Membership is changed only through the SECURITY DEFINER
-- functions below, which enforce the role rules; there are no direct write policies.

CREATE TABLE public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'approver', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE UNIQUE INDEX organization_members_one_owner ON public.organization_members (organization_id) WHERE role = 'owner';
CREATE INDEX organization_members_user_idx ON public.organization_members (user_id);
GRANT SELECT ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.organizations
ON CONFLICT DO NOTHING;

-- The caller's role in an organization, or NULL. SECURITY DEFINER so policies can use it
-- without recursing through organization_members' own policy.
CREATE OR REPLACE FUNCTION public.org_role(p_org uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = p_org AND user_id = (SELECT auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.can_read_org(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.org_role(p_org) IS NOT NULL;
$$;
CREATE OR REPLACE FUNCTION public.can_edit_org(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.org_role(p_org) IN ('owner', 'admin', 'operator'), false);
$$;
REVOKE ALL ON FUNCTION public.org_role(uuid), public.can_read_org(uuid), public.can_edit_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_role(uuid), public.can_read_org(uuid), public.can_edit_org(uuid) TO authenticated, service_role;

CREATE POLICY organization_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.can_read_org(organization_id));

-- The creator of an organization becomes its owner.
CREATE OR REPLACE FUNCTION public.add_organization_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.add_organization_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER organization_owner_membership AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.add_organization_owner();

-- organizations: members read; anyone signed in creates one they own; editors rename; only the
-- owner deletes. Only the name may be updated, so ownership cannot be reassigned by an update.
DROP POLICY IF EXISTS own_org ON public.organizations;
CREATE POLICY organizations_select ON public.organizations FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR public.can_read_org(id));
CREATE POLICY organizations_insert ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY organizations_update ON public.organizations FOR UPDATE TO authenticated
  USING (public.can_edit_org(id)) WITH CHECK (public.can_edit_org(id));
CREATE POLICY organizations_delete ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));
REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (name) ON public.organizations TO authenticated;

-- Workspace tables: members read, editors write.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('assessments', 'own_assessment'),
    ('ai_systems', 'own_systems'),
    ('guardrail_configs', 'own_guardrails'),
    ('roadmap_items', 'own_roadmap'),
    ('sources', 'own_sources'),
    ('ai_incidents', 'own_ai_incidents'),
    ('ai_governance_decisions', 'own_ai_governance_decisions'),
    ('ai_change_reviews', 'own_ai_change_reviews'),
    ('ai_monitoring_plans', 'own_ai_monitoring_plans'),
    ('ai_corrective_actions', 'own_corrective_actions')
  ) AS v (tbl, old_policy) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.old_policy, t.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_read_org(organization_id))', t.tbl || '_member_select', t.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id))', t.tbl || '_editor_insert', t.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))', t.tbl || '_editor_update', t.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id))', t.tbl || '_editor_delete', t.tbl);
  END LOOP;
END;
$$;

-- The workspace save function: editors (not only the owner) may save an existing workspace.
-- Migration 0009 renames the function, so this replaces whichever name exists.
DO $$
DECLARE
  fn text;
  body text := $body$
DECLARE result uuid;
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF p_org IS NULL OR p_org='00000000-0000-0000-0000-000000000000'::uuid THEN INSERT INTO public.organizations(name) VALUES(p_name) RETURNING id INTO result;
ELSE SELECT id INTO result FROM public.organizations WHERE id=p_org AND public.can_edit_org(id); IF result IS NULL THEN RAISE EXCEPTION 'Workspace unavailable'; END IF; UPDATE public.organizations SET name=p_name WHERE id=result; END IF;
INSERT INTO public.assessments(organization_id,answers) VALUES(result,p_state->'answers') ON CONFLICT(organization_id) DO UPDATE SET answers=excluded.answers,updated_at=now();
INSERT INTO public.ai_systems(organization_id,systems) VALUES(result,p_state->'systems') ON CONFLICT(organization_id) DO UPDATE SET systems=excluded.systems;
INSERT INTO public.guardrail_configs(organization_id,tier,controls) VALUES(result,p_state->>'tier',p_state->'gr') ON CONFLICT(organization_id) DO UPDATE SET tier=excluded.tier,controls=excluded.controls;
INSERT INTO public.roadmap_items(organization_id,items) VALUES(result,p_state->'roadmap') ON CONFLICT(organization_id) DO UPDATE SET items=excluded.items;
INSERT INTO public.sources(organization_id,entries) VALUES(result,p_sources) ON CONFLICT(organization_id) DO UPDATE SET entries=excluded.entries;
INSERT INTO public.ai_incidents(organization_id,incidents) VALUES(result,COALESCE(p_state->'incidents','[]'::jsonb)) ON CONFLICT(organization_id) DO UPDATE SET incidents=excluded.incidents,updated_at=now();
INSERT INTO public.ai_governance_decisions(organization_id,decisions) VALUES(result,COALESCE(p_state->'decisions','[]'::jsonb)) ON CONFLICT(organization_id) DO UPDATE SET decisions=excluded.decisions,updated_at=now();
INSERT INTO public.ai_change_reviews(organization_id,reviews) VALUES(result,COALESCE(p_state->'changeReviews','[]'::jsonb)) ON CONFLICT(organization_id) DO UPDATE SET reviews=excluded.reviews,updated_at=now();
INSERT INTO public.ai_monitoring_plans(organization_id,plans) VALUES(result,COALESCE(p_state->'monitoringPlans','[]'::jsonb)) ON CONFLICT(organization_id) DO UPDATE SET plans=excluded.plans,updated_at=now();
INSERT INTO public.ai_corrective_actions(organization_id,actions) VALUES(result,COALESCE(p_state->'correctiveActions','[]'::jsonb)) ON CONFLICT(organization_id) DO UPDATE SET actions=excluded.actions,updated_at=now();
RETURN result;
END;
$body$;
BEGIN
  FOREACH fn IN ARRAY ARRAY['save_aegis_workspace', 'save_veritrail_workspace'] LOOP
    IF to_regprocedure(format('public.%I(uuid,text,jsonb,jsonb)', fn)) IS NOT NULL THEN
      EXECUTE format(
        'CREATE OR REPLACE FUNCTION public.%I(p_org uuid, p_name text, p_state jsonb, p_sources jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS %L',
        fn, body);
    END IF;
  END LOOP;
END;
$$;

-- Invitations: a single-use link for one e-mail address and role. Only the SHA-256 hash of the
-- token is stored. Owners and admins see and revoke their organization's invitations.
CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
  role text NOT NULL CHECK (role IN ('admin', 'operator', 'approver', 'viewer')),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);
CREATE INDEX organization_invitations_org_idx ON public.organization_invitations (organization_id);
GRANT SELECT, INSERT, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_invitations_select ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.org_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY organization_invitations_insert ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.org_role(organization_id) IN ('owner', 'admin') AND invited_by = (SELECT auth.uid()) AND accepted_at IS NULL);
CREATE POLICY organization_invitations_delete ON public.organization_invitations FOR DELETE TO authenticated
  USING (public.org_role(organization_id) IN ('owner', 'admin'));

-- Accepts an invitation for the signed-in user, whose account e-mail must match it. Returns the
-- organization id. An existing member keeps their current role.
CREATE OR REPLACE FUNCTION public.accept_org_invitation(p_token_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_inv public.organization_invitations%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user;
  SELECT * INTO v_inv FROM public.organization_invitations
  WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND OR v_inv.accepted_at IS NOT NULL OR v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation unavailable' USING ERRCODE = 'P0002';
  END IF;
  IF v_email IS DISTINCT FROM v_inv.email THEN
    RAISE EXCEPTION 'Invitation is for another e-mail address' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_inv.organization_id, v_user, v_inv.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  UPDATE public.organization_invitations SET accepted_at = now(), accepted_by = v_user
  WHERE id = v_inv.id;
  RETURN v_inv.organization_id;
END;
$$;

-- Changes a member's role. Owners and admins may; nobody changes the owner's role or makes a
-- second owner, and an admin cannot change another admin.
CREATE OR REPLACE FUNCTION public.set_org_member_role(p_org uuid, p_user uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller text := public.org_role(p_org);
  v_target text;
BEGIN
  IF p_role NOT IN ('admin', 'operator', 'approver', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role' USING ERRCODE = '22023';
  END IF;
  SELECT role INTO v_target FROM public.organization_members
  WHERE organization_id = p_org AND user_id = p_user FOR UPDATE;
  IF v_target IS NULL THEN RAISE EXCEPTION 'Not a member' USING ERRCODE = 'P0002'; END IF;
  IF v_caller IS NULL OR v_caller NOT IN ('owner', 'admin') OR v_target = 'owner'
     OR (v_caller = 'admin' AND v_target = 'admin' AND p_user <> auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  UPDATE public.organization_members SET role = p_role
  WHERE organization_id = p_org AND user_id = p_user;
END;
$$;

-- Removes a member. Owners and admins remove others (an admin cannot remove an admin); anyone
-- but the owner may leave. The owner is never removed.
CREATE OR REPLACE FUNCTION public.remove_org_member(p_org uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller text := public.org_role(p_org);
  v_target text;
BEGIN
  SELECT role INTO v_target FROM public.organization_members
  WHERE organization_id = p_org AND user_id = p_user FOR UPDATE;
  IF v_target IS NULL THEN RAISE EXCEPTION 'Not a member' USING ERRCODE = 'P0002'; END IF;
  IF v_target = 'owner' THEN RAISE EXCEPTION 'The owner cannot be removed' USING ERRCODE = '42501'; END IF;
  IF NOT (p_user = auth.uid()
          OR v_caller = 'owner'
          OR (v_caller = 'admin' AND v_target <> 'admin')) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.organization_members WHERE organization_id = p_org AND user_id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_org_invitation(text), public.set_org_member_role(uuid, uuid, text), public.remove_org_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_org_invitation(text), public.set_org_member_role(uuid, uuid, text), public.remove_org_member(uuid, uuid) TO authenticated;

-- Members of an organization with their display name and e-mail, for its members only.
CREATE OR REPLACE FUNCTION public.org_member_directory(p_org uuid)
RETURNS TABLE (user_id uuid, role text, display_name text, email text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, m.role, COALESCE(p.display_name, ''), COALESCE(u.email, ''), m.created_at
  FROM public.organization_members m
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = p_org AND public.can_read_org(p_org)
  ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'operator' THEN 2 WHEN 'approver' THEN 3 ELSE 4 END, m.created_at;
$$;
REVOKE ALL ON FUNCTION public.org_member_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_member_directory(uuid) TO authenticated;
