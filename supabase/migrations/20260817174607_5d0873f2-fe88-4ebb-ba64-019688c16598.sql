CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'Marketing',
  department text,
  status text NOT NULL DEFAULT 'Ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipe autenticada pode ver membros" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipe autenticada pode criar membros" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe autenticada pode atualizar membros" ON public.team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Equipe autenticada pode remover membros" ON public.team_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Painel interno pode ver membros" ON public.team_members FOR SELECT TO anon USING (true);
CREATE POLICY "Painel interno pode criar membros" ON public.team_members FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Painel interno pode atualizar membros" ON public.team_members FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Painel interno pode remover membros" ON public.team_members FOR DELETE TO anon USING (true);

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();