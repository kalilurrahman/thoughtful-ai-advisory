CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL,
  feature text NOT NULL CHECK (feature IN ('advisor')),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (user_id, feature, day)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_select_own ON public.ai_usage;
CREATE POLICY ai_usage_select_own ON public.ai_usage FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_feature text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_count integer;
BEGIN
  IF v_user IS NULL OR p_limit IS NULL OR p_limit < 1 THEN RETURN false; END IF;
  INSERT INTO public.ai_usage AS u (user_id, feature, day, count)
  VALUES (v_user, p_feature, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, feature, day) DO UPDATE SET count = u.count + 1 WHERE u.count < p_limit
  RETURNING u.count INTO v_count;
  RETURN v_count IS NOT NULL;
END; $$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text, integer) TO authenticated;