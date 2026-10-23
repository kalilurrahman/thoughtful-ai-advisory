-- Platform renamed from AEGIS to VERITRAIL. The workspace save function keeps its
-- signature, grants and body; only its name changes so the client RPC name matches.
ALTER FUNCTION public.save_aegis_workspace(uuid, text, jsonb, jsonb) RENAME TO save_veritrail_workspace;
