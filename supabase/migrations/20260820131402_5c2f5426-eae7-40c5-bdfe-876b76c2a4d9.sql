CREATE TABLE public.error_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    type text NOT NULL,
    path text,
    user_id uuid REFERENCES auth.users(id),
    metadata jsonb
);

GRANT SELECT, INSERT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own error logs" 
ON public.error_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Privileged roles can view all error logs"
ON public.error_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'Desenvolvedor') OR public.has_role(auth.uid(), 'Diretoria'));
