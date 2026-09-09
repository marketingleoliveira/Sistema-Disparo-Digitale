# Plan: Criação da Área de Analytics (Relatórios)

Implementar a seção de Analytics para a Newsletter Digitale Têxtil, com foco em alta densidade de informação, legibilidade e métricas comparativas inspiradas no Brevo.

## Proposed Changes

### UI & UX (Analytics Dashboard)
- **Header & Filtros**:
  - Título "Relatórios".
  - Seletor de período (7d, 30d, 90d, Personalizado).
  - Botão de exportação de dados (PDF/CSV).
- **KPI Grid**:
  - 6 cards compactos: E-mails enviados, Entregues, Aberturas, Cliques, Bounce e Descadastros.
  - Indicadores de tendência (comparação com período anterior).
- **Gráficos (Recharts)**:
  - **Desempenho Geral**: Gráfico de linha multi-série (Aberturas vs Cliques).
  - **Engajamento**: Gráfico de pizza ou barras para segmentação de engajamento da base.
  - **Crescimento**: Gráfico de área para crescimento da base de contatos.
- **Tabelas de Ranking**:
  - **Melhores Campanhas**: Tabela com métricas de performance (Abertura, Cliques, Descadastros).
  - **Segmentação de Contatos**: Cards para Mais engajados, Menos engajados e Inativos.

### Componentes e Estrutura
- Rota: `src/routes/_authenticated/reports.tsx`.
- Componentes de UI: Cards estatísticos, tabelas personalizadas e wrappers para Recharts.

## Technical Details
- Uso de `recharts` para visualização de dados.
- Filtros reativos que atualizam o estado do dashboard.
- Identidade visual mantida (Marinho/Laranja/Gelo).

