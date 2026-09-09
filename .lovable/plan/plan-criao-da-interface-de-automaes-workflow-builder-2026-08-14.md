# Plan: Criação da Interface de Automações (Workflow Builder)

Implementar o módulo de Automações para a Newsletter Digitale Têxtil, incluindo uma listagem profissional e um builder visual de workflows inspirado no Brevo.

## Proposed Changes

### UI & UX (Automations & Builder)
- **Listagem de Automações**:
  - Tabela com Nome, Status (Ativo/Inativo), Gatilho, Contatos Ativos e Última Execução.
  - Botão "Criar automação" para iniciar o fluxo.
- **Workflow Builder (Canvas Visual)**:
  - Canvas limpo com suporte a pan e zoom (simulado via CSS/Framer Motion).
  - Nós conectados por linhas visuais representando o fluxo lógico.
  - Diferenciação visual por cores:
    - **Gatilhos** (Verde/Esmeralda)
    - **Ações** (Azul/Marinho)
    - **Condições** (Laranja/Âmbar)
- **Biblioteca de Blocos**:
  - Gatilhos: Novo contato, Entrou em lista, Data específica.
  - Ações: Enviar e-mail, Adicionar/Remover tag, Esperar.
  - Condições: Abriu e-mail?, Clicou?, Possui tag?.
- **Interatividade**:
  - Adição de novos nós ao fluxo através de botões "+" entre os blocos.
  - Painel lateral para configuração do bloco selecionado.

### Componentes e Estrutura
- Rota: `src/routes/_authenticated/automations.tsx`.
- Componentes: `AutomationList`, `WorkflowBuilder`, `AutomationNode`, `NodeConnector`.

## Technical Details
- Uso de Framer Motion para animações de "drag" no canvas e conexões.
- Gerenciamento de estado complexo para representar a árvore do workflow.
- Layout responsivo com foco em desktop para o builder.

