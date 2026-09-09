# Plan: Criação da Biblioteca Visual de Templates

Implementar uma biblioteca de templates profissional para a Newsletter Digitale Têxtil, organizada como um marketplace interno inspirado no Brevo.

## Proposed Changes

### UI & UX (Template Library)
- **Header & Navegação**:
  - Título "Templates" e botão principal "Criar template".
  - Sistema de filtros por categorias (Newsletter, Promoção, Lançamento, etc.).
- **Marketplace de Templates**:
  - Seção dedicada "Templates da Digitale Têxtil" com design premium alinhado à marca.
  - Grade de cards interativos com previews visuais.
  - Hover states avançados com ações rápidas: Editar, Duplicar, Excluir e Usar.
- **Visual & Design**:
  - Aplicação rigorosa da paleta (Marinho, Branco, Gelo, Laranja).
  - Cards com metadados: Nome, Categoria, Última atualização.
  - Empty state elegante para quando não houver resultados.

### Componentes e Estrutura
- Integrar com a rota `src/routes/_authenticated/templates.tsx`.
- Criar componentes reutilizáveis: `TemplateCard`, `CategoryFilter`, `TemplateGallery`.
- Adicionar lógica de alternância entre a "Biblioteca" e o "Editor" criado anteriormente.

## Technical Details
- **Rota**: Refatorar `src/routes/_authenticated/templates.tsx` para gerenciar o estado da galeria.
- **Estado**: Gerenciamento de filtros e lista de templates mockados.
- **UX**: Animações de entrada e transição entre categorias usando Framer Motion.

