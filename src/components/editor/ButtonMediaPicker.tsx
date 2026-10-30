import * as React from "react";
import { FolderOpen, Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { EditorMediaLibrary } from "./EditorMediaLibrary";
import { uploadButtonImage } from "@/lib/disparo-button-images.functions";
import {
  uploadEditorPdf,
  listEditorPdfs
} from "@/lib/disparo-editor-pdfs.functions";

const BASE = "https://disparo.digitaletextil.com.br";
const MAX_PDF = 25 * 1024 * 1024;

interface Props {
  onSelect: (url: string) => void;
}

type PdfItem = {
  id: string;
  url: string;
  fileName: string;
  size: number;
  createdAt: string;
};

function validLink(raw: string) {
  try {
    const url = new URL(raw);
    return (
      url.origin === BASE &&
      (
        /^\/editor-pdfs\/[a-f0-9]{64}\.pdf$/.test(url.pathname) ||
        /^\/editor-media\/[a-f0-9]{64}\.(jpg|png|webp)$/.test(url.pathname) ||
        /^\/button-gallery\/[0-9a-f-]{36}$/.test(url.pathname)
      )
    );
  } catch {
    return false;
  }
}

async function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(
      new Error("Nao foi possivel ler o PDF.")
    );
    reader.readAsDataURL(file);
  });
}

export function ButtonMediaPicker({ onSelect }: Props) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"images" | "pdf" | "image-preview">("pdf");
  const [items, setItems] = React.useState<PdfItem[]>([]);
  const [selected, setSelected] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(async () => {
    try {
      const result = await listEditorPdfs();
      setItems(result as PdfItem[]);
    } catch {
      setError("Nao foi possivel carregar os PDFs.");
    }
  }, []);

  React.useEffect(() => {
    if (open && tab === "pdf") void refresh();
  }, [open, tab, refresh]);

  async function upload(file?: File) {
    if (!file || busy) return;

    setError("");
    setBusy(true);

    try {
      if (!/\.pdf$/i.test(file.name) || file.size > MAX_PDF) {
        throw new Error("Selecione um PDF de ate 25 MB.");
      }

      const base64 = await readDataUrl(file);
      const result = await uploadEditorPdf({
        data: { fileName: file.name, base64 }
      });

      if (!validLink(result.url)) {
        throw new Error("Link de download invalido.");
      }

      setSelected(result.url);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha no upload."
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }


  async function uploadPreviewImage(file?: File) {
    if (!file || busy) return;
    setError("");
    setBusy(true);
    try {
      if (file.size > 15 * 1024 * 1024)
        throw new Error("A imagem deve ter no maximo 15 MB.");
      const base64 = await readDataUrl(file);
      const result = await uploadButtonImage({
        data: { fileName: file.name, base64 }
      });
      if (!validLink(result.url))
        throw new Error("Link de visualizacao invalido.");
      setSelected(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function confirm() {
    if (!validLink(selected)) return;
    onSelect(selected);
    setOpen(false);
    setSelected("");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <FolderOpen className="h-4 w-4" />
        Selecionar da biblioteca
      </Button>

      <Dialog open={open} onOpenChange={value => {
        if (busy && !value) return;
        setOpen(value);
        if (!value) {
          setSelected("");
          setError("");
        }
      }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Biblioteca de arquivos</DialogTitle>
            <DialogDescription>
              Vincule um PDF para download ou escolha uma imagem.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button type="button"
              variant={tab === "pdf" ? "default" : "outline"}
              onClick={() => { setTab("pdf"); setSelected(""); }}>
              <FileText className="mr-2 h-4 w-4" />
              PDFs
            </Button>
            <Button type="button"
              variant={tab === "images" ? "default" : "outline"}
              onClick={() => { setTab("images"); setSelected(""); }}>
              Imagens
            </Button>
          </div>


          {tab === "image-preview" ? (
            <div className="space-y-3">
              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.avif,.heic,.heif"
                className="hidden"
                onChange={e => void uploadPreviewImage(e.target.files?.[0])}
              />
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => imageInputRef.current?.click()}
              >
                {busy ? "Preparando imagem..." : "Enviar imagem para visualizar"}
              </Button>
              <p className="text-xs text-slate-500">
                JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC/HEIF.
                Limite de 15 MB. A visualizacao abre em uma pagina
                com opcao de baixar a imagem original.
              </p>
            </div>
          ) : tab === "images" ? (
            <EditorMediaLibrary
              onSelect={url => {
                if (validLink(url)) setSelected(url);
              }}
            />
          ) : (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => void upload(e.target.files?.[0])}
              />

              <Button type="button" className="w-full gap-2"
                disabled={busy}
                onClick={() => inputRef.current?.click()}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {busy ? "Enviando PDF..." : "Enviar PDF para download"}
              </Button>

              <p className="text-xs text-slate-500">
                O arquivo original sera armazenado sem conversao.
                Limite: 25 MB.
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.url)}
                    className={
                      "w-full rounded border p-3 text-left text-sm " +
                      (selected === item.url
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200")
                    }
                  >
                    <FileText className="mr-2 inline h-4 w-4" />
                    {item.fileName}
                    <span className="ml-2 text-xs text-slate-500">
                      {(item.size / 1048576).toFixed(1)} MB
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          {selected && (
            <div className="rounded bg-slate-50 p-3 text-sm">
              Arquivo selecionado.
              <a href={selected} target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-700 underline">
                Testar link
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button"
              disabled={busy || !validLink(selected)}
              onClick={confirm}>
              Vincular ao botão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
