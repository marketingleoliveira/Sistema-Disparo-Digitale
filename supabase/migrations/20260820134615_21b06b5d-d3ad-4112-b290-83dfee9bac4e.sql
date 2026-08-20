-- Concede permissão de inserção na API de dados
GRANT INSERT ON public.contacts TO authenticated;

-- Adiciona política RLS para permitir inserção pelo Marketing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' 
        AND policyname = 'Marketing can create contacts'
    ) THEN
        CREATE POLICY "Marketing can create contacts" ON public.contacts 
        FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'Marketing'));
    END IF;
END $$;