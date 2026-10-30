
import * as React from "react";
import {
  List,
  ListOrdered
} from "lucide-react";
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from "lucide-react";
import {
  richRunsToHtml,
  type RichRun
} from "@/lib/templates/rich-runs";

// DIGITALE_RICH_TEXT_V2
interface Props {
  text: string;
  runs?: RichRun[];
  styles: Record<string, any>;
  onChange: (runs: RichRun[], text: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

function extractRuns(root: HTMLElement): RichRun[] {
  const runs: RichRun[] = [];

  function append(text: string, el: HTMLElement) {
    if (!text) return;

    const s = window.getComputedStyle(el);
    const decorations = s.textDecorationLine || "";

    runs.push({
      text,
      bold: Number(s.fontWeight) >= 600 ||
        ["bold", "bolder"].includes(s.fontWeight),
      italic: s.fontStyle === "italic",
      underline: decorations.includes("underline"),
      strike: decorations.includes("line-through"),
      color: s.color,
      background:
        s.backgroundColor === "rgba(0, 0, 0, 0)" ||
        s.backgroundColor === "transparent"
          ? undefined
          : s.backgroundColor,
      fontSize: s.fontSize,
      // DIGITALE_ALIGN_PERSISTENCE_V2
      align: (() => {
        // Procura o alinhamento explicito da linha,
        // incluindo SPAN, DIV, P e itens de lista.
        let current: HTMLElement | null = el;

        while (current && current !== root) {
          const inline = current.style.textAlign;

          if (
            inline === "left" ||
            inline === "center" ||
            inline === "right" ||
            inline === "justify"
          ) {
            return inline;
          }

          current = current.parentElement;
        }

        // Quando a linha herda o alinhamento do bloco,
        // usa o valor calculado da propria linha.
        const computed =
          window.getComputedStyle(el).textAlign;

        if (
          computed === "left" ||
          computed === "center" ||
          computed === "right" ||
          computed === "justify"
        ) {
          return computed;
        }

        const base =
          window.getComputedStyle(root).textAlign;

        if (
          base === "center" ||
          base === "right" ||
          base === "justify"
        ) {
          return base;
        }

        return "left";
      })()
    });
  }

  function visit(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent || "", node.parentElement || root);
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (node.tagName === "BR") {
      append("\n", node.parentElement || root);
      return;
    }

    // DIGITALE_TEXT_LISTS_V1
    // Converte itens de lista em linhas com marcadores
    // persistentes no texto e no HTML do email.
    if (node.tagName === "LI") {
      if (
        runs.length &&
        !runs[runs.length - 1]?.text.endsWith("\n")
      ) {
        append("\n", root);
      }

      const parent = node.parentElement;
      const ordered = parent?.tagName === "OL";

      const siblings = parent
        ? Array.from(parent.children).filter(
            child => child.tagName === "LI"
          )
        : [];

      const position = siblings.indexOf(node) + 1;
      const start = ordered
        ? Number(parent?.getAttribute("start") || "1")
        : 1;

      const prefix = ordered
        ? String(start + position - 1) + ". "
        : "• ";

      // DIGITALE_UNIFIED_LISTS_V4
      // Evita duplicar marcadores literais em listas HTML.
      append(prefix, node);

      const firstText = document.createTreeWalker(
        node, NodeFilter.SHOW_TEXT
      ).nextNode();

      const firstContent = firstText?.textContent || "";

      const duplicate = ordered
        ? /^\s*\d+\.\s+/.exec(firstContent)
        : /^\s*•\s+/.exec(firstContent);

      if (firstText && duplicate) {
        const originalText = firstText.textContent || "";
        firstText.textContent =
          originalText.slice(duplicate[0].length);

        node.childNodes.forEach(visit);

        firstText.textContent = originalText;
      } else {
        node.childNodes.forEach(visit);
      }

      return;
    }

    // DIGITALE_LINEBREAK_FIX_V2
    const paragraph =
      node !== root &&
      (
        ["P", "DIV"].includes(node.tagName) ||
        (
          node.tagName === "SPAN" &&
          window.getComputedStyle(node).display === "block"
        )
      );

    if (
      paragraph &&
      runs.length &&
      !runs[runs.length - 1]?.text.endsWith("\n")
    ) {
      append("\n", root);
    }

    if (paragraph) {
      const onlyPlaceholder =
        node.childNodes.length === 0 ||
        (
          node.childNodes.length === 1 &&
          node.firstChild instanceof HTMLElement &&
          node.firstChild.tagName === "BR"
        );

      if (onlyPlaceholder) {
        append("\n", node);
        return;
      }
    }

    node.childNodes.forEach(visit);
  }

  root.childNodes.forEach(visit);

  return runs;
}

export function RichTextInline({
  text, runs, styles, onChange,
  onFinish, onCancel
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  // DIGITALE_INDIVIDUAL_FONT_SIZE_V1
  const selectionRef = React.useRef<Range | null>(null);

  // DIGITALE_INLINE_HISTORY_FONT_V3
  const historyRef = React.useRef({
    undo: [] as string[],
    redo: [] as string[],
    last: "",
  });

  const skipSizeBlurRef = React.useRef(false);

  const restoreHtml = (html: string) => {
    const root = ref.current;
    if (!root) return;

    root.innerHTML = html;

    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(root);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);

    selectionRef.current = range.cloneRange();
    historyRef.current.last = html;

    const next = extractRuns(root);
    onChange(next, next.map(run => run.text).join(""));
    root.focus();
  };

  const undoInline = () => {
    const history = historyRef.current;
    const previous = history.undo.pop();
    if (previous === undefined) return;

    history.redo.push(history.last);
    restoreHtml(previous);
  };

  const redoInline = () => {
    const history = historyRef.current;
    const next = history.redo.pop();
    if (next === undefined) return;

    history.undo.push(history.last);
    restoreHtml(next);
  };


  // DIGITALE_WORD_SELECTION_FIX_V1
  const [fontSizeInput, setFontSizeInput] = React.useState(
    String(parseInt(String(styles.fontSize || "16"), 10) || 16)
  );

  const restoreSelection = () => {
    const root = ref.current;
    const saved = selectionRef.current;
    if (!root || !saved) return false;

    if (!root.contains(saved.commonAncestorContainer)) {
      return false;
    }

    const selection = window.getSelection();
    if (!selection) return false;

    try {
      selection.removeAllRanges();
      selection.addRange(saved.cloneRange());
      return true;
    } catch {
      return false;
    }
  };

  const rememberSelection = () => {
    const root = ref.current;
    const selection = window.getSelection();

    if (!root || !selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (
      root.contains(range.commonAncestorContainer)
    ) {
      selectionRef.current = range.cloneRange();
    }
  };

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = richRunsToHtml(runs, text);
    historyRef.current.last = ref.current.innerHTML;
    ref.current.focus();
  }, []);

  const sync = () => {
    const root = ref.current;
    if (!root) return;

    const history = historyRef.current;
    const html = root.innerHTML;

    if (html !== history.last) {
      history.undo.push(history.last);
      if (history.undo.length > 60) history.undo.shift();
      history.redo = [];
      history.last = html;
    }

    const next = extractRuns(root);
    onChange(next, next.map(run => run.text).join(""));
  };

  const applyFontSize = (value: number) => {
    const root = ref.current;
    if (!root || !Number.isFinite(value)) return;

    const px = Math.max(8, Math.min(72, Math.round(value)));

    if (!restoreSelection()) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    try {
      const fragment = range.extractContents();

      // Evita tamanhos antigos aninhados no trecho selecionado.
      fragment.querySelectorAll?.("[style]").forEach(node => {
        if (node instanceof HTMLElement) {
          node.style.removeProperty("font-size");
        }
      });

      fragment.querySelectorAll?.("font").forEach(node => {
        node.removeAttribute("size");
      });

      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.appendChild(fragment);
      range.insertNode(span);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);

      selection.removeAllRanges();
      selection.addRange(nextRange);

      selectionRef.current = nextRange.cloneRange();

      setFontSizeInput(String(px));
      sync();
    } catch (error) {
      console.error("Falha ao alterar tamanho:", error);
    }
  };

  const changeFontSize = (delta: number) => {
    const current = Number(fontSizeInput);
    const base = Number.isFinite(current) && current > 0
      ? current
      : parseInt(String(styles.fontSize || "16"), 10) || 16;

    applyFontSize(base + delta);
  };


  // DIGITALE_LIST_TOGGLE_V3
  // Alterna prefixos persistentes sem perder a formatação.
  const toggleTextList = (ordered: boolean): boolean => {
    const root = ref.current;
    if (!root) return false;

    restoreSelection();

    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0);

    if (!root.contains(range.commonAncestorContainer)) {
      return false;
    }

    // Listas HTML reais continuam usando a ação nativa.
    let parent: Node | null = range.startContainer;

    while (parent && parent !== root) {
      if (
        parent instanceof HTMLElement &&
        (parent.tagName === "LI" ||
         parent.tagName === "UL" ||
         parent.tagName === "OL")
      ) {
        return false;
      }
      parent = parent.parentNode;
    }

    const allText = root.textContent || "";

    const beforeStart = document.createRange();
    beforeStart.selectNodeContents(root);
    beforeStart.setEnd(
      range.startContainer,
      range.startOffset
    );

    const beforeEnd = document.createRange();
    beforeEnd.selectNodeContents(root);
    beforeEnd.setEnd(
      range.endContainer,
      range.endOffset
    );

    const start = beforeStart.toString().length;
    const end = beforeEnd.toString().length;

    const lines: Array<{
      start: number;
      end: number;
      prefix: string;
    }> = [];

    let cursor = 0;

    for (const line of allText.split("\n")) {
      const lineEnd = cursor + line.length;

      if (
        (start === end
          ? start >= cursor && start <= lineEnd
          : cursor < end && lineEnd >= start) &&
        line.trim()
      ) {
        const prefix =
          /^(\s*)(•\s*|\d+\.\s*)/.exec(line);

        lines.push({
          start: cursor,
          end: lineEnd,
          prefix: prefix
            ? prefix[2]
            : ""
        });
      }

      cursor = lineEnd + 1;
    }

    if (!lines.length) return false;

    const isTarget = (prefix: string) =>
      ordered
        ? /^\d+\.\s*$/.test(prefix)
        : /^•\s*$/.test(prefix);

    const removeOnly = lines.every(line =>
      isTarget(line.prefix)
    );

    const nodes: Array<{
      node: Text;
      start: number;
      end: number;
    }> = [];

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    let node: Node | null;
    let offset = 0;

    while ((node = walker.nextNode())) {
      const length = node.textContent?.length || 0;

      nodes.push({
        node: node as Text,
        start: offset,
        end: offset + length
      });

      offset += length;
    }

    const pointAt = (position: number) => {
      for (const entry of nodes) {
        if (
          position >= entry.start &&
          position <= entry.end
        ) {
          return {
            node: entry.node,
            offset: position - entry.start
          };
        }
      }
      return null;
    };

    // Edita de baixo para cima para não deslocar
    // as posições das linhas anteriores.
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      const rawLine = allText.slice(
        line.start, line.end
      );

      const indent =
        /^(\s*)/.exec(rawLine)?.[1] || "";

      const prefixStart =
        line.start + indent.length;

      if (line.prefix) {
        const p1 = pointAt(prefixStart);
        const p2 = pointAt(
          prefixStart + line.prefix.length
        );

        if (p1 && p2) {
          const removal = document.createRange();
          removal.setStart(p1.node, p1.offset);
          removal.setEnd(p2.node, p2.offset);
          removal.deleteContents();
        }
      }

      if (!removeOnly) {
        const newPrefix = ordered
          ? `${i + 1}. `
          : "• ";

        // Recalcula a posição após remover
        // o prefixo anterior.
        const currentWalker =
          document.createTreeWalker(
            root, NodeFilter.SHOW_TEXT
          );

        let current: Node | null;
        let consumed = 0;
        let insertion: {
          node: Text;
          offset: number;
        } | null = null;

        while ((current = currentWalker.nextNode())) {
          const len = current.textContent?.length || 0;

          if (
            prefixStart >= consumed &&
            prefixStart <= consumed + len
          ) {
            insertion = {
              node: current as Text,
              offset: prefixStart - consumed
            };
            break;
          }

          consumed += len;
        }

        if (insertion) {
          const insertionRange =
            document.createRange();

          insertionRange.setStart(
            insertion.node,
            insertion.offset
          );
          insertionRange.collapse(true);
          insertionRange.insertNode(
            document.createTextNode(newPrefix)
          );
        }
      }
    }

    // Atualiza o histórico e o conteúdo persistente.
    selectionRef.current = null;
    root.focus();
    sync();

    return true;
  };


  // DIGITALE_LIST_ENTER_CONTINUATION_V1
  // Enter continua marcadores textuais persistentes.
  const continueListOnEnter = (
    event: React.KeyboardEvent<HTMLDivElement>
  ): boolean => {
    if (
      event.key !== "Enter" ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return false;
    }

    const root = ref.current;
    const selection = window.getSelection();

    if (!root || !selection?.rangeCount) {
      return false;
    }

    const range = selection.getRangeAt(0);

    if (
      !range.collapsed ||
      !root.contains(range.startContainer)
    ) {
      return false;
    }

    // Deixa o navegador tratar listas HTML reais.
    let node: Node | null = range.startContainer;

    while (node && node !== root) {
      if (
        node instanceof HTMLElement &&
        ["LI", "UL", "OL"].includes(node.tagName)
      ) {
        return false;
      }
      node = node.parentNode;
    }

    // Obtém o texto até a posição do cursor.
    const before = document.createRange();

    before.selectNodeContents(root);
    before.setEnd(
      range.startContainer,
      range.startOffset
    );

    const previousText = before.toString();
    const currentLine = previousText.split("\n").pop() || "";

    const bullet = /^(\s*)•\s+/.exec(currentLine);
    const numbered = /^(\s*)(\d+)\.\s+/.exec(currentLine);

    if (!bullet && !numbered) {
      return false;
    }

    const prefix = bullet
      ? `${bullet[1]}• `
      : `${numbered![1]}${Number(numbered![2]) + 1}. `;

    // Enter sobre um tópico vazio encerra a lista.
    const emptyItem = bullet
      ? currentLine.trim() === "•"
      : /^\d+\.$/.test(currentLine.trim());

    if (emptyItem) {
      event.preventDefault();
      event.stopPropagation();

      const removal = range.cloneRange();
      removal.setStart(
        range.startContainer,
        Math.max(
          0,
          range.startOffset - currentLine.length
        )
      );

      try {
        removal.deleteContents();

        selection.removeAllRanges();
        selection.addRange(removal);

        document.execCommand(
          "insertText", false, "\n"
        );

        rememberSelection();
        sync();
      } catch {
        // Se a seleção cruzar nós diferentes,
        // não altera outros parágrafos.
      }

      return true;
    }

    event.preventDefault();
    event.stopPropagation();

    // Mantém a lista como texto com quebras de linha
    // compatíveis com a persistência atual do editor.
    const inserted = document.execCommand(
      "insertText",
      false,
      "\n" + prefix
    );

    if (!inserted) {
      const insertRange = selection.getRangeAt(0);

      const textNode = document.createTextNode(
        "\n" + prefix
      );

      insertRange.insertNode(textNode);

      const nextRange = document.createRange();
      nextRange.setStart(
        textNode,
        textNode.textContent?.length || 0
      );
      nextRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(nextRange);
    }

    rememberSelection();
    sync();

    return true;
  };


  // DIGITALE_UNIFIED_LISTS_V4
  // Remove os marcadores já persistidos como texto.
  // Listas HTML continuam sendo controladas pelo navegador.
  const togglePersistentList = (command: string): boolean => {
    const root = ref.current;
    const selection = window.getSelection();

    if (!root || !selection?.rangeCount) return false;

    const selected = selection.getRangeAt(0);

    if (!root.contains(selected.commonAncestorContainer)) {
      return false;
    }

    // Listas HTML reais são alternadas pelo execCommand.
    let current: Node | null = selected.startContainer;

    while (current && current !== root) {
      if (
        current instanceof HTMLElement &&
        ["UL", "OL", "LI"].includes(current.tagName)
      ) {
        return false;
      }
      current = current.parentNode;
    }

    const ordered = command === "insertOrderedList";

    const matchesPrefix = (text: string) =>
      ordered
        ? /^[ \t]*\d+\.[ \t]+/.test(text)
        : /^[ \t]*•[ \t]+/.test(text);

    const prefixRegex = ordered
      ? /^[ \t]*\d+\.[ \t]+/
      : /^[ \t]*•[ \t]+/;

    const walker = document.createTreeWalker(
      root, NodeFilter.SHOW_TEXT
    );

    const candidates: Text[] = [];
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const textNode = node as Text;

      if (!selected.intersectsNode(textNode)) continue;

      const content = textNode.textContent || "";

      // Reconhece prefixos no início de nós de texto
      // ou no começo de linhas internas.
      if (
        matchesPrefix(content) ||
        content.split("\n").some(matchesPrefix)
      ) {
        candidates.push(textNode);
      }
    }

    if (!candidates.length) return false;

    let changed = false;

    // Edita de trás para frente, evitando que a posição
    // de um prefixo altere a posição de outro.
    for (const textNode of candidates.reverse()) {
      const content = textNode.textContent || "";

      const lines = content.split("\n");
      const newText = lines.map(line =>
        line.replace(prefixRegex, "")
      ).join("\n");

      if (newText !== content) {
        textNode.textContent = newText;
        changed = true;
      }
    }

    if (!changed) return false;

    // Mantém o cursor dentro da área editável.
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    selectionRef.current = range.cloneRange();

    root.focus();
    sync();

    return true;
  };

  const format = (name: string, value?: string) => {
    const root = ref.current;
    if (!root) return;

    root.focus();

    const saved = selectionRef.current;
    if (saved && root.contains(saved.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(saved.cloneRange());
    }

    // DIGITALE_NATIVE_MULTI_LIST_V1
    // Listas permanecem estruturadas durante a edição.
    // Enter cria um novo LI automaticamente.
    // Um segundo clique no botão desativa a lista.
    //
    // O extractRuns existente transforma os LI em
    // marcadores persistentes quando o texto é salvo.
    if (
      name === "insertUnorderedList" ||
      name === "insertOrderedList"
    ) {
      if (togglePersistentList(name)) {
        return;
      }

      document.execCommand(name, false, value);

      const currentSelection = window.getSelection();
      if (currentSelection?.rangeCount) {
        selectionRef.current =
          currentSelection.getRangeAt(0).cloneRange();
      }

      sync();
      return;
    }

    document.execCommand(name, false, value);

    const selection = window.getSelection();
    if (selection?.rangeCount) {
      selectionRef.current =
        selection.getRangeAt(0).cloneRange();
    }

    sync();
  };

  const action = (
    label: string,
    name: string,
    display?: React.ReactNode
  ) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={event => event.preventDefault()}
      onClick={event => {
        event.stopPropagation();
        format(name);
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 [&_svg]:h-[13px] [&_svg]:w-[13px]"
    >
      {display || label}
    </button>
  );

  return (
    <div
      className="relative w-full"
      onClick={event => event.stopPropagation()}
    >
      <div
        className="relative z-[80] mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
        onMouseDown={event => {
          if (!(event.target instanceof HTMLInputElement)) {
            event.preventDefault();
          }
        }}
      >
        {action("Negrito", "bold", <Bold size={16} />)}
        {action("Itálico", "italic", <Italic size={16} />)}
        {action("Sublinhado", "underline", <Underline size={16} />)}
        {action("Tachado", "strikeThrough", <Strikethrough size={16} />)}

        <span className="mx-1 h-6 w-px bg-slate-300" />

        {action(
          "Lista com marcadores",
          "insertUnorderedList",
          <List size={16} />
        )}

        {action(
          "Lista numerada",
          "insertOrderedList",
          <ListOrdered size={16} />
        )}

        <label className="flex items-center gap-1 text-xs text-slate-900">
          <span className="text-[11px] font-medium">Tamanho</span>
          <button
            type="button"
            title="Diminuir tamanho da fonte"
            aria-label="Diminuir fonte"
            onMouseDown={event => event.preventDefault()}
            onClick={event => {
              event.stopPropagation();
              changeFontSize(-1);
            }}
            className="rounded px-1 text-xs hover:bg-slate-100"
          >
            A-
          </button>
          <button
            type="button"
            title="Aumentar tamanho da fonte"
            aria-label="Aumentar fonte"
            onMouseDown={event => event.preventDefault()}
            onClick={event => {
              event.stopPropagation();
              changeFontSize(1);
            }}
            className="rounded px-1 text-xs hover:bg-slate-100"
          >
            A+
          </button>
          <input
            type="number"
            min={8}
            max={72}
            step={1}
            value={fontSizeInput}
            title="Tamanho do texto selecionado"
            aria-label="Tamanho individual da fonte"
            onMouseDown={() => {
              rememberSelection();
              skipSizeBlurRef.current = false;
            }}
            onChange={event =>
              setFontSizeInput(event.target.value)
            }
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                const value = Number(fontSizeInput);
                if (Number.isFinite(value)) {
                  applyFontSize(value);
                  skipSizeBlurRef.current = true;
                }
              }
            }}
            onBlur={() => {
              if (skipSizeBlurRef.current) {
                skipSizeBlurRef.current = false;
                return;
              }

              const value = Number(fontSizeInput);
              if (fontSizeInput.trim() &&
                  Number.isFinite(value)) {
                applyFontSize(value);
              }
            }}
            onClick={event => event.stopPropagation()}
            className="h-7 w-12 rounded-md border border-slate-200 bg-white px-1 text-center text-xs text-slate-800 outline-none focus:border-orange-400"
          />
          <span className="text-[10px] text-slate-500">px</span>
        </label>

        <label
          title="Cor do texto"
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1"
        >
          <Type size={17} className="text-slate-700" />
          <input
            type="color"
            defaultValue="#000000"
            title="Cor do texto"
            onChange={event =>
              format("foreColor", event.target.value)
            }
            className="h-7 w-7"
          />
        </label>

        <label
          title="Marca-texto"
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1"
        >
          <Highlighter size={17} className="text-slate-700" />
          <input
            type="color"
            defaultValue="#ffff00"
            title="Cor do destaque"
            onChange={event =>
              format("hiliteColor", event.target.value)
            }
            className="h-7 w-7"
          />
        </label>

        <span className="mx-1 h-6 w-px bg-slate-300" />

        {action(
          "Alinhar à esquerda", "justifyLeft",
          <AlignLeft size={16} />
        )}
        {action(
          "Centralizar parágrafo", "justifyCenter",
          <AlignCenter size={16} />
        )}
        {action(
          "Alinhar à direita", "justifyRight",
          <AlignRight size={16} />
        )}
        {action(
          "Justificar parágrafo", "justifyFull",
          <AlignJustify size={16} />
        )}

        <button
          type="button"
          title="Desfazer (Ctrl+Z)"
          aria-label="Desfazer"
          onMouseDown={event => event.preventDefault()}
          onClick={event => {
            event.stopPropagation();
            undoInline();
          }}
          className="h-7 w-7 rounded border border-slate-200 text-sm hover:bg-slate-100"
        >
          ↶
        </button>
        <button
          type="button"
          title="Refazer (Ctrl+Y)"
          aria-label="Refazer"
          onMouseDown={event => event.preventDefault()}
          onClick={event => {
            event.stopPropagation();
            redoInline();
          }}
          className="h-7 w-7 rounded border border-slate-200 text-sm hover:bg-slate-100"
        >
          ↷
        </button>
        <button
          type="button"
          onMouseDown={event => event.preventDefault()}
          onClick={event => {
            event.stopPropagation();
            onFinish();
          }}
          className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
        >
          Concluir
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Editar texto diretamente no template"
        aria-multiline="true"
        onClick={event => event.stopPropagation()}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onInput={() => sync()}
        onPaste={event => {
          event.preventDefault();
          const plain = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, plain);
          sync();
        }}
        onKeyDown={event => {
          if ((event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "z") {
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) redoInline();
            else undoInline();
            return;
          }

          if ((event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "y") {
            event.preventDefault();
            event.stopPropagation();
            redoInline();
            return;
          }

          if (continueListOnEnter(event)) {
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
          ) {
            event.preventDefault();
            onFinish();
          }
        }}
        onBlur={event => {
          const parent = event.currentTarget.parentElement;
          if (
            !parent?.contains(event.relatedTarget as Node)
          ) {
            onFinish();
          }
        }}
        /* DIGITALE_LIST_LIVE_PREVIEW_V1 */
        className="min-h-[1.5em] w-full whitespace-pre-wrap break-words outline outline-2 outline-orange-500 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:list-item [&_li]:my-0"
        style={{
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize || "16px",
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight || "1.5",
          color: styles.color || "#0f172a",
          textAlign: styles.textAlign || "left",
          overflowWrap: "break-word"
        }}
      />
    </div>
  );
}
