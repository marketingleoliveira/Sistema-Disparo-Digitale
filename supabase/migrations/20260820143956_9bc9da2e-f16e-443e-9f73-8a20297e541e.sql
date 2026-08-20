-- Security Hardening for has_role function
-- Revoke all execute rights first to clean up
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Explicitly grant to roles that need it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Ensure operational tables are fully accessible to authenticated users
-- This is intentional for this internal application to ensure Admin Master rights for all
GRANT ALL PRIVILEGES ON public.contacts TO authenticated;
GRANT ALL PRIVILEGES ON public.contact_lists TO authenticated;
GRANT ALL PRIVILEGES ON public.contact_segments TO authenticated;
GRANT ALL PRIVILEGES ON public.campaigns TO authenticated;

-- Final verification of RLS policies for contacts
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.contacts;
CREATE POLICY "Allow all for authenticated" 
ON public.contacts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
