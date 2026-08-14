-- 1. Resolver RLS Enabled No Policy para user_roles
-- Permite que o usuário veja seus próprios cargos
do $$ begin
  drop policy if exists "Users can view their own roles" on public.user_roles;
exception when others then null;
end $$;
create policy "Users can view their own roles" on public.user_roles for select using (auth.uid() = user_id);

-- 2. Resolver Public/Authenticated Can Execute SECURITY DEFINER Function
-- Revoga execução pública e restringe a funções internas/service_role se necessário,
-- mas neste caso a função has_role é usada em políticas RLS, então precisa ser executável por authenticated.
-- Para silenciar o linter e seguir as boas práticas, revogamos de PUBLIC e anon explicitamente.

revoke execute on function public.has_role(uuid, app_role) from public;
revoke execute on function public.has_role(uuid, app_role) from anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.has_role(uuid, app_role) to service_role;
