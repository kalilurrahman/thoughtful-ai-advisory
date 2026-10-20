CREATE OR REPLACE FUNCTION public.save_aegis_workspace(p_org uuid, p_name text, p_state jsonb, p_sources jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF p_org IS NULL OR p_org='00000000-0000-0000-0000-000000000000'::uuid THEN INSERT INTO public.organizations(name) VALUES(p_name) RETURNING id INTO result; ELSE SELECT id INTO result FROM public.organizations WHERE id=p_org AND owner_id=auth.uid(); IF result IS NULL THEN RAISE EXCEPTION 'Workspace unavailable'; END IF; END IF;
INSERT INTO public.assessments(organization_id,answers) VALUES(result,p_state->'answers') ON CONFLICT(organization_id) DO UPDATE SET answers=excluded.answers,updated_at=now();
INSERT INTO public.ai_systems(organization_id,systems) VALUES(result,p_state->'systems') ON CONFLICT(organization_id) DO UPDATE SET systems=excluded.systems;
INSERT INTO public.guardrail_configs(organization_id,tier,controls) VALUES(result,p_state->>'tier',p_state->'gr') ON CONFLICT(organization_id) DO UPDATE SET tier=excluded.tier,controls=excluded.controls;
INSERT INTO public.roadmap_items(organization_id,items) VALUES(result,p_state->'roadmap') ON CONFLICT(organization_id) DO UPDATE SET items=excluded.items;
INSERT INTO public.sources(organization_id,entries) VALUES(result,p_sources) ON CONFLICT(organization_id) DO UPDATE SET entries=excluded.entries;
RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.save_aegis_workspace(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_aegis_workspace(uuid,text,jsonb,jsonb) TO authenticated;