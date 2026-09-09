# Plan: Redesenho do Dashboard (Newsletter Digitale Têxtil)

Redesenhar completamente o dashboard para transformá-lo em um centro de controle profissional de e-mail marketing, utilizando o Brevo como referência de design, densidade e funcionalidade.

## User Review Required
> [!IMPORTANT]
> A visualização de "Empty State" será implementada de forma condicional, mas para fins de demonstração, o dashboard inicial conterá dados fictícios para validar o novo design.

## Proposed Changes

### UI & UX (SaaS High-Density Design)
- **Header**: Refatorar o cabeçalho com título "Visão geral", subtítulo descritivo e botão de ação "+ Criar campanha".
- **KPI Cards**: Implementar cards ultra-compactos para Contatos, Enviados, Abertura, Cliques, Descadastros e Bounce, incluindo indicadores de tendência coloridos (↑ verde / ↓ vermelho).
- **Gráfico de Desempenho**: Substituir o gráfico atual por um dashboard de performance com filtros de período (7d, 30d, 90d, 12m) e múltiplas séries (Enviados, Aberturas, Cliques).
- **Tabela de Campanhas**: Reformular a tabela de campanhas recentes com status coloridos (Enviada, Agendada, Rascunho, Em andamento).
- **Engajamento**: Adicionar visualização gráfica simplificada para a segmentação de engajamento da base (Muito engajados, Engajados, etc.).
- **Timeline de Atividade**: Implementar uma linha do tempo lateral ou inferior com as atividades recentes do sistema.
- **Empty States**: Criar componentes de estado vazio informativos e com chamadas para ação (CTA) claras.

### Componentes e Estrutura
- Utilizar a paleta de cores Digitale Têxtil (Marinho/Laranja/Gelo).
- Melhorar a responsividade e a densidade de informação para telas menores.
- Implementar micro-interações em todos os cards e botões.

## Technical Details
- **Frontend**: React + Tailwind CSS (v4) + Lucide Icons.
- **Gráficos**: Recharts para visualizações de dados complexas e performáticas.
- **Componentes UI**: Shadcn/UI (Button, Card, Table, Badge, Tabs/Select para filtros).
- **Dados**: Mock data robusto para preencher o novo layout e validar a hierarquia visual.
- **Arquivo Principal**: `src/routes/_authenticated/dashboard.tsx`.

