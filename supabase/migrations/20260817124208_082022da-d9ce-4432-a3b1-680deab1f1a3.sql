CREATE TABLE public.email_domain_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'outro',
  sender_name TEXT NOT NULL DEFAULT 'Digitale Têxtil',
  sender_email TEXT NOT NULL DEFAULT '',
  reply_to TEXT,
  dkim_selector TEXT NOT NULL DEFAULT 'digitale',
  dkim_value TEXT,
  spf_value TEXT NOT NULL DEFAULT 'v=spf1 include:_spf.digitaletextil.com.br ~all',
  dmarc_value TEXT NOT NULL DEFAULT 'v=DMARC1; p=quarantine; rua=mailto:dmarc@digitaletextil.com.br',
  verification_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  spf_verified BOOLEAN NOT NULL DEFAULT false,
  dkim_verified BOOLEAN NOT NULL DEFAULT false,
  dmarc_verified BOOLEAN NOT NULL DEFAULT false,
  ownership_verified BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_domain_config TO authenticated;
GRANT ALL ON public.email_domain_config TO service_role;

ALTER TABLE public.email_domain_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipe autenticada pode ver dominios"
  ON public.email_domain_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipe autenticada pode criar dominios"
  ON public.email_domain_config FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Equipe autenticada pode atualizar dominios"
  ON public.email_domain_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Equipe autenticada pode remover dominios"
  ON public.email_domain_config FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_email_domain_config_updated_at
BEFORE UPDATE ON public.email_domain_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();