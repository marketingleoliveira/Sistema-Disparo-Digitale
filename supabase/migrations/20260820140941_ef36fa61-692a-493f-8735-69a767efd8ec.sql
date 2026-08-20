-- Grant general master rights by ensuring RLS allows all authenticated users 
-- to perform CRUD, keeping only internal 'Configurações' table restricted.

-- Make sure all authenticated users have policies for contacts
DROP POLICY IF EXISTS "Marketing can insert contacts" ON public.contacts;
CREATE POLICY "All authenticated users can manage contacts" 
ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Repeat for lists and segments
DROP POLICY IF EXISTS "Admins can select all rows" ON public.contact_lists; -- example of an old policy name
CREATE POLICY "All authenticated users can manage lists" 
ON public.contact_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated users can manage segments" 
ON public.contact_segments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure profiles are readable/writable by the user themselves or master
CREATE POLICY "Users can manage own profile" 
ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
