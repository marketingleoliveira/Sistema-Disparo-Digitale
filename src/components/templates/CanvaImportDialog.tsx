import * as React from "react";
import { UploadCloud, ImageIcon, FileCode2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { processPdfToEmail } from "@/lib/campaigns/pdf-processor.functions";
import { uploadEditorImage } from "@/lib/disparo-editor-media.functions";
import { blocksToEmailHtml } from "@/lib/templates/blocks-to-html";
import type { EditorBlock } from "@/components/editor/editor-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  buildEmailHtmlFromImage,
  extractFirstImage,
  readFileAsDataUrl,
  readFileAsText,
  sanitizeImportedHtml,
  sanitizeUrl,
  validateImportFile,
  type CanvaImportKind,
} from "@/lib/templates/canva-import";
import { createTemplateId, type StoredTemplate } from "@/lib/templates/stored-template";

export interface CanvaImportDialogProps {
  onImported: (template: StoredTemplate) => void;
  children?: React.ReactNode;
}

const CATEGORY_OPTIONS = ["Newsletter", "Promoção", "Lançamento", "Produto", "Institucional"];

export function CanvaImportDialog({ onImported, children }: CanvaImportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORY_OPTIONS[0]!);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [kind, setKind] = React.useState<CanvaImportKind | "pdf" | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  // DIGITALE_HTML_PREVIEW_V1
  const [htmlPreview, setHtmlPreview] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const convertPdf = useServerFn(processPdfToEmail);
  const uploadImage = useServerFn(uploadEditorImage);

  const reset = React.useCallback(() => {
    setName("");
    setCategory(CATEGORY_OPTIONS[0]!);
    setLinkUrl("");
    setFile(null);
    setKind(null);
    setPreview(null);
    setHtmlPreview("");
    setIsImporting(false);
  }, []);

  const handleFiles = React.useCallback(
    async (selected: File | null | undefined) => {
      if (!selected) return;
      const isPdf =
        selected.type === "application/pdf" ||
        /\.pdf$/i.test(selected.name);

      const validation = isPdf
        ? selected.size > 0 && selected.size <= 25 * 1024 * 1024
          ? { ok: true as const, kind: "pdf" as const }
          : { ok: false as const, error: "PDF deve ter ate 25 MB." }
        : validateImportFile(selected);
      if (!validation.ok) {
        toast.error(validation.error);
        return;
      }
      setFile(selected);
      setKind(validation.kind);
      setHtmlPreview("");
      if (!name) setName(selected.name.replace(/\.[^.]+$/, ""));
      try {
        if (validation.kind === "image") {
          setPreview(await readFileAsDataUrl(selected));
        } else if (validation.kind === "html") {
          const html = sanitizeImportedHtml(await readFileAsText(selected));
          setPreview(extractFirstImage(html) ?? null);
          setHtmlPreview(html);
        } else {
          setPreview(null);
          setLinkUrl("");
        }
      } catch {
        toast.error("Não foi possível ler o arquivo selecionado.");
      }
    },
    [name],
  );

  const handleImport = async () => {
    if (!file || !kind) {
      toast.error("Selecione o arquivo exportado do Canva.");
      return;
    }
    const finalName = name.trim() || "Template importado do Canva";
    const safeLink = sanitizeUrl(linkUrl);
    if (linkUrl.trim() && !safeLink) {
      toast.error("O link de destino deve começar com http:// ou https://");
      return;
    }

    setIsImporting(true);
    try {
      if (kind === "pdf") {
        const dataUrl = await readFileAsDataUrl(file);
        const pdfBase64 = dataUrl.split(",")[1];

        if (!pdfBase64) {
          throw new Error("PDF nao pode ser lido.");
        }

        const result = await convertPdf({
          data: { pdfBase64, fileName: file.name }
        });

        if (
          !result.success ||
          !Array.isArray(result.blocks) ||
          result.blocks.length === 0
        ) {
          throw new Error("O servidor nao conseguiu converter o PDF.");
        }


        // DIGITALE_PDF_PNG_ORIGINAL_V1
        // Usar sempre o PNG original no editor e no HTML.
        // O JPG otimizado nao sera escolhido pelo novo importador.
        const blocks = (result.blocks as EditorBlock[]).map(
          (block) => {
            if (block.type !== "image") return block;

            const current = String(block.content?.url ?? "");

            if (
              !current.startsWith(
                "https://disparo.digitaletextil.com.br/pdf-campaigns/"
              )
            ) return block;

            const originalPng = current.replace(
              /-mobile\.jpg(?=$|[?#])/i,
              ".png"
            );

            return {
              ...block,
              content: {
                ...block.content,
                url: originalPng,
              },
            };
          }
        );


        const images = blocks
          .filter((block) => block.type === "image")
          .map((block) => String(block.content?.url ?? ""));

        if (
          images.length === 0 ||
          images.some((url) =>
            !url.startsWith(
              "https://disparo.digitaletextil.com.br/pdf-campaigns/"
            )
          )
        ) {
          throw new Error("PDF nao retornou paginas publicadas validas.");
        }

        const now = new Date().toISOString();

        onImported({
          id: createTemplateId("pdf"),
          name: finalName,
          category,
          image: images[0]!,
          html: blocksToEmailHtml(blocks, finalName),
          kind: "editor",
          blocks,
          createdAt: now,
          updatedAt: now
        });

        toast.success("PDF importado com sucesso.");
        setOpen(false);
        reset();
        return;
      }


      // IMPORT_CANVA_MEDIA_EDITAVEL_V1
      // Armazenar imagem na VPS e salvar somente sua URL.
      if (kind === "image") {
        const dataUrl = preview ?? (await readFileAsDataUrl(file));

        const uploaded = await uploadImage({
          data: {
            fileName: file.name,
            base64: dataUrl,
          },
        });

        const mediaInfo = uploaded as {
          id?: string;
          url?: string;
        };

        const mediaUrl = String(
          mediaInfo.url ||
          (mediaInfo.id
            ? "https://disparo.digitaletextil.com.br/editor-media/" +
              mediaInfo.id
            : "")
        );

        if (!/^https:\/\/disparo\.digitaletextil\.com\.br\/editor-media\/[a-f0-9]{64}\.(?:png|jpg|webp)$/i.test(mediaUrl)) {
          throw new Error(
            "A biblioteca nao retornou uma URL valida para a imagem."
          );
        }

        const now = new Date().toISOString();

        const blocks: EditorBlock[] = [{
          id: createTemplateId("image-block"),
          type: "image",
          content: {
            url: mediaUrl,
            alt: finalName,
            ...(safeLink ? { href: safeLink } : {}),
          },
          styles: {
            width: "600px",
            textAlign: "center",
            borderRadius: "0",
            paddingTop: "0",
            paddingBottom: "0",
          },
        }];

        onImported({
          id: createTemplateId("canva"),
          name: finalName,
          category,
          image: mediaUrl,
          html: blocksToEmailHtml(blocks, finalName),
          kind: "editor",
          blocks,
          createdAt: now,
          updatedAt: now,
        });

        toast.success(
          "Imagem importada. Sincronizando com a biblioteca."
        );
        setOpen(false);
        reset();
        return;
      }

      // DIGITALE_CANVAS_STATIC_V2
      const rawHtml = await readFileAsText(file);

      if (/<canvas\b/i.test(rawHtml)) {
        const embedded = Array.from(
          rawHtml.matchAll(
            /data:image\/(?:bmp|png|jpe?g|webp);base64,([A-Za-z0-9+\/=\r\n]+)/gi
          )
        );

        if (embedded.length !== 1) {
          throw new Error(
            "HTML Canvas: detectadas " + embedded.length +
            " imagens. A conversão automática requer uma " +
            "única imagem PNG."
          );
        }

        const pngBase64 = String(embedded[0]?.[1] ?? "")
          .replace(/\s+/g, "");

        // Alguns conversores declaram BMP, mas incluem PNG.
        if (!pngBase64.startsWith("iVBORw0KGgo")) {
          throw new Error(
            "HTML Canvas: a imagem incorporada não é PNG."
          );
        }

        const uploaded = await uploadImage({
          data: {
            fileName: "canvas-import.png",
            base64: "data:image/png;base64," + pngBase64,
          },
        });

        const info = uploaded as {
          id?: string;
          url?: string;
        };

        const mediaUrl = String(
          info.url ||
          (info.id
            ? "https://disparo.digitaletextil.com.br/editor-media/" +
              info.id
            : "")
        );

        if (
          !/^https:\/\/disparo\.digitaletextil\.com\.br\/editor-media\/[a-f0-9]{64}\.png$/i.test(mediaUrl)
        ) {
          throw new Error(
            "A VPS não retornou uma URL PNG válida."
          );
        }

        const blocks: EditorBlock[] = [{
          id: createTemplateId("canvas-png"),
          type: "image",
          content: {
            url: mediaUrl,
            alt: finalName,
          },
          styles: {
            width: "600px",
            textAlign: "center",
            borderRadius: "0",
            paddingTop: "0",
            paddingBottom: "0",
          },
        }];

        const now = new Date().toISOString();

        onImported({
          id: createTemplateId("canvas-static"),
          name: finalName,
          category,
          image: mediaUrl,
          html: blocksToEmailHtml(blocks, finalName),
          kind: "editor",
          blocks,
          createdAt: now,
          updatedAt: now,
        });

        toast.success(
          "HTML Canvas convertido em template estático."
        );
        setOpen(false);
        reset();
        return;
      }

      const html = sanitizeImportedHtml(rawHtml);
      const thumbnail = extractFirstImage(html) ?? "";

      onImported({
        id: createTemplateId("canva"),
        name: finalName,
        category,
        image: thumbnail,
        html,
        kind,
        ...(safeLink ? { linkUrl: safeLink } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success("Template do Canva importado com sucesso.");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao importar o template."
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="font-bold">
            <UploadCloud size={18} className="mr-2" /> Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Importar template</DialogTitle>
          <DialogDescription>
            Importe imagens <strong>PNG/JPG/WEBP</strong>, arquivos
            <strong>HTML</strong> ou <strong>PDF</strong>.
            As paginas do PDF serao convertidas em imagens no corpo do e-mail.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 font-bold text-xs">
              Upload do design
            </TabsTrigger>
            <TabsTrigger value="ajuda" className="flex-1 font-bold text-xs">
              Como exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFiles(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors",
                file ? "border-accent bg-accent/5" : "border-border bg-muted/40 hover:bg-muted",
              )}
            >
              {preview && kind === "image" ? (
                <img
                  src={preview}
                  alt="Pré-visualização do design importado"
                  className="max-h-40 w-auto rounded-lg border object-contain"
                />
              ) : (
                <span className="rounded-full bg-primary/10 p-3 text-primary">
                  {kind === "html" ? <FileCode2 size={22} /> : <ImageIcon size={22} />}
                </span>
              )}
              <span className="text-sm font-bold text-primary">
                {file ? file.name : "Arraste o arquivo ou clique para selecionar"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                PNG, JPG, WEBP, HTML ou PDF • PDF ate 25 MB
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,text/html,application/pdf,.pdf"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files?.[0])}
            />

            {kind === "html" && htmlPreview && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary">
                  Pré-visualização completa do HTML
                </p>
                <iframe
                  title="Pré-visualização do HTML importado"
                  srcDoc={htmlPreview}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  className="h-[350px] w-full rounded-lg border bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Visualização isolada, sem executar JavaScript.
                  Imagens e estilos externos precisam ter URLs acessíveis.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="canva-name" className="text-xs font-bold">
                  Nome do template
                </Label>
                <Input
                  id="canva-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Lançamento Coleção Verão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canva-category" className="text-xs font-bold">
                  Categoria
                </Label>
                <select
                  id="canva-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {kind !== "html" && kind !== "pdf" && (
              <div className="space-y-2">
                <Label htmlFor="canva-link" className="text-xs font-bold">
                  Link de destino (opcional)
                </Label>
                <Input
                  id="canva-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://digitaletextil.com.br/colecao"
                />
                <p className="text-[11px] text-muted-foreground">
                  A imagem inteira se torna clicável e leva para este endereço.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ajuda" className="space-y-3 pt-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>No Canva, abra o design do e-mail e clique em <strong>Compartilhar → Baixar</strong>.</li>
              <li>
                Escolha <strong>PNG</strong> e, se o design tiver várias páginas, baixe cada página
                separadamente (um e-mail = uma imagem).
              </li>
              <li>Mantenha a largura próxima de 600px para melhor leitura em celulares.</li>
              <li>Volte aqui, envie o arquivo e informe o link de destino do call-to-action.</li>
            </ol>
            <p className="text-[11px]">
              Observação: e-mails 100% em imagem podem cair mais em spam. Para campanhas grandes,
              prefira recriar o layout no editor visual usando o design do Canva como referência.
            </p>
            <a
              href="https://www.canva.com/help/download-designs/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-accent"
            >
              Documentação do Canva <ExternalLink size={12} />
            </a>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="font-bold">
            Cancelar
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={!file || isImporting}
            className="bg-accent text-accent-foreground font-bold"
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Importando...
              </>
            ) : (
              <>
                <UploadCloud size={16} className="mr-2" /> Importar template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}