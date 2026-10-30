
// DIGITALE_RICH_TEXT_V2
export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  background?: string;
  fontSize?: string;
  // DIGITALE_RICH_ALIGN_V1
  align?: "left" | "center" | "right" | "justify";
}

const escape = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function color(value: unknown): string {
  const c = String(value ?? "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
  if (/^rgba?\([\d.,%\s]+\)$/i.test(c)) return c;
  return "";
}

export function richRunsToHtml(
  runs: RichRun[] | undefined,
  fallback: string,
  emailMode = false
): string {
  if (!Array.isArray(runs) || !runs.length) {
    return escape(fallback).replace(/\r?\n/g, "<br>");
  }

  const renderRun = (run: RichRun) => {
    const styles: string[] = [];

    if (run.bold) styles.push("font-weight:bold");
    if (run.italic) styles.push("font-style:italic");

    const decorations = [
      run.underline ? "underline" : "",
      run.strike ? "line-through" : ""
    ].filter(Boolean);

    if (decorations.length) {
      styles.push("text-decoration:" + decorations.join(" "));
    }

    const fg = color(run.color);
    const bg = color(run.background);
    if (fg) styles.push("color:" + fg);
    if (bg) styles.push("background-color:" + bg);

    const fontSize = String(run.fontSize ?? "");
    if (/^(?:[8-9]|[1-6][0-9]|7[0-2])px$/.test(fontSize)) {
      styles.push("font-size:" + fontSize);
    }

    const safe = escape(run.text).replace(/\r?\n/g, "<br>");

    return styles.length
      ? `<span style="${styles.join(";")}">${safe}</span>`
      : safe;
  };

  // Agrupa as linhas mantendo seus alinhamentos.
  // Span com display:block funciona também dentro
  // dos wrappers já existentes no editor.
  const lines: Array<{
    align: RichRun["align"];
    runs: RichRun[];
  }> = [];

  let current: RichRun[] = [];
  let currentAlign: RichRun["align"] = undefined;

  for (const run of runs) {
    const parts = String(run.text ?? "").split(/\r?\n/);

    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push({
          align: currentAlign,
          runs: current
        });
        current = [];
        currentAlign = run.align;
      }

      if (!current.length) {
        currentAlign = run.align;
      }

      if (parts[i]) {
        current.push({ ...run, text: parts[i]! });
      }
    }
  }

  lines.push({ align: currentAlign, runs: current });

  return lines.map(line => {
    const align = ["left", "center", "right", "justify"]
      .includes(String(line.align))
        ? line.align
        : "inherit";

    const content = line.runs.map(renderRun).join("") || (emailMode ? "&nbsp;" : "<br>");

    // DIGITALE_OUTLOOK_RICH_BREAKS_V3
      if (emailMode) {
        return `<span style="text-align:${align};">${content || "&nbsp;"}</span>`;
      }

      return `<span style="display:block;text-align:${align};">${content}</span>`;
    }).join(emailMode ? "<br />" : "<!--[if mso]><br><![endif]-->");
}
