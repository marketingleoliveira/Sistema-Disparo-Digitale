# Plan: Redesenho da Seção de Contatos (CRM Style)

Redesenhar completamente a página de contatos para oferecer uma experiência de CRM profissional, inspirada no Brevo, com funcionalidades avançadas de listagem, filtragem e detalhes de contato.

## Proposed Changes

### UI & UX (CRM Design)
- **Header**: Refatorar o cabeçalho com título "Contatos", descrição e botões de ação ("Adicionar contato" e "Importar contatos").
- **Toolbar**: Implementar barra de ferramentas com busca global, filtros rápidos (Lista, Tags, Status, Cadastro, Engajamento) e botão de filtros avançados.
- **Tabela de CRM**:
  - Implementar seleção múltipla via checkbox.
  - Colunas: Nome (com Avatar/Iniciais), E-mail, Empresa, Listas, Tags (Badges), Engajamento (Score visual), Última atividade e Status.
  - Micro-interações de hover e estados ativos.
- **Ações em Lote**: Barra flutuante ou menu de contexto para ações rápidas (Adicionar/Remover tag, Listas, Exportar, Excluir).
- **Paginação**: Rodapé profissional com contagem de registros ("1–50 de 2.384") e controles de página.
- **Side Panel (Contact Detail)**: Implementar painel lateral (Sheet) para visualização rápida de detalhes do contato:
  - Informações básicas (Tel, Empresa, Tags).
  - Histórico de campanhas e métricas (Aberturas, Cliques).
  - Timeline de atividades cronológica.

### Componentes e Estrutura
- Integrar componentes Shadcn/UI: Table, Avatar, Badge, Checkbox, Input, DropdownMenu, Sheet.
- Utilizar a paleta Digitale Têxtil (Marinho/Laranja/Gelo).
- Criar mock data robusto para testar a densidade de informação.

## Technical Details
- **Arquivo Principal**: `src/routes/_authenticated/contacts.tsx`.
- **Componentes Locais**: Organizar a página com sub-componentes para maior manutenibilidade.
- **Estado**: Gerenciamento de seleção múltipla e filtros via estado local.

