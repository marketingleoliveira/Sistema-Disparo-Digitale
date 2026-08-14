-- Enum para cargos do sistema
do $$ begin
  create type public.app_role as enum ('Desenvolvedor', 'Diretoria', 'Gerência', 'Marketing');
exception when duplicate_object then null;
end $$;

-- Tabela de perfis (extensão de auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role app_role not null default 'Marketing',
  avatar_url text,
  updated_at timestamptz default now()
);

-- Tabela de contatos
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  status text check (status in ('Ativo', 'Pendente', 'Descadastrado')) default 'Ativo',
  lists jsonb default '[]',
  tags jsonb default '[]',
  engagement int default 0,
  last_activity text default 'Recém adicionado',
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de campanhas
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  type text,
  status text check (status in ('Enviada', 'Agendada', 'Rascunho', 'Em andamento')) default 'Rascunho',
  recipients int default 0,
  open_rate text default '0%',
  click_rate text default '0%',
  content jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de roles para segurança definitiva (evitar recursão)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Grants
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles to service_role;
grant all on public.contacts to service_role;
grant all on public.campaigns to service_role;
grant all on public.user_roles to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.user_roles enable row level security;

-- Função de segurança para verificar role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Políticas de segurança (Drop before create for idempotency in migrations)
do $$ begin
  drop policy if exists "Users can view their own profile" on public.profiles;
  drop policy if exists "Users can update their own profile" on public.profiles;
  drop policy if exists "Admins can view all profiles" on public.profiles;
  drop policy if exists "Full access for Desenvolvedor/Diretoria/Gerência" on public.contacts;
  drop policy if exists "Marketing can view contacts" on public.contacts;
  drop policy if exists "Full access for campaigns (except Marketing)" on public.campaigns;
  drop policy if exists "Marketing can view campaigns" on public.campaigns;
  drop policy if exists "Marketing can create draft campaigns" on public.campaigns;
exception when others then null;
end $$;

-- Profiles policies
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'Desenvolvedor'));

-- Contatos e Campanhas policies
create policy "Full access for Desenvolvedor/Diretoria/Gerência" on public.contacts 
  for all using (public.has_role(auth.uid(), 'Desenvolvedor') or public.has_role(auth.uid(), 'Diretoria') or public.has_role(auth.uid(), 'Gerência'));

create policy "Marketing can view contacts" on public.contacts 
  for select using (public.has_role(auth.uid(), 'Marketing'));

create policy "Full access for campaigns (except Marketing)" on public.campaigns
  for all using (public.has_role(auth.uid(), 'Desenvolvedor') or public.has_role(auth.uid(), 'Diretoria') or public.has_role(auth.uid(), 'Gerência'));

create policy "Marketing can view campaigns" on public.campaigns
  for select using (public.has_role(auth.uid(), 'Marketing'));

create policy "Marketing can create draft campaigns" on public.campaigns
  for insert with check (public.has_role(auth.uid(), 'Marketing') and status = 'Rascunho');
