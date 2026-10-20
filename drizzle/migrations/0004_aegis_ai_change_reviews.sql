CREATE TABLE public.ai_change_reviews (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_change_reviews TO authenticated;
GRANT ALL ON public.ai_change_reviews TO service_role;
ALTER TABLE public.ai_change_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_ai_change_reviews ON public.ai_change_reviews
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.save_aegis_workspace(p_org uuid, p_name text, p_state jsonb, p_sources jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_org IS NULL OR p_org = '00000000-0000-0000-0000-000000000000'::uuid THEN
    INSERT INTO public.organizations(name) VALUES(p_name) RETURNING id INTO result;
  ELSE
    SELECT id INTO result FROM public.organizations WHERE id = p_org AND owner_id = auth.uid();
    IF result IS NULL THEN RAISE EXCEPTION 'Workspace unavailable'; END IF;
  END IF;
  INSERT INTO public.assessments(organization_id, answers) VALUES(result, p_state->'answers')
    ON CONFLICT(organization_id) DO UPDATE SET answers = excluded.answers, updated_at = now();
  INSERT INTO public.ai_systems(organization_id, systems) VALUES(result, p_state->'systems')
    ON CONFLICT(organization_id) DO UPDATE SET systems = excluded.systems;
  INSERT INTO public.guardrail_configs(organization_id, tier, controls) VALUES(result, p_state->>'tier', p_state->'gr')
    ON CONFLICT(organization_id) DO UPDATE SET tier = excluded.tier, controls = excluded.controls;
  INSERT INTO public.roadmap_items(organization_id, items) VALUES(result, p_state->'roadmap')
    ON CONFLICT(organization_id) DO UPDATE SET items = excluded.items;
  INSERT INTO public.ai_incidents(organization_id, incidents) VALUES(result, COALESCE(p_state->'incidents', '[]'::jsonb))
    ON CONFLICT(organization_id) DO UPDATE SET incidents = excluded.incidents, updated_at = now();
  INSERT INTO public.ai_governance_decisions(organization_id, decisions) VALUES(result, COALESCE(p_state->'decisions', '[]'::jsonb))
    ON CONFLICT(organization_id) DO UPDATE SET decisions = excluded.decisions, updated_at = now();
  INSERT INTO public.ai_change_reviews(organization_id, reviews) VALUES(result, COALESCE(p_state->'changeReviews', '[]'::jsonb))
    ON CONFLICT(organization_id) DO UPDATE SET reviews = excluded.reviews, updated_at = now();
  INSERT INTO public.sources(organization_id, entries) VALUES(result, p_sources)
    ON CONFLICT(organization_id) DO UPDATE SET entries = excluded.entries;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_aegis_workspace(uuid, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_aegis_workspace(uuid, text, jsonb, jsonb) TO authenticated;
