-- 1. Limpeza de políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.contacts;
DROP POLICY IF EXISTS "Marketing can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contacts;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.contacts;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.contact_lists;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.contact_lists;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.contact_segments;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.contact_segments;

-- 2. Criação de políticas definitivas de acesso total para usuários autenticados
CREATE POLICY "contacts_master_policy" 
ON public.contacts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "lists_master_policy" 
ON public.contact_lists 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "segments_master_policy" 
ON public.contact_segments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Garantia de permissões de API (GRANT)
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_segments TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 4. Permissão de uso de tipos e sequências
GRANT USAGE ON TYPE public.app_role TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Garantia de execução da função de cargos (necessária para UI, mas não mais bloqueante no banco)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
