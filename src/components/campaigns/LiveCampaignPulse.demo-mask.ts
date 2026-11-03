
// DIGITALE_DEMO_MASK_V4
// Visualizacao ficticia identificada.
// Nao modifica banco de dados ou fila SMTP.

const campaignName = "Dia Fisiculturista";
const maskId = "digitale-demo-mask-v4";

const metrics: Array<[string, string, string]> = [
  ["Destinatários previstos", "17.434", "#315e91"],
  ["Tentativas registradas", "17.434", "#315e91"],
  ["Aceitos pela API", "17.251", "#315e91"],
  ["Na fila SMTP", "0", "#64748b"],
  ["Aceitos pelo SMTP", "17.251", "#315cff"],
  ["Adiados", "0", "#c38a35"],
  ["Devolvidos", "164", "#cc5757"],
  ["Entregues confirmados", "17.251", "#21856b"],
  ["Falhas iniciais", "19", "#cc5757"],
  ["Ritmo do motor SMTP", "0/min", "#21856b"],
  ["Aberturas", "14.652", "#21856b"],
  ["Leituras", "9.456", "#315e91"],
  ["Cliques", "167", "#7c3aed"],
  ["Não lidos", "2.599", "#64748b"]
];

function create(tag: string, text = ""): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function findPanel(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    "div,span,h1,h2,h3,h4,p,strong"
  );

  for (const heading of nodes) {
    if (
      heading.children.length !== 0 ||
      heading.textContent?.trim() !==
        "Monitoramento em tempo real"
    ) continue;

    let panel = heading.parentElement;

    while (panel && panel !== document.body) {
      const content = panel.textContent || "";

      if (
        content.includes("Destinatários previstos") &&
        content.includes("Aceitos pelo SMTP") &&
        content.includes("Progresso da preparação")
      ) {
        let ancestor: HTMLElement | null = panel;

        while (ancestor && ancestor !== document.body) {
          const text = ancestor.textContent || "";

          if (
            text.includes("Detalhes do envio") &&
            text.includes(campaignName)
          ) {
            return panel;
          }

          ancestor = ancestor.parentElement;
        }

        return null;
      }

      panel = panel.parentElement;
    }
  }

  return null;
}

function buildMask(): HTMLElement {
  const root = create("section");
  root.id = maskId;

  root.style.cssText =
    "padding:16px;background:#fff;" +
    "border:1px solid #d9e0ea;border-radius:16px;";

  const header = create("div");
  header.style.cssText =
    "display:flex;justify-content:space-between;" +
    "align-items:center;gap:12px;flex-wrap:wrap;";

  const title = create(
    "strong",
    "Monitoramento em tempo real"
  );
  title.style.cssText =
    "font-size:16px;color:#173452;";

  const badge = create(
    "span",
    "SIMULAÇÃO · DADOS FICTÍCIOS"
  );
  badge.style.cssText =
    "font-size:12px;font-weight:700;" +
    "color:#5b21b6;background:#ede9fe;" +
    "border-radius:30px;padding:7px 11px;";

  header.append(title, badge);
  root.append(header);

  const subtitle = create(
    "p",
    "Prévia demonstrativa. Os números não representam " +
    "o resultado real da campanha."
  );
  subtitle.style.cssText =
    "font-size:12px;color:#64748b;margin:10px 0 18px;";
  root.append(subtitle);

  const grid = create("div");
  grid.style.cssText =
    "display:grid;grid-template-columns:" +
    "repeat(2,minmax(0,1fr));gap:12px;";

  for (const [name, value, color] of metrics) {
    const card = create("div");
    card.style.cssText =
      "border:1px solid #d9e0ea;" +
      "border-radius:15px;padding:14px 12px;";

    const label = create("div", name);
    label.style.cssText =
      "font-size:12px;color:#334155;" +
      "margin-bottom:12px;";

    const number = create("strong", value);
    number.style.cssText =
      "display:block;font-size:25px;" +
      "font-weight:700;color:" + color + ";";

    card.append(label, number);
    grid.append(card);
  }

  root.append(grid);

  const progress = create("div");
  progress.style.cssText =
    "display:flex;justify-content:space-between;" +
    "font-size:13px;margin:20px 0 10px;";

  progress.append(
    create("span", "Progresso da preparação (simulado)"),
    create("strong", "100%")
  );

  root.append(progress);

  const track = create("div");
  track.style.cssText =
    "height:12px;background:#e5eaf1;" +
    "border-radius:20px;overflow:hidden;";

  const fill = create("div");
  fill.style.cssText =
    "height:100%;width:100%;" +
    "border-radius:20px;background:#2563eb;";

  track.append(fill);
  root.append(track);

  const footer = create(
    "p",
    "Modo demonstração — progresso e métricas simulados."
  );
  footer.style.cssText =
    "font-size:12px;color:#64748b;margin-top:12px;";

  root.append(footer);

  return root;
}

let originalPanel: HTMLElement | null = null;
let installed = false;

function refresh(): void {
  const mask = document.getElementById(maskId);
  const panel = findPanel();

  if (!panel) {
    if (mask) mask.remove();

    if (originalPanel) {
      originalPanel.style.removeProperty("display");
      originalPanel = null;
    }
    return;
  }

  if (mask && mask.isConnected) {
    panel.style.display = "none";
    return;
  }

  if (!panel.parentElement) return;

  const demo = buildMask();

  panel.parentElement.insertBefore(demo, panel);
  panel.style.display = "none";

  originalPanel = panel;
}

export function installDigitaleDemoMask(): void {
  if (typeof window === "undefined") return;
  if (installed) return;

  installed = true;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      refresh,
      { once: true }
    );
  } else {
    refresh();
  }

  window.setInterval(refresh, 500);
}
