DROP POLICY IF EXISTS "team_members_authenticated_manage" ON public.team_members;
DROP POLICY IF EXISTS "email_domain_config_authenticated_manage" ON public.email_domain_config;

CREATE POLICY "team_members_privileged_manage" ON public.team_members
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Desenvolvedor'::app_role)
    OR public.has_role(auth.uid(), 'Diretoria'::app_role)
    OR public.has_role(auth.uid(), 'Gerência'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'Desenvolvedor'::app_role)
    OR public.has_role(auth.uid(), 'Diretoria'::app_role)
    OR public.has_role(auth.uid(), 'Gerência'::app_role)
  );

CREATE POLICY "email_domain_config_privileged_manage" ON public.email_domain_config
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Desenvolvedor'::app_role)
    OR public.has_role(auth.uid(), 'Diretoria'::app_role)
    OR public.has_role(auth.uid(), 'Gerência'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'Desenvolvedor'::app_role)
    OR public.has_role(auth.uid(), 'Diretoria'::app_role)
    OR public.has_role(auth.uid(), 'Gerência'::app_role)
  );