# Plano: Auditoria Visual e Refinamento de UX - Newsletter Digitale Têxtil

Realizar uma auditoria completa de UI/UX para elevar o projeto ao nível de um produto SaaS profissional (referência Brevo), mantendo a identidade da Digitale Têxtil. Foco em consistência, hierarquia e refinamento estético sem alteração de funcionalidades.

## Ações Propostas

### 1. Refinamento de Design System (CSS Global)
- **Normalização de Espaçamentos**: Ajustar tokens de padding/gap no `src/styles.css` para garantir ritmo vertical consistente.
- **Tipografia**: Refinar pesos e tamanhos da fonte Inter. Garantir que títulos e textos de apoio tenham contraste tipográfico claro.
- **Tokens de Superfície**: Padronizar sombras (`shadow-sm`, `shadow-md`) e bordas (`rounded-xl` para cards, `rounded-lg` para componentes menores) para evitar excessos.
- **Paleta Semântica**: Garantir uso estrito dos tokens `primary` (Navy) e `accent` (Orange) em estados interativos.

### 2. Componentes de UI (Base)
- **Botões e Inputs**: Ajustar altura padrão, padding horizontal e transições de hover/focus. Garantir que botões de ação primária tenham o peso visual correto.
- **Tabelas**: Aumentar o respiro das células, alinhar cabeçalhos e padronizar o estilo de "hover row".
- **Cards e Badges**: Refinar o contraste das badges e a densidade de informação nos cards.

### 3. Layout Estrutural
- **Sidebar & Topbar**: Melhorar o alinhamento de ícones e textos. Garantir que o "active state" na navegação seja discreto porém inequívoco.
- **Responsividade**: Revisar breakpoints críticos (Mobile/Tablet) para garantir que elementos não "quebrem" visualmente em telas menores.

### 4. Estados e Micro-interações
- **Feedback Visual**: Padronizar animações de carregamento (Skeletons) e estados vazios (Empty States) para que sigam a mesma linguagem visual.
- **Acessibilidade**: Verificar contraste de cores e estados de focus visíveis.

## Detalhes Técnicos
- Edição centralizada no `src/styles.css` para efeitos globais.
- Revisão cirúrgica em `src/components/layout/` e rotas principais (`dashboard`, `contacts`, `reports`) para alinhar classes Tailwind.
- Remoção de classes redundantes ou contraditórias (ex: excesso de `!important` ou cores hardcoded).

