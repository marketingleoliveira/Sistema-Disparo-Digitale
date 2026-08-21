-- 1. Grants para todas as tabelas existentes do schema public
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.relname);
  END LOOP;
END$$;

-- 2. Rastreamento de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  first_click_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_idx ON public.campaign_recipients(campaign_id);

CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.campaign_recipients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('open','click')),
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_events_campaign_idx ON public.campaign_events(campaign_id);

GRANT SELECT ON public.campaign_recipients TO authenticated;
GRANT SELECT ON public.campaign_events TO authenticated;
GRANT ALL ON public.campaign_recipients TO service_role;
GRANT ALL ON public.campaign_events TO service_role;

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read campaign recipients" ON public.campaign_recipients;
CREATE POLICY "Authenticated can read campaign recipients"
  ON public.campaign_recipients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can read campaign events" ON public.campaign_events;
CREATE POLICY "Authenticated can read campaign events"
  ON public.campaign_events FOR SELECT TO authenticated USING (true);

-- 3. Acesso total automático para marketing@digitaletextil.com.br
CREATE OR REPLACE FUNCTION public.grant_master_role_for_known_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'marketing@digitaletextil.com.br' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'Desenvolvedor')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, 'Marketing Digitale', 'Desenvolvedor')
    ON CONFLICT (id) DO UPDATE SET role = 'Desenvolvedor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_master ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_master
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_master_role_for_known_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_master ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_master
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_master_role_for_known_email();