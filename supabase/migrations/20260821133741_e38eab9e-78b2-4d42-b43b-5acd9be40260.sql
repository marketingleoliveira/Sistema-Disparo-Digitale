-- Reativa RLS com políticas internas (equipe única, todos autenticados são confiáveis)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contacts','campaigns','contact_lists','contact_segments','team_members','email_domain_config']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "internal_team_full_access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "internal_team_full_access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_team" ON public.profiles;
CREATE POLICY "profiles_read_team" ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE EXECUTE ON FUNCTION public.grant_master_role_for_known_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;