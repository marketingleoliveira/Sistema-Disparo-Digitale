GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
GRANT ALL ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_lists TO service_role;
GRANT ALL ON public.contact_segments TO authenticated;
GRANT ALL ON public.contact_segments TO service_role;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Ensure the role enum is usable
GRANT USAGE ON TYPE public.app_role TO authenticated;
GRANT USAGE ON TYPE public.app_role TO service_role;
GRANT USAGE ON TYPE public.app_role TO anon;
