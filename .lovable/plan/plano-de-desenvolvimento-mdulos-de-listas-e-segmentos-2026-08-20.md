# Plano de Desenvolvimento: Módulos de Listas e Segmentos

O objetivo é implementar a funcionalidade completa de **Listas** e **Segmentos** dentro do menu de contatos, permitindo a organização e filtragem avançada da audiência para campanhas.

## 1. Estrutura de Dados (Backend)
- Criar a tabela `contact_lists` para armazenar as listas estáticas.
- Criar a tabela `contact_segments` para armazenar regras dinâmicas de filtragem.
- Configurar RLS e Grants para acesso seguro.

## 2. Interface de Listas
- Redesenhar `src/routes/_authenticated/lists.tsx`.
- Adicionar lista de cards/tabela com contagem de contatos.
- Implementar criação, edição e exclusão de listas.
- Permitir visualização dos contatos dentro de cada lista.

## 3. Interface de Segmentos
- Redesenhar `src/routes/_authenticated/segments.tsx`.
- Implementar um "Segment Builder" (filtros por tags, engajamento, data de cadastro, etc.).
- Salvar e editar regras de segmentação.

## 4. Integração
- Atualizar `useDataStore` no `src/hooks/use-data.ts` para gerenciar listas e segmentos.
- Garantir que ao importar contatos, eles possam ser atribuídos a listas existentes.

## Detalhes Técnicos
- **Tabelas:**
    ```sql
    CREATE TABLE contact_lists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE contact_segments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      filters JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ```
- **RLS:** Apenas `authenticated` pode ler/escrever.
- **Grants:** `authenticated` e `service_role`.
