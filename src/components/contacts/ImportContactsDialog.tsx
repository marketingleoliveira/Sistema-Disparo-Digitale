import * as React from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  buildPreview,
  parseContactsFile,
  IMPORT_FIELDS,
  type ImportField,
  type ImportPreview,
} from "@/lib/contacts/import-parser";
import { useDataStore } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  firstname: "Primeiro nome",
  lastname: "Sobrenome",
  email: "E-mail",
  company: "Empresa",
  phone: "Telefone",
  status: "Status",
  tags: "Tags",
  lists: "Listas",
};

const IGNORE = "__ignore__";

function splitDefaults(value: string): string[] {
  return value
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
  const importContacts = useDataStore((s) => s.importContacts);
  const [fileName, setFileName] = React.useState<string>("");
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Record<number, ImportField | null>>({});
  const [defaultLists, setDefaultLists] = React.useState("");
  const [defaultTags, setDefaultTags] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFileName("");
    setPreview(null);
    setIsParsing(false);
    setIsImporting(false);
    setDragging(false);
    setOverrides({});
    setDefaultLists("");
    setDefaultTags("");
  };

  const applyOverride = (index: number, field: ImportField | null) => {
    setOverrides((prev) => {
      const next = { ...prev, [index]: field };
      setPreview((current) => (current ? buildPreview(current.rawRows, next) : current));
      return next;
    });
  };

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    setOverrides({});
    try {
      const result = await parseContactsFile(file);
      if (result.contacts.length === 0) {
        toast.error("Nenhum contato válido encontrado", {
          description: "Verifique se o arquivo possui uma coluna de e-mail.",
        });
      }
      setPreview(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao ler o arquivo.";
      toast.error("Não foi possível ler a planilha", { description: message });
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleImport = async () => {
    if (!preview || preview.contacts.length === 0) return;
    const extraLists = splitDefaults(defaultLists);
    const extraTags = splitDefaults(defaultTags);
    const payload = preview.contacts.map((contact) => ({
      ...contact,
      lists: Array.from(new Set([...contact.lists, ...extraLists])),
      tags: Array.from(new Set([...contact.tags, ...extraTags])),
    }));
    setIsImporting(true);
    const result = await importContacts(payload);
    setIsImporting(false);

    if (result.error) {
      toast.error("Erro ao importar contatos", { description: result.error });
      return;
    }
    toast.success(`${result.inserted} contato(s) importado(s)`, {
      description: result.skipped > 0 ? `${result.skipped} ignorado(s) por duplicidade.` : undefined,
    });
    reset();
    onOpenChange(false);
  };

  const recognized = preview
    ? Object.entries(preview.mapping).filter(([, field]) => field !== null)
    : [];
  const ignored = preview
    ? Object.entries(preview.mapping).filter(([, field]) => field === null)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Importar contatos</DialogTitle>
          <DialogDescription>
            Aceita CSV, TSV, XLSX e XLS em qualquer estrutura de colunas — incluindo exportações da Brevo.
            As colunas são reconhecidas automaticamente.
          </DialogDescription>
        </DialogHeader>

        {!preview && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
              dragging ? "border-accent bg-accent/5" : "border-border/70 hover:bg-secondary/50",
            )}
          >
            {isParsing ? (
              <Loader2 size={28} className="animate-spin text-accent" />
            ) : (
              <FileSpreadsheet size={28} className="text-accent" />
            )}
            <div>
              <p className="text-sm font-bold text-foreground">
                {isParsing ? "Analisando planilha..." : "Arraste a planilha aqui ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, TSV, XLSX, XLS — separador detectado automaticamente
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.ods"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {preview && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet size={16} className="text-accent shrink-0" />
                <span className="text-xs font-bold truncate">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs">
                <X size={14} className="mr-1" />
                Trocar arquivo
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Linhas lidas" value={preview.totalRows} />
              <StatBox label="Válidos" value={preview.contacts.length} tone="success" />
              <StatBox label="Duplicados" value={preview.duplicates} tone="warning" />
              <StatBox label="E-mails inválidos" value={preview.invalidEmails} tone="danger" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Colunas reconhecidas
              </p>
              <div className="flex flex-wrap gap-2">
                {recognized.map(([header, field]) => (
                  <Badge key={header} variant="secondary" className="text-[11px] font-medium gap-1">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    {header} → {FIELD_LABELS[field as string] ?? field}
                  </Badge>
                ))}
                {recognized.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum cabeçalho reconhecido — os e-mails foram detectados pelo conteúdo.
                  </span>
                )}
              </div>
              {ignored.length > 0 && (
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-orange-500" />
                  Colunas não reconhecidas podem ser mapeadas manualmente abaixo.
                </p>
              )}
            </div>

            {/* Mapeamento manual de colunas */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Mapeamento manual de colunas
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {preview.columns.map((column) => (
                  <div key={column.index} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium" title={column.header}>
                      {column.header}
                    </span>
                    <Select
                      value={column.field ?? IGNORE}
                      onValueChange={(value) =>
                        applyOverride(column.index, value === IGNORE ? null : (value as ImportField))
                      }
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE} className="text-xs">
                          Ignorar coluna
                        </SelectItem>
                        {IMPORT_FIELDS.map((field) => (
                          <SelectItem key={field} value={field} className="text-xs">
                            {FIELD_LABELS[field] ?? field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista e tag padrão */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="default-lists" className="text-xs font-bold">
                  Listas padrão
                </Label>
                <Input
                  id="default-lists"
                  placeholder="Ex: Newsletter, Clientes"
                  value={defaultLists}
                  onChange={(e) => setDefaultLists(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-tags" className="text-xs font-bold">
                  Tags padrão
                </Label>
                <Input
                  id="default-tags"
                  placeholder="Ex: Importado, Brevo"
                  value={defaultTags}
                  onChange={(e) => setDefaultTags(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {preview.contacts.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="text-[11px]">Nome</TableHead>
                      <TableHead className="text-[11px]">E-mail</TableHead>
                      <TableHead className="text-[11px]">Empresa</TableHead>
                      <TableHead className="text-[11px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.contacts.slice(0, 5).map((contact) => (
                      <TableRow key={contact.email}>
                        <TableCell className="text-xs font-semibold">{contact.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{contact.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{contact.company || "—"}</TableCell>
                        <TableCell className="text-xs">{contact.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.contacts.length > 5 && (
                  <p className="border-t bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
                    + {preview.contacts.length - 5} contato(s) adicionais
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs font-bold">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || preview.contacts.length === 0 || isImporting}
            className="bg-accent text-accent-foreground font-bold"
          >
            {isImporting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Upload size={16} className="mr-2" />
            )}
            Importar {preview?.contacts.length ? `${preview.contacts.length} contato(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-orange-600"
        : tone === "danger"
          ? "text-red-600"
          : "text-foreground";

  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", toneClass)}>{value}</p>
    </div>
  );
}