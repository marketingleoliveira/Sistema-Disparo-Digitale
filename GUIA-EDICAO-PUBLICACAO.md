# 📘 Guia: Editando com o Zenly e Publicando no Lovable

Este guia explica dois fluxos separados:

1. Como pedir edições de código aqui no chat (com a IA/Zenly).
2. Como essas edições chegam até o projeto Lovable e como manter tudo sincronizado.

---

## 1. Como editar o código aqui no chat

Este chat **não é o editor visual do Lovable** — é um assistente de código que aplica alterações diretamente nos arquivos do projeto (React + Tailwind + TanStack). O funcionamento é assim:

### Passo a passo

1. **Descreva o que você quer mudar**, sendo o mais específico possível:
   - ✅ "Troque o texto do botão 'Enviar' para 'Disparar campanha' em `campaigns.tsx`"
   - ✅ "Adicione um filtro por status na tela de contatos"
   - 🚫 Evite pedidos muito vagos como "melhore o site", pois isso pode gerar mudanças amplas e arriscadas.

2. **Eu aplico a alteração como um "diff"**, ou seja, só a parte que muda — não o arquivo inteiro. Isso reduz o risco de:
   - Quebrar imports existentes.
   - Apagar lógica que já funcionava.
   - Introduzir inconsistência entre como um componente é exportado (`export default` vs `export { Nome }`) e como ele é importado em outro arquivo — esse tipo de erro não avisa nada durante a edição, mas quebra o build inteiro na hora de compilar. Por isso, sempre que crio um componente novo, confirmo o padrão de export/import usado nos arquivos vizinhos antes de finalizar.

3. **Se eu preciso ver o conteúdo atual de um arquivo** para editar com segurança (por exemplo, para bater exatamente o texto a ser substituído), eu vou pedir que você cole o conteúdo dele aqui. Isso acontece porque não tenho acesso automático a ler todo o código-fonte a qualquer momento — apenas à lista de arquivos e o que já foi trocado nesta conversa.

4. **Tipos de alteração possíveis:**
   - **Editar arquivo existente** → altero só o trecho necessário.
   - **Criar arquivo novo** → uso quando é um componente, hook ou página que ainda não existe.
   - **Apagar arquivo** → só quando tenho certeza de que nada mais no projeto depende dele.

5. **Depois que eu aplico a mudança**, ela já fica refletida no ambiente do projeto (os arquivos "reais" do Lovable) — não é necessário copiar/colar manualmente nada.

---

## 2. Como sincronizar as edições daqui com o projeto base do Lovable

Aqui é importante entender a arquitetura: **o chat e o editor visual do Lovable operam sobre o mesmo projeto/repositório** — não são dois lugares separados que precisam de sincronização manual de código. Ou seja:

- Quando uma edição é aplicada aqui no chat, ela já está no mesmo "estado" do projeto que você vê no editor visual do Lovable.
- Você **não precisa exportar, baixar ou colar código manualmente** entre este chat e o Lovable.

O que de fato exige uma ação sua é **publicar essas mudanças para fora do Lovable** (GitHub e, a partir daí, outros serviços de deploy). Esse fluxo funciona assim:

### 2.1 Publicar do Lovable para o GitHub

1. Abra o projeto no editor do Lovable.
2. No topo da tela, use o botão **"Publish"** (pode aparecer como "Sync to GitHub" dependendo da versão da interface).
3. Isso cria um commit no repositório GitHub conectado ao projeto, com todas as alterações feitas — seja pelo chat, seja pelo editor visual.

> Se o projeto **ainda não estiver conectado a um repositório**, vá em **Project Settings → GitHub → Connect to GitHub**, autorize o acesso e escolha "Create new repository" (novo repo) ou "Link existing repository" (repo já existente).

### 2.2 Do GitHub para os outros sites/deploys

Depois que o commit chega no GitHub, o que acontece depende de como cada ambiente externo está configurado:

| Situação | O que acontece |
|---|---|
| Deploy com auto-deploy (Vercel, Netlify, Cloudflare Pages, etc. apontando pro mesmo repo/branch) | Atualiza **sozinho** assim que o commit chega no GitHub. |
| Outro projeto Lovable separado (não é o mesmo projeto, é uma cópia/fork) | **Não** sincroniza automaticamente — é preciso repetir a alteração manualmente nesse outro projeto, ou reconfigurá-lo para usar o mesmo repositório. |
| Deploy manual (alguém precisa clicar em "Deploy" em algum painel) | O Publish do Lovable só atualiza o GitHub; o deploy nesse serviço específico precisa ser disparado manualmente lá. |

### 2.3 Resumo do fluxo completo
