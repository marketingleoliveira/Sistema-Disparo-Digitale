CREATE POLICY "Painel interno pode ver dominios"
  ON public.email_domain_config FOR SELECT TO anon USING (true);
CREATE POLICY "Painel interno pode criar dominios"
  ON public.email_domain_config FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Painel interno pode atualizar dominios"
  ON public.email_domain_config FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Painel interno pode remover dominios"
  ON public.email_domain_config FOR DELETE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_domain_config TO anon;