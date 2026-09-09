# Plano de Implementação: Autenticação e Estrutura de Dados (Simulada)

Este plano descreve como implementaremos a estrutura de dados (tabelas e RLS) e o fluxo de autenticação persistente para a Newsletter Digitale Têxtil, adaptando-nos à ausência temporária de créditos no Lovable Cloud através de uma camada de persistência local robusta (localStorage) que poderá ser migrada facilmente para Supabase no futuro.

## 1. Estrutura de Dados (Esquema do Banco)

Implementaremos um "Mock DB" no frontend que segue rigorosamente o esquema relacional planejado para o Supabase.

### Tabelas Planejadas:
- `profiles`: Informações dos usuários internos.
  - `id` (UUID), `email` (TEXT), `name` (TEXT), `role` (ENUM: 'desenvolvedor', 'diretoria', 'gerencia', 'marketing'), `initials` (TEXT).
- `contacts`: Base de contatos para marketing.
  - `id`, `name`, `email`, `company`, `status`, `engagement` (0-100), `tags` (JSONB), `lists` (JSONB).
- `campaigns`: Registro de disparos.
  - `id`, `name`, `subject`, `status`, `scheduled_at`, `sent_at`, `stats` (JSONB).
- `automations`: Fluxos de trabalho.
  - `id`, `name`, `trigger`, `steps` (JSONB), `is_active`.

## 2. Autenticação Persistente

Substituiremos o mock estático do `useAuthStore` por um sistema que persiste no `localStorage`.

### Funcionalidades:
- **Login Inicial:** Tela de autenticação (simplificada para o MVP).
- **Persistência:** O estado do usuário será mantido entre recarregamentos de página.
- **RBAC (Role-Based Access Control):** Garantir que as permissões de cargo definidas anteriormente sejam respeitadas em nível de rota.

## 3. Cadastro Real (MVP)

Implementaremos o fluxo de "Cadastro Real" para:
- **Novos Contatos:** Formulário funcional que salva na "tabela" local.
- **Criação de Campanhas:** O Wizard salvará o progresso e o resultado final.

---

## Detalhes Técnicos

### Backend (Simulado via LocalStorage/Zustand Persist)
- Utilizaremos o middleware `persist` do Zustand para manter os dados no navegador.
- Criaremos hooks de "repository" para simular chamadas de API (async/await), facilitando a troca por `supabase-js` futuramente.

### Frontend
- **Auth Guard:** Refinamento do `_authenticated.tsx` para redirecionar usuários não logados.
- **Formulários:** Validação robusta com `react-hook-form` e `zod`.

### Segurança (Simulada)
- Simulação de RLS: Filtros de dados aplicados no nível do store com base no `user.role`.
