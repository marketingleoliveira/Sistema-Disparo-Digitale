# Plano de Implementação: Conversão de PDF para E-mail

Este plano detalha a implementação da funcionalidade de upload e conversão de PDF em designs de e-mail no Wizard de Campanhas, conforme solicitado para o uso interno da Digitale Têxtil.

## 📝 Visão Geral
Atualmente, o sistema suporta criação via editor visual, templates da biblioteca e importação do Canva. Adicionaremos uma quarta via: upload de PDF, que será processado e transformado em HTML editável para o disparo.

## 🛠️ Etapas Técnicas

### 1. Backend & Processamento
- Criar uma **Server Function** em `src/lib/campaigns/pdf-processor.functions.ts` para lidar com a conversão.
- Utilizar bibliotecas de processamento de PDF ou APIs de OCR/Layout para extrair estrutura e imagens.
- Implementar lógica para lidar com PDFs de múltiplas páginas (empilhamento vertical).

### 2. Interface do Wizard (Etapa 3)
- Adicionar um novo card "Importar PDF" na Etapa 3 do `CampaignWizard`.
- Implementar o componente `PdfUploadDialog` para gerenciar a seleção de arquivos e validações (tamanho máx 10MB, formato .pdf).
- Adicionar uma barra de progresso visual (`Progress` do shadcn) para o status da conversão.

### 3. Integração com o Editor
- Após a conversão, injetar o HTML resultante no estado `draft.html`.
- Permitir que o usuário abra o editor visual para refinar o layout convertido.

## 🛡️ Segurança e Validação
- Validação estrita de tipos MIME no frontend e backend.
- Sanitização do HTML gerado para evitar injeção de scripts.
- Limpeza de arquivos temporários no servidor após o processamento.

## 📅 Cronograma Sugerido
1.  **Infraestrutura:** Configuração da função de processamento e storage temporário.
2.  **UI/UX:** Adição dos botões, diálogos e barra de progresso no Wizard.
3.  **Refinamento:** Ajustes na precisão da conversão e interface de edição.

---
**Nota:** Esta é uma funcionalidade complexa que pode exigir iterações para garantir que o layout do PDF seja fielmente reproduzido no HTML de e-mail (que possui limitações técnicas específicas).
