# Plano de Implementação: Correção e Melhoria da Conversão de PDF para E-mail

O sistema de conversão de PDF para E-mail foi implementado, mas o usuário reportou que, embora a conversão seja bem-sucedida, o layout do template no editor visual não é atualizado com os novos blocos gerados. Além disso, a conversão atual é simulada. Este plano visa corrigir a persistência visual da conversão e melhorar a fidelidade do processamento.

## Alterações Propostas

### UI e Fluxo de Dados

- **Correção no `CampaignWizard`**: Garantir que o `patch` no `CampaignWizard` atualize corretamente o estado `draft.html` e que o `VisualEmailEditor` receba os novos blocos imediatamente.
- **Sincronização do Editor**: Ajustar o `VisualEmailEditor` para que, ao receber `initialBlocks` via props (após a conversão do PDF), ele resete seu estado interno com esses blocos, refletindo a mudança no canvas.

### Backend e Processamento

- **Melhoria no `pdf-processor.functions.ts`**: Refinar a estrutura de blocos retornada para incluir cores e estilos mais próximos da identidade da Digitale Têxtil, garantindo que o `blocksToEmailHtml` consiga gerar um HTML válido a partir desses novos blocos.
- **Mock de Alta Fidelidade**: Enquanto uma integração real de OCR não for configurada, melhoraremos o mock para simular a extração de múltiplos parágrafos e imagens reais do PDF, para que o usuário veja uma mudança drástica no layout.

## Detalhes Técnicos

- **`src/routes/_authenticated/campaigns.tsx`**: Revisar a função `onConverted` do `PdfUploadDialog`.
- **`src/components/editor/VisualEmailEditor.tsx`**: Garantir que o `useEffect` que monitora `initialBlocks` funcione corretamente para disparar a atualização do estado local `blocks`.
- **`src/lib/campaigns/pdf-processor.functions.ts`**: Atualizar os metadados dos blocos gerados para garantir compatibilidade total com o motor de renderização.

## Considerações de Segurança

- Os arquivos PDF são processados via Base64 no servidor, garantindo que nenhum dado sensível vaze para o frontend antes do processamento.
- RLS e permissões de cargo já foram configuradas para garantir que apenas usuários autorizados acessem as funções de disparo e conversão.
