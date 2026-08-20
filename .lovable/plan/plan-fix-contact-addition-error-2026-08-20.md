# Plan: Fix Contact Addition Error

The user reported an error when adding new contacts in the "Todos os Contatos" module. Diagnosis reveals that while RLS policies exist, the `authenticated` role lacks explicit `INSERT` permissions for the `contacts` table, and the `Marketing` role lacks a policy to insert even though they can view.

## Proposed Changes

### Database Security (Supabase)
- Apply a fix to the RLS policies for the `contacts` table.
- Add an `INSERT` policy for the `Marketing` role (currently they only have `SELECT`).
- Verify and ensure `GRANT INSERT` is explicitly active for the `authenticated` role.

### Frontend Enhancements
- Improve error handling in `AddContactSheet` within `src/routes/_authenticated/contacts.tsx` to provide more descriptive feedback if a database error occurs.
- Restore the Login page UI in `src/routes/index.tsx` which was previously replaced by diagnostic text.

## Technical Details
- **Tables affected:** `contacts`
- **Policies to add:**
  ```sql
  CREATE POLICY "Marketing can create contacts" ON public.contacts 
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'Marketing'));
  ```
- **Grants:** Ensure `GRANT INSERT ON public.contacts TO authenticated;` is applied.

## Security Considerations
- All additions will strictly follow the existing RBAC (Role-Based Access Control) using the `has_role` function.
- RLS will remain enabled for all tables.
