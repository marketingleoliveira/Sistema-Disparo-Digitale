export function validateAutomationNodes(nodes) {
  if (
    !Array.isArray(nodes) ||
    nodes.length < 1 ||
    nodes.length > 100
  ) {
    throw new Error("Quantidade de etapas invalida.");
  }

  const ids = new Set();

  for (const node of nodes) {
    if (
      !node ||
      typeof node !== "object" ||
      Array.isArray(node) ||
      typeof node.id !== "string" ||
      !node.id.trim() ||
      node.id.length > 100 ||
      typeof node.label !== "string" ||
      !node.label.trim() ||
      node.label.length > 191 ||
      !["trigger", "condition", "action"].includes(node.type) ||
      (
        node.description !== undefined &&
        (
          typeof node.description !== "string" ||
          node.description.length > 2000
        )
      )
    ) {
      throw new Error("Etapa da automacao invalida.");
    }

    if (ids.has(node.id)) {
      throw new Error("Identificador de etapa duplicado.");
    }

    ids.add(node.id);
  }

  if (
    nodes[0]?.type !== "trigger" ||
    nodes.filter(node => node.type === "trigger").length !== 1
  ) {
    throw new Error("Fluxo precisa de um gatilho inicial unico.");
  }

  for (const node of nodes) {
    if (
      node.nextIds !== undefined &&
      (
        !Array.isArray(node.nextIds) ||
        node.nextIds.some(nextId =>
          typeof nextId !== "string" ||
          !ids.has(nextId) ||
          nextId === node.id
        ) ||
        new Set(node.nextIds).size !== node.nextIds.length
      )
    ) {
      throw new Error("Conexoes entre etapas invalidas.");
    }
  }

  return true;
}


export function validateRequiredAutomationNodes(automationId, nodes) {
  const required = {
    "digitale-newsletter": [
      ["newsletter-1", "trigger"],
      ["newsletter-2", "condition"],
    ],
    "digitale-clientes": [
      ["clientes-1", "trigger"],
      ["clientes-2", "condition"],
    ],
    "digitale-interesse": [
      ["interesse-1", "trigger"],
      ["interesse-2", "condition"],
      ["interesse-3", "condition"],
    ],
  };

  const expected = required[automationId];

  if (!expected || !Array.isArray(nodes)) {
    throw new Error("Automacao ou etapas invalidas.");
  }

  let previousIndex = -1;

  for (const [id, type] of expected) {
    const index = nodes.findIndex(node => node?.id === id);

    if (
      index <= previousIndex ||
      nodes[index]?.type !== type
    ) {
      throw new Error(
        "Etapa obrigatoria ausente, alterada ou fora de ordem."
      );
    }

    previousIndex = index;
  }

  // DIGITALE_PROTECTED_CONTENT_V1
  const protectedContent = {
  "digitale-newsletter": {
    "newsletter-1": [
      "Nova inscrição na Newsletter",
      "Cadastro realizado no site da Digitale Têxtil"
    ],
    "newsletter-2": [
      "Verificar autorização de marketing",
      "Contato elegível e não descadastrado"
    ]
  },
  "digitale-clientes": {
    "clientes-1": [
      "Selecionar comunicação",
      "Radar, Bem-estar ou Novidades e Lançamentos"
    ],
    "clientes-2": [
      "Verificar base de clientes",
      "Contato elegível para receber marketing"
    ]
  },
  "digitale-interesse": {
    "interesse-1": [
      "Visita a artigo ou tecido",
      "Exemplo: visitante visualizou o tecido Milano"
    ],
    "interesse-2": [
      "Identificar contato",
      "Associar evento a e-mail da base com segurança"
    ],
    "interesse-3": [
      "Verificar autorização e duplicidade",
      "Consentimento, descadastro e frequência"
    ]
  }
};

  for (const [id, original] of Object.entries(
    protectedContent[automationId]
  )) {
    const node = nodes.find(item => item.id === id);

    if (
      node?.label !== original[0] ||
      node?.description !== original[1] ||
      node?.config !== undefined
    ) {
      throw new Error(
        "Conteudo ou parametros da etapa obrigatoria alterados."
      );
    }
  }

  if (nodes[0]?.id !== expected[0][0]) {
    throw new Error("Gatilho original obrigatorio.");
  }

  // DIGITALE_PROTECTED_CONNECTIONS_V1
  const requiredPositions = expected
    .slice(1)
    .map(([id]) => nodes.findIndex(node => node.id === id));

  const positions = new Map(
    nodes.map((node, index) => [node.id, index])
  );

  for (const [sourceIndex, node] of nodes.entries()) {
    if (node.nextIds === undefined) continue;

    if (!Array.isArray(node.nextIds)) {
      throw new Error("Conexoes invalidas.");
    }

    for (const nextId of node.nextIds) {
      const targetIndex = positions.get(nextId);

      if (
        targetIndex === undefined ||
        targetIndex <= sourceIndex
      ) {
        throw new Error("Conexao retroativa ou invalida.");
      }

      if (
        requiredPositions.some(
          requiredIndex =>
            sourceIndex < requiredIndex &&
            requiredIndex < targetIndex
        )
      ) {
        throw new Error(
          "Conexao ignora uma condicao obrigatoria."
        );
      }
    }
  }

  return true;
}
