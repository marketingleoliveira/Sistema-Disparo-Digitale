-- Conceder permissões explícitas para a tabela de contatos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;

-- Adicionar política de inserção para Marketing (que estava faltando)
CREATE POLICY "Marketing can insert contacts" ON public.contacts 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'Marketing'));

-- Garantir que a função has_role pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Garantir acesso ao esquema public
GRANT USAGE ON SCHEMA public TO authenticated;
