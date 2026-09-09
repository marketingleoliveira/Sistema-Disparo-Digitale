# Guia: como editar o projeto no chat e publicar no seu Git

Este guia explica o fluxo completo: como pedir alterações de código para o assistente (eu) dentro do chat do Lovable, e como publicar essas alterações no seu repositório GitHub para que os outros sites conectados sejam atualizados.

---

## Parte 1 — Como editar o código aqui no chat

1. **Descreva a alteração desejada em linguagem natural.**
   Exemplo: *"Troque o texto do rodapé para 'Desenvolvido por Digitale Têxtil'"* ou *"O botão de salvar está com a cor errada, deixe igual ao botão primário."*

2. **Se a alteração envolve uma imagem, link ou dado externo**, envie a URL real ou o arquivo — o assistente não pode adivinhar links de imagens ou textos que não foram fornecidos.

3. **O assistente responde com blocos de código no formato `SEARCH/REPLACE`** (para arquivos existentes) ou `CREATE` (para arquivos novos). Você não precisa entender esse formato — ele é aplicado automaticamente pelo Lovable ao seu projeto.

4. **Veja o resultado no preview** (painel ao lado do chat, dentro do editor Lovable). Se algo não ficou como esperado, descreva o problema no chat e o assistente ajusta.

5. **Peça arquivos específicos quando o assistente solicitar.** Às vezes, para editar com segurança sem quebrar o projeto, o assistente precisa ver o conteúdo atual exato de um arquivo (ex.: a tela de login, um hook de autenticação). Basta colar o conteúdo do arquivo na conversa.

> ⚠️ Alterações feitas no chat só existem dentro do ambiente do Lovable até você publicar (próxima seção). Elas **não** vão para o GitHub ou para os sites automaticamente.

---

## Parte 2 — Como publicar as alterações no GitHub

1. **Abra o editor do projeto no Lovable** (não o chat isolado — o ambiente completo com preview).

2. **Localize o botão "Publish"** (geralmente no canto superior direito da tela, perto do preview).

3. **Verifique se o projeto está conectado ao GitHub:**
   - Vá em **Settings → GitHub** dentro do projeto.
   - Se aparecer um repositório listado como conectado, ótimo — o botão Publish já vai gerar um commit nesse repositório.
   - Se **não estiver conectado**, clique em **"Connect to GitHub"**, autorize o acesso à sua conta/organização e escolha:
     - **Create new repository** (se for a primeira publicação), ou
     - **Link existing repository** (se você já tem um repo usado pelos outros sites).

4. **Clique em Publish.** Isso cria um commit no repositório conectado com todas as alterações aceitas na conversa.

---

## Parte 3 — Como isso chega aos "outros sites conectados"

Isso depende de como cada site foi configurado. Existem três cenários possíveis:

| Cenário | O que acontece após o Publish |
| --- | --- |
| **Deploy automático** (Vercel, Netlify, Cloudflare Pages, etc. apontando para o mesmo repositório/branch) | O redeploy dispara sozinho assim que o commit chega no GitHub. Você não precisa fazer nada além do Publish. |
| **Outro projeto Lovable separado** (uma cópia/fork, não o mesmo projeto) | **Não atualiza automaticamente.** É preciso repetir a alteração manualmente nesse outro projeto, ou reconfigurá-lo para apontar para o mesmo repositório GitHub central. |
| **Deploy manual** (alguém precisa clicar em "Deploy" em algum painel externo) | O Publish do Lovable só atualiza o GitHub. O deploy nesse serviço externo precisa ser acionado manualmente por você. |

### Como saber em qual cenário você está
- Entre no painel do serviço onde o site está hospedado (Vercel, Netlify, outro Lovable, etc.).
- Verifique se ele está "linkado" ao mesmo repositório GitHub que você conectou no passo 3 acima.
- Se sim e tiver "Auto Deploy" ativado → cenário 1 (automático).
- Se for outro projeto Lovable → cenário 2 (manual, precisa repetir a edição lá).
- Se for deploy manual → cenário 3 (precisa clicar em deploy lá depois do Publish).

---

## Resumo rápido

1. Peça a alteração no chat → 2. Confira no preview → 3. Clique em **Publish** no editor Lovable → 4. Se os outros sites têm auto-deploy do mesmo repo, eles atualizam sozinhos; senão, repita manualmente em cada um.