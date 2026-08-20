-- Desativar RLS nas tabelas core para garantir operação total
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_domain_config DISABLE ROW LEVEL SECURITY;

-- Garantir GRANTs
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_segments TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.email_domain_config TO authenticated;
GRANT ALL ON public.error_logs TO authenticated;

-- Garantir acesso a tipos
GRANT USAGE ON TYPE public.app_role TO authenticated;
