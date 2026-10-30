
// DIGITALE_DEMO_MASK_V2
// Exclusivamente visual: não altera APIs nem banco de dados.

const targetCampaign = "Dia Fisiculturista";
const maskAttribute = "data-digitale-demo-mask";

const metrics: Array<[string, string, string]> = [
  ["Destinatários previstos", "17.434", "#315e91"],
  ["Tentativas registradas", "17.434", "#315e91"],
  ["Aceitos pela API", "17.251", "#315e91"],
  ["Na fila SMTP", "0", "#64748b"],
  ["Aceitos pelo SMTP", "17.251", "#305cff"],
  ["Adiados", "0", "#c38a35"],
  ["Devolvidos", "164", "#cc5757"],
  ["Entregues confirmados", "17.251", "#21856b"],
  ["Falhas iniciais", "19", "#cc5757"],
  ["Ritmo do motor SMTP", "0/min", "#21856b"],
  ["Aberturas", "14.652", "#21856b"],
  ["Leituras", "9.456", "#315e91"],
  ["Cliques", "167", "#7c4dff"],
  ["Não lidos", "2.599", "#64748b"]
];

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function locatePanel(): HTMLElement | null {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,div,p,span")
  ).filter(el =>
    el.children.length === 0 &&
    el.textContent?.trim() === "Monitoramento em tempo real"
  );

  for (const heading of headings) {
    let modal: HTMLElement | null = heading.closest(
      '[role="dialog"]'
    );

    if (!modal) {
      let ancestor = heading.parentElement;
      while (ancestor && ancestor !== document.body) {
        const content = ancestor.textContent || "";
        if (
          content.includes("Detalhes do envio") &&
          content.includes(targetCampaign)
        ) {
          modal = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }
    }

    if (!modal || !(modal.textContent || "").includes(targetCampaign)) {
      continue;
    }

    let panel = heading.parentElement;

    while (panel && panel !== modal) {
      const content = panel.textContent || "";
      if (
        content.includes("Destinatários previstos") &&
        content.includes("Falhas iniciais") &&
        content.includes("Aceitos pelo SMTP")
      ) {
        return panel;
      }
      panel = panel.parentElement;
    }
  }

  return null;
}

function createDemoPanel(): HTMLElement {
  const root = make("section");
  root.setAttribute(maskAttribute, "true");
  root.setAttribute("aria-label", "Simulação demonstrativa da campanha");
  root.style.cssText =
    "background:white;border:1px solid #d9e0ea;border-radius:16px;" +
    "padding:16px;margin:0 0 16px 0;font-family:inherit;";

  const heading = make("div");
  heading.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;" +
    "gap:12px;flex-wrap:wrap;margin-bottom:6px;";

  const title = make("strong", "Monitoramento em tempo real");
  title.style.cssText = "font-size:16px;color:#142f50";

  const badge = make("span", "● Dados simulados");
  badge.style.cssText =
    "background:#ede9fe;color:#5b21b6;border-radius:99px;" +
    "padding:6px 12px;font-size:12px;font-weight:600;";

  heading.append(title, badge);
  root.appendChild(heading);

  const subtitle = make(
    "p",
    "Prévia demonstrativa · Indicadores fictícios, sem alteração dos registros reais."
  );
  subtitle.style.cssText =
    "font-size:12px;color:#64748b;margin:0 0 16px;";
  root.appendChild(subtitle);

  const grid = make("div");
  grid.style.cssText =
    "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;";

  for (const [label, value, color] of metrics) {
    const card = make("div");
    card.style.cssText =
      "border:1px solid #d9e0ea;border-radius:16px;" +
      "padding:14px 12px;min-width:0;";

    const labelElement = make("div", label);
    labelElement.style.cssText =
      "color:#334155;font-size:12px;margin-bottom:12px;";

    const valueElement = make("strong", value);
    valueElement.style.cssText =
      `color:${color};font-size:25px;font-weight:700;`;

    card.append(labelElement, valueElement);
    grid.appendChild(card);
  }

  root.appendChild(grid);

  const progressLabel = make("div");
  progressLabel.style.cssText =
    "display:flex;justify-content:space-between;" +
    "font-size:13px;margin-top:20px;margin-bottom:10px;";
  progressLabel.append(
    make("span", "Progresso demonstrativo"),
    make("span", "100%")
  );
  root.appendChild(progressLabel);

  const track = make("div");
  track.style.cssText =
    "height:12px;border-radius:99px;background:#e5eaf1;overflow:hidden;";

  const fill = make("div");
  fill.style.cssText =
    "width:100%;height:100%;background:#2563eb;border-radius:99px;";

  track.appendChild(fill);
  root.appendChild(track);

  const footnote = make(
    "p",
    "Esta visualização não representa entregas, leituras ou cliques comprovados."
  );
  footnote.style.cssText =
    "font-size:12px;color:#64748b;margin-top:12px;";
  root.appendChild(footnote);

  return root;
}

function applyDemoMask(): void {
  const existing = document.querySelector<HTMLElement>(
    `[${maskAttribute}="true"]`
  );

  if (existing) {
    const adjacent = existing.nextElementSibling as HTMLElement | null;
    const activeDialog = existing.closest('[role="dialog"]');

    if (
      !existing.isConnected ||
      (activeDialog &&
        !(activeDialog.textContent || "").includes(targetCampaign))
    ) {
      if (adjacent) adjacent.style.removeProperty("display");
      existing.remove();
    }
    return;
  }

  const panel = locatePanel();
  if (!panel || !panel.parentElement) return;

  const simulation = createDemoPanel();
  panel.parentElement.insertBefore(simulation, panel);
  panel.style.display = "none";
}

if (typeof window !== "undefined") {
  window.setInterval(applyDemoMask, 750);
  window.addEventListener("DOMContentLoaded", applyDemoMask);
}
