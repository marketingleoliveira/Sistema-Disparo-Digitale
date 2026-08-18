DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('team_members','email_domain_config') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

REVOKE ALL ON public.team_members FROM anon;
REVOKE ALL ON public.email_domain_config FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_domain_config TO authenticated;
GRANT ALL ON public.team_members TO service_role;
GRANT ALL ON public.email_domain_config TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_domain_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_authenticated_manage" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "email_domain_config_authenticated_manage" ON public.email_domain_config FOR ALL TO authenticated USING (true) WITH CHECK (true);