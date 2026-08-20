-- Tabela de Listas de Contatos
CREATE TABLE public.contact_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_lists TO service_role;

ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for authenticated users" 
ON public.contact_lists 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Tabela de Segmentos de Contatos
CREATE TABLE public.contact_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_segments TO authenticated;
GRANT ALL ON public.contact_segments TO service_role;

ALTER TABLE public.contact_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for authenticated users" 
ON public.contact_segments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Inserindo dados iniciais (Seed)
INSERT INTO public.contact_lists (name, description) VALUES 
('Newsletter Geral', 'Todos os contatos que se inscreveram via site.'),
('Clientes VIP', 'Contatos com alto engajamento e histórico de compra.'),
('Prospects 2026', 'Novos leads gerados em eventos tecnológicos.');

INSERT INTO public.contact_segments (name, description, filters) VALUES 
('Engajamento Alto', 'Contatos com mais de 80% de engajamento.', '{"minEngagement": 80}'),
('Sem Atividade', 'Contatos que não abriram e-mails nos últimos 30 dias.', '{"lastActivityDays": 30}');
