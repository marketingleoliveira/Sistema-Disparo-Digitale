-- Garante que o usuário de teste tenha perfil e cargo de Desenvolvedor
INSERT INTO public.profiles (id, full_name, role)
VALUES ('9ec1a208-b441-4018-903b-f7e8e1e9a551', 'Leonardo Oliveira', 'Desenvolvedor')
ON CONFLICT (id) DO UPDATE SET role = 'Desenvolvedor';

INSERT INTO public.user_roles (user_id, role)
VALUES ('9ec1a208-b441-4018-903b-f7e8e1e9a551', 'Desenvolvedor')
ON CONFLICT (user_id, role) DO NOTHING;
