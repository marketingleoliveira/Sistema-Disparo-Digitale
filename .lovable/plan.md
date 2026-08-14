# Plan: Redesenho da Área de Campanhas (Wizard Flow)

Reformular completamente a área de campanhas, implementando uma listagem profissional e um fluxo de criação em etapas (Wizard) inspirado no Brevo, com foco em UX e clareza.

## Proposed Changes

### UI & UX (Campaign Management)
- **Dashboard de Campanhas**:
  - Listagem com filtros de status: Todas, Enviadas, Agendadas, Rascunhos, Em andamento.
  - Tabela com colunas: Nome, Tipo, Data, Destinatários, Abertura, Cliques, Status e Ações.
- **Wizard de Criação**:
  - Barra de progresso visual no topo: 01 Informações → 02 Destinatários → 03 Design → 04 Configurações → 05 Revisão.
  - **Etapa 01 (Informações)**: Formulário para Nome, Assunto, Remetente e E-mail de resposta.
  - **Etapa 02 (Destinatários)**: Seleção visual de listas e segmentos com contador de alcance em tempo real ("2.384 contatos alcançados").
  - **Etapa 03 (Design)**: Escolha entre templates prontos ou criação do zero.
  - **Etapa 05 (Revisão)**: Resumo completo da campanha com preview simulado (Desktop/Mobile) e ações finais (Enviar teste, Agendar, Enviar agora).
- **Segurança**: Diálogos de confirmação para ações irreversíveis (Excluir, Enviar agora).

### Componentes e Estrutura
- Integrar componentes Shadcn/UI: Tabs, Input, Select, Label, Dialog, Table, Badge.
- Manter a paleta Digitale Têxtil (Marinho/Laranja/Gelo).
- Criar mock data para campanhas enviadas e rascunhos.

## Technical Details
- **Arquivo Principal**: `src/routes/_authenticated/campaigns.tsx`.
- **Estado**: Gerenciamento do `step` atual e dos dados da campanha via `useState`.
- **UX**: Transições suaves entre etapas do wizard usando Framer Motion ou animações Tailwind.

