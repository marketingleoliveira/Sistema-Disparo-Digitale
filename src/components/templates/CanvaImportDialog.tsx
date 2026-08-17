import * as React from "react";
import { UploadCloud, ImageIcon, FileCode2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
  const [kind, setKind] = React.useState<CanvaImportKind | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = React.useCallback(() => {
    setName("");
    setCategory(CATEGORY_OPTIONS[0]!);
    setLinkUrl("");
    setFile(null);
    setKind(null);
    setPreview(null);
    setIsImporting(false);
  }, []);

  const handleFiles = React.useCallback(
    async (selected: File | null | undefined) => {
      if (!selected) return;
      const validation = validateImportFile(selected);
      if (!validation.ok) {
        toast.error(validation.error);
        return;
      }
      setFile(selected);
      setKind(validation.kind);
      if (!name) setName(selected.name.replace(/\.[^.]+$/, ""));
      try {
        if (validation.kind === "image") {
          setPreview(await readFileAsDataUrl(selected));
        } else {
          const html = sanitizeImportedHtml(await readFileAsText(selected));
          setPreview(extractFirstImage(html) ?? null);
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
      let html: string;
      let thumbnail: string;

      if (kind === "image") {
        const dataUrl = preview ?? (await readFileAsDataUrl(file));
        html = buildEmailHtmlFromImage({
          name: finalName,
          imageSrc: dataUrl,
          ...(safeLink ? { linkUrl: safeLink } : {}),
        });
        thumbnail = dataUrl;
      } else {
        html = sanitizeImportedHtml(await readFileAsText(file));
        thumbnail = extractFirstImage(html) ?? "";
      }

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
    } catch {
      toast.error("Falha ao importar o template. Tente novamente.");
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
            <UploadCloud size={18} className="mr-2" /> Importar do Canva
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Importar template do Canva</DialogTitle>
          <DialogDescription>
            O Canva não exporta HTML. Exporte seu design como <strong>PNG/JPG</strong> (recomendado)
            ou envie um arquivo <strong>HTML</strong> pronto — nós convertemos para um e-mail
            compatível com todos os clientes.
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
                PNG, JPG, WEBP ou HTML • até 4 MB
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,text/html"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files?.[0])}
            />

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

            {kind !== "html" && (
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