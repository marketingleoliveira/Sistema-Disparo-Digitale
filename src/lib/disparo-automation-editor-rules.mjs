// DIGITALE_EDITOR_RULES_V1
// Regras puras para rascunhos; nenhuma execucao de automacoes.

const protectedIds = {
  "digitale-newsletter": ["newsletter-1", "newsletter-2"],
  "digitale-clientes": ["clientes-1", "clientes-2"],
  "digitale-interesse": [
    "interesse-1",
    "interesse-2",
    "interesse-3",
  ],
};

const requiredConditions = {
  "digitale-newsletter": ["newsletter-2"],
  "digitale-clientes": ["clientes-2"],
  "digitale-interesse": ["interesse-2", "interesse-3"],
};

export function isProtectedAutomationNode(automationId, node) {
  if (!node || !protectedIds[automationId]) return true;

  return (
    node.type === "trigger" ||
    protectedIds[automationId].includes(node.id)
  );
}

function validContext(automationId, nodes) {
  if (!requiredConditions[automationId]) return false;
  if (!Array.isArray(nodes)) return false;
  if (nodes.length < 1 || nodes.length >= 100) return false;

  const ids = nodes.map((node) => node?.id);

  if (ids.some((id) => typeof id !== "string")) return false;
  if (new Set(ids).size !== ids.length) return false;

  return requiredConditions[automationId].every((id) =>
    nodes.some((node) =>
      node.id === id && node.type === "condition"
    )
  );
}

export function canInsertAutomationActionAfter(
  automationId,
  nodes,
  selectedId
) {
  if (!validContext(automationId, nodes)) return false;

  const index = nodes.findIndex((node) => node.id === selectedId);
  if (index < 0) return false;

  return !nodes.slice(index + 1).some((node) =>
    requiredConditions[automationId].includes(node.id)
  );
}

export function canDuplicateAutomationNode(
  automationId,
  nodes,
  selectedId
) {
  if (!canInsertAutomationActionAfter(
    automationId,
    nodes,
    selectedId
  )) return false;

  const node = nodes.find((item) => item.id === selectedId);

  return !isProtectedAutomationNode(automationId, node);
}
