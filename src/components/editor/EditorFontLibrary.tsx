import * as React from "react";
import { Loader2, Upload, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadEditorFont,
  listEditorFonts,
} from "@/lib/disparo-editor-fonts.functions";

// DIGITALE_EDITOR_FONT_LIBRARY_V1
export type EditorFontItem = {
  id: string;
  name: string;
  format: string;
  size: number;
  createdAt: string;
};

const MAX_BYTES = 2 * 1024 * 1024;

export function editorFontFamily(id: string): string {
  const hash = id.split(".")[0] ?? "";
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return "Arial, Helvetica, sans-serif";
  }
  return `"DigitaleFont-${hash}", Arial, Helvetica, sans-serif`;
}

function fontRule(item: EditorFontItem): string {
  if (!/^[a-f0-9]{64}\.(woff2|woff|ttf)$/.test(item.id)) {
    return "";
  }

  const hash = item.id.split(".")[0];
  const format = item.id.endsWith(".woff2")
    ? "woff2"
    : item.id.endsWith(".woff")
      ? "woff"
      : "truetype";

  return `@font-face {
    font-family: "DigitaleFont-${hash}";
    src: url("/editor-fonts/${item.id}") format("${format}");
    font-display: swap;
  }`;
}

// DIGITALE_GLOBAL_FONT_PREVIEW_V1
export function EditorFontStyles({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [items, setItems] = React.useState<EditorFontItem[]>([]);

  React.useEffect(() => {
    let active = true;

    void listEditorFonts()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        // Mantem os estilos previamente carregados.
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return <style>{items.map(fontRule).join("\n")}</style>;
}

type Props = {
  onSelect: (item: EditorFontItem) => void;
  onUploaded?: () => void;
};

export function EditorFontLibrary({ onSelect, onUploaded }: Props) {
  const [items, setItems] = React.useState<EditorFontItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEditorFonts();
      setItems(result);
      setError("");
    } catch {
      setError("Não foi possível carregar as fontes.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        if (!/\.(woff2|woff|ttf)$/i.test(file.name)) {
          throw new Error(`Formato não permitido: ${file.name}`);
        }

        if (!file.size || file.size > MAX_BYTES) {
          throw new Error(`Fonte deve ter até 2 MB: ${file.name}`);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("Falha ao ler o arquivo."));
          reader.readAsDataURL(file);
        });

        await uploadEditorFont({
          data: {
            fileName: file.name,
            base64,
          },
        });
      }

      await refresh();
      onUploaded?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao importar fonte."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <style>
        {items.map(fontRule).join("\n")}
      </style>

      <input
        ref={inputRef}
        type="file"
        accept=".woff2,.woff,.ttf"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {uploading ? "Importando..." : "Importar fonte"}
      </Button>

      <p className="text-[11px] text-muted-foreground">
        Arquivos WOFF2, WOFF ou TTF, até 2 MB cada.
      </p>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando fontes...
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border p-3 text-xs text-muted-foreground">
          <Type className="h-4 w-4" />
          Nenhuma fonte personalizada importada.
        </div>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full rounded-md border bg-white p-3 text-left hover:bg-slate-50"
            >
              <span className="block truncate text-xs font-medium">
                {item.name}
              </span>
              <span className="block text-[10px] uppercase text-muted-foreground">
                {item.format}
              </span>
              <span
                className="mt-2 block text-lg"
                style={{ fontFamily: editorFontFamily(item.id) }}
              >
                Aa Bb Cc 123
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
