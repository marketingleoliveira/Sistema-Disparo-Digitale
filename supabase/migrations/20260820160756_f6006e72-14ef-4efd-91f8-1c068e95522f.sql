-- 1. Resetar TODAS as políticas das tabelas core
DROP POLICY IF EXISTS "contacts_master_policy" ON public.contacts;
DROP POLICY IF EXISTS "lists_master_policy" ON public.contact_lists;
DROP POLICY IF EXISTS "segments_master_policy" ON public.contact_segments;

-- 2. Habilitar RLS (garantir que está ligado)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_segments ENABLE ROW LEVEL SECURITY;

-- 3. Criar uma política única e absoluta para usuários autenticados
-- Sem filtros de auth.uid() para permitir acesso master a toda a equipe
CREATE POLICY "authenticated_master_access_contacts" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_master_access_lists" ON public.contact_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_master_access_segments" ON public.contact_segments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Garantir GRANTs de esquema e tabelas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5. Garantia para service_role (uso interno)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 6. Garantir que o tipo enum seja acessível
GRANT USAGE ON TYPE public.app_role TO authenticated;
GRANT USAGE ON TYPE public.app_role TO anon;
