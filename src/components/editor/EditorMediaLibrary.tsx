import * as React from "react";
import { ImagePlus, Search, Loader2, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  uploadEditorImage,
  listEditorImages,
} from "@/lib/disparo-editor-media.functions";

const BASE = "https://disparo.digitaletextil.com.br";
const MAX_BYTES = 5 * 1024 * 1024;

type MediaItem = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
};

type Props = {
  onSelect: (url: string) => void;
};

export function EditorMediaLibrary({ onSelect }: Props) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEditorImages();
      setItems(result);
      setError("");
    } catch {
      setError("Não foi possível carregar a biblioteca.");
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
        if (
          !["image/jpeg", "image/png", "image/webp"]
            .includes(file.type)
        ) {
          throw new Error(
            `Formato não permitido: ${file.name}`
          );
        }

        if (file.size > MAX_BYTES) {
          throw new Error(
            `Imagem maior que 5 MB: ${file.name}`
          );
        }

        const base64 = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(String(reader.result));
            reader.onerror = () =>
              reject(new Error("Falha ao ler imagem."));
            reader.readAsDataURL(file);
          }
        );

        await uploadEditorImage({
          data: {
            fileName: file.name,
            base64,
          },
        });
      }

      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao enviar imagem."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) =>
          void handleFiles(event.target.files)
        }
      />

      <Button
        type="button"
        className="w-full gap-2"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {uploading ? "Enviando..." : "Enviar imagens"}
      </Button>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar na biblioteca"
          className="pl-9"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <Images className="mx-auto mb-2 h-8 w-8" />
          <p className="text-xs">
            Nenhuma imagem encontrada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((item) => {
            const url = `${BASE}/editor-media/${item.id}`;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(url)}
                className="overflow-hidden rounded-lg border bg-white text-left transition hover:border-orange-500 hover:ring-2 hover:ring-orange-100"
                title="Inserir imagem no template"
              >
                <img
                  src={url}
                  alt={item.name}
                  loading="lazy"
                  className="h-24 w-full object-contain bg-slate-50"
                />
                <div className="truncate px-2 py-1 text-[10px] text-slate-500">
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
