DROP POLICY IF EXISTS "Full access for Desenvolvedor/Diretoria/Gerência" ON public.contacts;
DROP POLICY IF EXISTS "Marketing can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Marketing can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contacts;

CREATE POLICY "Allow all for authenticated"
ON public.contacts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Repeat for lists and segments just in case
DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contact_lists;
CREATE POLICY "Allow all for authenticated" ON public.contact_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Master access for authenticated users" ON public.contact_segments;
CREATE POLICY "Allow all for authenticated" ON public.contact_segments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Final check on GRANTs
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_segments TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
