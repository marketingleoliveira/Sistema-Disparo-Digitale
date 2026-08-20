import * as React from "react";
import { FileUp, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { processPdfToEmail } from "@/lib/campaigns/pdf-processor.functions";

export interface PdfUploadDialogProps {
  onConverted: (html: string) => void;
  children?: React.ReactNode;
}

export function PdfUploadDialog({ onConverted, children }: PdfUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<"idle" | "uploading" | "converting" | "success" | "error">("idle");
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const convertPdf = useServerFn(processPdfToEmail);

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Por favor, selecione apenas arquivos PDF.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setFile(selected);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleStartConversion = async () => {
    if (!file) return;

    setStatus("converting");
    setProgress(30);

    try {
      const base64 = await readFileAsBase64(file);
      setProgress(60);

      const result = await convertPdf({
        data: {
          pdfBase64: base64,
          fileName: file.name
        }
      });

      if (result.success) {
        setProgress(100);
        setStatus("success");
        toast.success("PDF convertido com sucesso!");
        setTimeout(() => {
          onConverted(result.html);
          setOpen(false);
          reset();
        }, 800);
      } else {
        throw new Error(result.message || "Erro na conversão");
      }
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Falha ao processar PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="h-auto flex-col gap-2 p-8 border-2 border-dashed">
             <FileUp size={28} className="text-muted-foreground" />
             <div className="text-center">
                <p className="font-bold text-primary">Importar PDF</p>
                <p className="text-xs text-muted-foreground">Converter arquivo em e-mail</p>
             </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Converter PDF para E-mail</DialogTitle>
          <DialogDescription>
            Envie um arquivo PDF e o transformaremos em um design de e-mail pronto para disparo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === "idle" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f && f.type === "application/pdf") setFile(f);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer",
                file ? "border-accent bg-accent/5" : "border-border bg-muted/40 hover:bg-muted"
              )}
            >
              <div className="rounded-full bg-primary/10 p-4 text-primary">
                <FileText size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary">
                  {file ? file.name : "Clique ou arraste o PDF aqui"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Máximo 10MB • Formato PDF
                </p>
              </div>
            </div>
          )}

          {status !== "idle" && (
            <div className="space-y-4 rounded-xl border p-8 text-center bg-muted/20">
              {status === "converting" && <Loader2 size={32} className="mx-auto text-accent animate-spin" />}
              {status === "success" && <CheckCircle2 size={32} className="mx-auto text-emerald-500" />}
              {status === "error" && <AlertCircle size={32} className="mx-auto text-destructive" />}
              
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary">
                  {status === "converting" ? "Convertendo design..." : 
                   status === "success" ? "Conversão concluída!" : "Erro na conversão"}
                </p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={status === "converting"} className="font-bold">
            Cancelar
          </Button>
          {status === "idle" && (
            <Button 
              onClick={handleStartConversion} 
              disabled={!file} 
              className="bg-accent text-accent-foreground font-bold"
            >
              Iniciar conversão
            </Button>
          )}
          {status === "error" && (
            <Button onClick={reset} className="bg-accent text-accent-foreground font-bold">
              Tentar novamente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
