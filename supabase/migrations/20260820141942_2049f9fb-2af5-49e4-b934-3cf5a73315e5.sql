-- Conceder permissões explícitas para a API do Supabase (PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_segments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_domain_config TO authenticated;

-- Criar políticas Master simplificadas
DROP POLICY IF EXISTS "All authenticated users can manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contacts;
CREATE POLICY "Master access for authenticated users" 
ON public.contacts FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contact_lists;
CREATE POLICY "Master access for authenticated users" 
ON public.contact_lists FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contact_segments;
CREATE POLICY "Master access for authenticated users" 
ON public.contact_segments FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

COMMENT ON TABLE public.contacts IS 'Permissions updated to Master for all authenticated roles.';