# Plan: Criação do Editor Visual de E-mail (Drag & Drop)

Implementar um editor visual de e-mail profissional, inspirado no Brevo, com estrutura de três colunas (Blocos | Canvas | Propriedades) e funcionalidades avançadas de personalização.

## Proposed Changes

### UI & UX (Visual Editor Design)
- **Estrutura de Layout**:
  - **Coluna Esquerda (Biblioteca)**: Blocos de conteúdo (Texto, Título, Imagem, Botão, Divisor, etc.) e blocos de estrutura (Colunas).
  - **Coluna Central (Canvas)**: Área de visualização interativa com suporte a preview Desktop/Mobile.
  - **Coluna Direita (Propriedades)**: Painel contextual que muda conforme o elemento selecionado no canvas.
- **Funcionalidades do Editor**:
  - **Interatividade**: Simulação de Drag & Drop para arrastar blocos ao canvas.
  - **Edição Contextual**: Toolbar flutuante em cada bloco (Duplicar, Excluir, Mover).
  - **Propriedades Avançadas**:
    - **Texto**: Fonte, tamanho, cor, alinhamento.
    - **Botão**: Link, cor de fundo, border-radius, padding.
    - **Imagem**: Upload simulado, URL, alt text.
- **Ferramentas Adicionais**:
  - Inserção de variáveis dinâmicas: `{{nome}}`, `{{empresa}}`.
  - Botão "Salvar como template".
  - Toggle de visualização (Desktop/Mobile).

### Componentes e Estrutura
- Integrar componentes Shadcn/UI: `ScrollArea`, `Slider`, `Switch`, `Tabs`, `Separator`, `Tooltip`.
- Manter a paleta Digitale Têxtil (Marinho/Laranja/Gelo).
- Criar um estado complexo para gerenciar a lista de blocos no canvas e o elemento selecionado.

## Technical Details
- **Arquivo**: `src/routes/_authenticated/templates.tsx` (ou criar rota específica para o editor).
- **Estado**: Gerenciamento de um array de objetos `blocks` que define a estrutura do e-mail.
- **UX**: Uso de Framer Motion para animações de reordenação e estados de hover.

