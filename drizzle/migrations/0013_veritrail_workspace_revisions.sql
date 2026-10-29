-- Optimistic concurrency for workspace saves, so autosave never overwrites a teammate's newer
-- save. Each organization carries a revision; save_workspace_checked saves only when the caller
-- still holds the latest revision and returns the new one, otherwise it raises a conflict
-- (SQLSTATE 40001) and changes nothing.

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;

-- Locks the organization row, checks the expected revision and bumps it. SECURITY DEFINER
-- because members may not update organizations.revision directly; it checks edit rights itself.
CREATE OR REPLACE FUNCTION public.claim_workspace_revision(p_org uuid, p_expected bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current bigint;
BEGIN
  IF NOT public.can_edit_org(p_org) THEN
    RAISE EXCEPTION 'Workspace unavailable';
  END IF;
  SELECT revision INTO v_current FROM public.organizations WHERE id = p_org FOR UPDATE;
  IF v_current IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'Workspace was saved by someone else' USING ERRCODE = '40001';
  END IF;
  UPDATE public.organizations SET revision = v_current + 1 WHERE id = p_org;
  RETURN v_current + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_workspace_revision(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_workspace_revision(uuid, bigint) TO authenticated;

-- Saves the workspace through whichever save function exists (migration 0009 renames it) and
-- returns {id, revision}. Runs as the caller, so row-level security applies to every write; any
-- failure rolls back the revision claim too.
CREATE OR REPLACE FUNCTION public.save_workspace_checked(
  p_org uuid, p_name text, p_state jsonb, p_sources jsonb, p_revision bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_fn text := CASE
    WHEN to_regprocedure('public.save_veritrail_workspace(uuid,text,jsonb,jsonb)') IS NOT NULL
      THEN 'save_veritrail_workspace'
    ELSE 'save_aegis_workspace' END;
  v_new boolean := p_org IS NULL OR p_org = '00000000-0000-0000-0000-000000000000'::uuid;
  v_revision bigint := 0;
  v_id uuid;
BEGIN
  IF NOT v_new THEN
    v_revision := public.claim_workspace_revision(p_org, p_revision);
  END IF;
  EXECUTE format('SELECT public.%I($1, $2, $3, $4)', v_fn)
    INTO v_id USING p_org, p_name, p_state, p_sources;
  RETURN jsonb_build_object('id', v_id, 'revision', v_revision);
END;
$$;
REVOKE ALL ON FUNCTION public.save_workspace_checked(uuid, text, jsonb, jsonb, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_workspace_checked(uuid, text, jsonb, jsonb, bigint) TO authenticated;
