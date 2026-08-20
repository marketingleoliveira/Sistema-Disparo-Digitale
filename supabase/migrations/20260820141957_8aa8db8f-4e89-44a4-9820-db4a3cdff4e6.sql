REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS 'Function hardened: revoked from PUBLIC, granted only to authenticated roles for RLS.';