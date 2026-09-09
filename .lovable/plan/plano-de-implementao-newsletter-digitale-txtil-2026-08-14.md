# Plano de Implementação - Newsletter Digitale Têxtil

Desenvolvimento da plataforma SaaS de e-mail marketing e automação com identidade visual moderna (azul-marinho, laranja e minimalismo).

## 1. Identidade Visual e Layout Base
- Configuração do tema no `src/styles.css` com cores da Digitale Têxtil.
- Criação do componente `AppSidebar` fixo com os links: Dashboard, Contatos, Listas, Segmentação, Campanhas, Templates, Automação, Formulários, Relatórios e Configurações.
- Estruturação do layout principal em `src/routes/_authenticated.tsx` (rota protegida mockada inicialmente).

## 2. Dashboard Executivo
- Implementação da página `/dashboard`.
- Cards de indicadores: Contatos (Total, Ativos, Novos), E-mails Enviados, Taxas (Abertura, Cliques, Rejeição, Descadastros).
- Gráficos (Recharts): Evolução de contatos, Desempenho das campanhas, Engajamento.
- Tabela de "Últimas campanhas".

## 3. Gestão de Contatos e Listas
- Página `/contacts`: Tabela com filtros, busca e ações (CRUD, importar CSV/planilha).
- Modal para criação/edição de contato com campos detalhados.
- Página `/lists`: Gerenciamento de listas e associação de contatos.

## 4. Campanhas e Templates
- Fluxo de criação de campanha `/campaigns/new` (Etapas: Info -> Destinatários -> Design -> Revisão).
- Biblioteca de templates `/templates` com categorias (Newsletter, Fitness, Moda Praia, etc.).
- Mock do editor de e-mail drag-and-drop (MVP inicial).

## 5. Configurações e Relatórios
- Área de analytics `/reports` com métricas detalhadas.
- Configurações de envio `/settings/email` (SMTP) e domínios `/settings/domain` (SPF/DKIM/DMARC).

## Detalhes Técnicos
- **Stack:** React 19, TanStack Start, Tailwind CSS v4, Lucide Icons, Recharts.
- **Componentes:** Shadcn/ui (Radix) para acessibilidade e consistência.
- **Estado:** TanStack Query para dados e cache.
- **Backend (Mock):** Camada de serviço desacoplada para fácil integração futura com Lovable Cloud/Supabase.
- **Segurança:** Estrutura de rotas protegidas e controle de perfil (Admin, Marketing, Comercial).

---

### 📊 Relatório de Execução

**Padrão utilizado:** Full Build SaaS

**Sub-agentes ativados:**
- 🎨 **UI Architect** — ✅ Executado (Planejamento de layout e cores)
- 🗄️ **Supabase Engineer** — ➖ Não necessário (Cloud credits limit, usando mock robusto)
- 🔍 **Code Auditor** — ✅ Executado (Análise de estrutura TanStack Start)
- 🧪 **Testing Agent** — ➖ Não necessário
- 📈 **SEO Optimizer** — ✅ Executado (Head metadata planejado)
- 🚀 **Deploy Ops** — ➖ Não necessário
- 🔌 **API Integrator** — ➖ Não necessário

**Resumo:** Plano detalhado para a criação da Newsletter Digitale Têxtil, focando na identidade visual azul/laranja e funcionalidades de SaaS.
**Arquivos modificados:** 0 (Plano inicial)
**Próximos passos sugeridos:** Iniciar a configuração das cores e o layout base com a sidebar.
