CREATE OR REPLACE FUNCTION public.org_member_directory(p_org uuid)
 RETURNS TABLE(user_id uuid, role text, display_name text, email text, joined_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_read_org(p_org) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT m.user_id, m.role, COALESCE(p.display_name, '')::text, COALESCE(u.email, '')::text, m.created_at
  FROM public.organization_members m
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = p_org
  ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'operator' THEN 2 WHEN 'approver' THEN 3 ELSE 4 END, m.created_at;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.org_member_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_member_directory(uuid) TO authenticated;