# Plano de Migração para Lovable Cloud

Este plano detalha a transição do armazenamento local (`localStorage`) para a infraestrutura persistente do **Lovable Cloud**, incluindo a criação do esquema de banco de dados, políticas de segurança (RLS) e integração do frontend.

## 1. Infraestrutura do Banco de Dados

Criação das tabelas principais com suporte a multi-permissões e integridade referencial.

### Esquema SQL
- **profiles**: Extensão do `auth.users` para armazenar cargos (`role`) e metadados.
- **contacts**: Armazenamento de leads e clientes.
- **campaigns**: Registros de campanhas de e-mail.
- **user_roles**: Tabela de suporte para controle de acesso granular (RBAC).

## 2. Segurança e Permissões (RLS)

Implementação de Row Level Security para garantir o isolamento dos dados internos da Digitale Têxtil.

- **Desenvolvedor/Admin**: Acesso total a todas as tabelas.
- **Diretoria/Gerência**: Permissão de leitura e escrita em contatos e campanhas.
- **Marketing**: Acesso de leitura (Analytics) e criação de rascunhos, sem permissão de envio.

## 3. Integração do Frontend

- Substituição dos hooks `useAuthStore` e `useDataStore` (Zustand persist) pelo cliente Supabase.
- Migração dos dados existentes no `localStorage` para o Cloud (opcional/semeadura).
- Implementação de SSR-safe auth guards.

## Detalhes Técnicos

```text
- Tabela profiles: user_id (FK), full_name, role (enum), avatar_url
- Tabela contacts: id, name, email, company, status, lists (jsonb), tags (jsonb)
- Tabela campaigns: id, name, subject, content (text/jsonb), status, stats (jsonb)
- Políticas RLS: public.has_role() check para validação de privilégios.
```
