import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TransactionalTemplate } from "@/hooks/use-transactional-templates";

export interface TransactionalTemplateDraft {
  label: string;
  description: string;
  subject: string;
  html: string;
}

export interface TransactionalTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Template em edição; ausente significa criação. */
  template?: TransactionalTemplate | null;
  /** Conteúdo inicial ao criar a partir de um layout oficial. */
  initialDraft?: TransactionalTemplateDraft | null;
  onSubmit: (draft: TransactionalTemplateDraft) => void;
}

const EMPTY: TransactionalTemplateDraft = {
  label: "",
  description: "",
  subject: "",
  html: "",
};

/** Formulário de criação/edição de um template de e-mail transacional. */
export function TransactionalTemplateDialog({
  open,
  onOpenChange,
  template,
  initialDraft,
  onSubmit,
}: TransactionalTemplateDialogProps) {
  const [draft, setDraft] = React.useState<TransactionalTemplateDraft>(EMPTY);

  // Sincroniza o formulário sempre que o diálogo abre com um alvo diferente.
  React.useEffect(() => {
    if (!open) return;
    if (template) {
      setDraft({
        label: template.label,
        description: template.description,
        subject: template.subject,
        html: template.html,
      });
      return;
    }
    setDraft(initialDraft ?? EMPTY);
  }, [open, template, initialDraft]);

  const isValid = draft.label.trim().length > 0 && draft.html.trim().length > 0;

  function handleSubmit() {
    if (!isValid) {
      toast.error("Informe ao menos o nome e o conteúdo HTML do template.");
      return;
    }
    onSubmit({
      label: draft.label.trim(),
      description: draft.description.trim(),
      subject: draft.subject.trim(),
      html: draft.html,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar template de e-mail" : "Novo template de e-mail"}
          </DialogTitle>
          <DialogDescription>
            Defina o assunto e o conteúdo HTML usado no disparo. Use variáveis como{" "}
            {"{{nome}}"} para personalização.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-label">Nome</Label>
              <Input
                id="tpl-label"
                value={draft.label}
                onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ex.: Boas-vindas personalizado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Assunto</Label>
              <Input
                id="tpl-subject"
                value={draft.subject}
                onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Ex.: Bem-vindo à Digitale Têxtil"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-description">Descrição interna</Label>
            <Input
              id="tpl-description"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="Quando este e-mail é enviado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-html">Conteúdo HTML</Label>
            <Textarea
              id="tpl-html"
              value={draft.html}
              onChange={(e) => setDraft((p) => ({ ...p, html: e.target.value }))}
              spellCheck={false}
              className="h-64 font-mono text-xs"
              placeholder="<table width='600'>...</table>"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {template ? "Salvar alterações" : "Criar template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}