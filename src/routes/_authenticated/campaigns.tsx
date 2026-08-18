import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  MoreHorizontal,
  Mail,
  ChevronRight,
  CheckCircle2,
  Users,
  Layout,
  Settings,
  ArrowLeft,
  Monitor,
  Smartphone,
  Info,
  Loader2,
  Send,
  CalendarClock,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDataStore, type Campaign } from "@/hooks/use-data";
import { useTemplateLibrary } from "@/hooks/use-template-library";
import { blocksToEmailHtml } from "@/lib/templates/blocks-to-html";
import { VisualEmailEditor } from "@/components/editor/VisualEmailEditor";
import { sendCampaignTest, dispatchCampaign } from "@/lib/campaigns.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas | Newsletter Digitale Têxtil" },
      {
        name: "description",
        content:
          "Crie, agende e dispare campanhas de e-mail marketing da Digitale Têxtil com destinatários reais, templates próprios e envio de teste.",
      },
      { property: "og:title", content: "Campanhas | Digitale Têxtil" },
      {
        property: "og:description",
        content: "Gestão completa de campanhas de e-mail: destinatários, design, agendamento e disparo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignsPage,
});

const steps = [
  { id: 1, label: "Informações", icon: Info },
  { id: 2, label: "Destinatários", icon: Users },
  { id: 3, label: "Design", icon: Layout },
  { id: 4, label: "Configurações", icon: Settings },
  { id: 5, label: "Revisão", icon: CheckCircle2 },
];

const SENDER_EMAIL = "atendimento@digitaletextil.com.br";

interface CampaignDraft {
  name: string;
  subject: string;
  senderName: string;
  replyTo: string;
  lists: string[];
  templateId: string | null;
  templateName: string;
  html: string;
  scheduleNow: boolean;
  scheduledAt: string;
  testEmail: string;
}

const EMPTY_DRAFT: CampaignDraft = {
  name: "",
  subject: "",
  senderName: "Digitale Têxtil",
  replyTo: SENDER_EMAIL,
  lists: [],
  templateId: null,
  templateName: "",
  html: "",
  scheduleNow: true,
  scheduledAt: "",
  testEmail: "",
};

function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative mb-12 flex justify-between">
      <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted/50" />
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                isActive
                  ? "border-accent text-accent shadow-md scale-110"
                  : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted text-muted-foreground",
              )}
            >
              {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Pré-visualização isolada do HTML do e-mail. */
function EmailPreview({ html, mode }: { html: string; mode: "desktop" | "mobile" }) {
  if (!html) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded border bg-background text-xs text-muted-foreground">
        Nenhum design selecionado ainda.
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <iframe
        title="Pré-visualização do e-mail"
        srcDoc={html}
        sandbox=""
        className={cn(
          "h-[280px] rounded border bg-white transition-all",
          mode === "desktop" ? "w-full" : "w-[320px]",
        )}
      />
    </div>
  );
}

function CampaignWizard({ onDone }: { onDone: () => void }) {
  const { addCampaign, contacts, fetchContacts } = useDataStore();
  const { templates } = useTemplateLibrary();
  const runTest = useServerFn(sendCampaignTest);
  const runDispatch = useServerFn(dispatchCampaign);

  const [step, setStep] = React.useState(1);
  const [draft, setDraft] = React.useState<CampaignDraft>(EMPTY_DRAFT);
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [pending, setPending] = React.useState<null | "test" | "draft" | "schedule" | "send">(null);
  const [confirmSend, setConfirmSend] = React.useState(false);

  React.useEffect(() => {
    if (contacts.length === 0) void fetchContacts();
  }, [contacts.length, fetchContacts]);

  const patch = (values: Partial<CampaignDraft>) => setDraft((prev) => ({ ...prev, ...values }));

  // Listas reais derivadas dos contatos cadastrados.
  const availableLists = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const contact of contacts) {
      if (contact.status !== "Ativo") continue;
      for (const list of contact.lists ?? []) {
        map.set(list, (map.get(list) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [contacts]);

  const activeContacts = React.useMemo(
    () => contacts.filter((c) => c.status === "Ativo"),
    [contacts],
  );

  const audience = React.useMemo(() => {
    if (draft.lists.length === 0) return activeContacts;
    return activeContacts.filter((c) => (c.lists ?? []).some((l) => draft.lists.includes(l)));
  }, [activeContacts, draft.lists]);

  const toggleList = (list: string) =>
    setDraft((prev) => ({
      ...prev,
      lists: prev.lists.includes(list)
        ? prev.lists.filter((l) => l !== list)
        : [...prev.lists, list],
    }));

  const validateStep = (current: number): string | null => {
    if (current === 1) {
      if (!draft.name.trim()) return "Informe o nome interno da campanha.";
      if (!draft.subject.trim()) return "Informe o assunto do e-mail.";
    }
    if (current === 2 && audience.length === 0) {
      return "Nenhum contato ativo nesta seleção. Cadastre ou importe contatos.";
    }
    if (current === 3 && !draft.html.trim()) {
      return "Escolha um template ou crie o conteúdo no editor.";
    }
    if (current === 4 && !draft.scheduleNow && !draft.scheduledAt) {
      return "Defina a data e hora do agendamento.";
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const buildContent = () => ({
    html: draft.html,
    subject: draft.subject,
    senderName: draft.senderName,
    senderEmail: SENDER_EMAIL,
    replyTo: draft.replyTo,
    lists: draft.lists,
    templateId: draft.templateId,
    templateName: draft.templateName,
    scheduledAt: draft.scheduleNow ? null : draft.scheduledAt,
  });

  const persist = async (status: Campaign["status"], recipients: number) =>
    addCampaign({
      name: draft.name.trim(),
      type: "E-mail",
      date: new Date().toLocaleDateString("pt-BR"),
      recipients,
      open: "0%",
      clicks: "0%",
      status,
      subject: draft.subject.trim(),
      content: buildContent(),
    });

  const handleSaveDraft = async () => {
    setPending("draft");
    const id = await persist("Rascunho", audience.length);
    setPending(null);
    if (!id) {
      toast.error("Não foi possível salvar o rascunho.");
      return;
    }
    toast.success("Rascunho salvo.");
    onDone();
  };

  const handleSchedule = async () => {
    if (!draft.scheduledAt) {
      toast.error("Defina a data e hora do agendamento na etapa 4.");
      return;
    }
    setPending("schedule");
    const id = await persist("Agendada", audience.length);
    setPending(null);
    if (!id) {
      toast.error("Não foi possível agendar a campanha.");
      return;
    }
    toast.success(
      `Campanha agendada para ${new Date(draft.scheduledAt).toLocaleString("pt-BR")}.`,
    );
    onDone();
  };

  const handleSendTest = async () => {
    const email = draft.testEmail.trim();
    if (!email) {
      toast.error("Informe o e-mail que receberá o teste.");
      return;
    }
    if (!draft.html.trim()) {
      toast.error("Escolha o design antes de enviar um teste.");
      return;
    }
    setPending("test");
    try {
      const result = await runTest({
        data: {
          to: email,
          subject: draft.subject.trim() || "Teste de campanha",
          html: draft.html,
          fromName: draft.senderName,
          replyTo: draft.replyTo,
        },
      });
      if (result.sent) toast.success(`E-mail de teste enviado para ${email}.`);
      else toast.error(`Não foi possível enviar o teste (${result.reason}).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar o teste.");
    } finally {
      setPending(null);
    }
  };

  const handleSendNow = async () => {
    setConfirmSend(false);
    setPending("send");
    try {
      const id = await persist("Em andamento", audience.length);
      if (!id) throw new Error("Não foi possível registrar a campanha.");
      const result = await runDispatch({ data: { campaignId: id } });
      if (result.sent > 0) {
        toast.success(
          `Campanha enviada para ${result.sent} de ${result.total} contatos.` +
            (result.failed > 0 ? ` ${result.failed} falharam.` : ""),
        );
      } else {
        toast.error("Nenhum e-mail foi aceito para envio. Verifique o domínio remetente.");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao disparar a campanha.");
    } finally {
      setPending(null);
    }
  };

  if (isEditorOpen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setEditorOpen(false)} className="font-bold">
            <ArrowLeft size={16} className="mr-2" /> Voltar ao wizard
          </Button>
          <p className="text-xs text-muted-foreground">Conteúdo da campanha “{draft.name || "sem nome"}”</p>
        </div>
        <VisualEmailEditor
          saveLabel="Usar este conteúdo"
          onSave={(blocks) => {
            patch({
              html: blocksToEmailHtml(blocks, draft.subject || draft.name || "Campanha"),
              templateId: null,
              templateName: "Conteúdo criado no editor",
            });
            setEditorOpen(false);
            toast.success("Conteúdo aplicado à campanha.");
          }}
        />
      </div>
    );
  }

  const isBusy = pending !== null;

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={step === 1 || isBusy}
          className="font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary">Criar nova campanha</h2>
          <p className="text-xs text-muted-foreground">Etapa {step} de 5</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDone} disabled={isBusy} className="text-muted-foreground">
          Cancelar
        </Button>
      </div>

      <WizardProgress currentStep={step} />

      <div className="min-h-[400px] rounded-2xl border bg-card p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Informações da campanha</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome da campanha (interno)</Label>
                <Input
                  id="name"
                  placeholder="Ex: Lançamento Primavera 2026"
                  className="h-10"
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="subject">Assunto do e-mail</Label>
                <Input
                  id="subject"
                  placeholder="Confira as novidades da nova estação"
                  className="h-10"
                  value={draft.subject}
                  onChange={(e) => patch({ subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender">Nome do remetente</Label>
                <Input
                  id="sender"
                  className="h-10"
                  value={draft.senderName}
                  onChange={(e) => patch({ senderName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">E-mail do remetente (verificado)</Label>
                <Input id="senderEmail" className="h-10" value={SENDER_EMAIL} readOnly disabled />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Quem receberá esta campanha?</h3>
            {availableLists.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-primary">Nenhuma lista encontrada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sem listas, a campanha vai para todos os contatos ativos ({activeContacts.length}).
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableLists.map(([list, total]) => (
                  <label
                    key={list}
                    className="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:border-primary/20 hover:bg-muted/5"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={draft.lists.includes(list)}
                        onCheckedChange={() => toggleList(list)}
                      />
                      <div>
                        <p className="font-bold text-primary">{list}</p>
                        <p className="text-xs text-muted-foreground">{total} contatos ativos</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase">
                      Lista
                    </Badge>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">
                <strong>{audience.length.toLocaleString("pt-BR")} contatos</strong> serão alcançados
                {draft.lists.length === 0 ? " (todos os contatos ativos)." : "."}
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">Escolha o design</h3>
              <p className="text-sm text-muted-foreground">
                Use um template da biblioteca ou monte o conteúdo no editor visual.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="group rounded-2xl border-2 border-dashed p-8 text-center transition-all hover:border-accent hover:bg-accent/5"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-accent/20 group-hover:text-accent">
                  <Plus size={28} />
                </div>
                <p className="font-bold text-primary">Criar do zero</p>
                <p className="mt-1 text-xs text-muted-foreground">Editor drag &amp; drop</p>
              </button>

              <div className="rounded-2xl border p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Biblioteca de templates
                </p>
                {templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum template salvo ainda. Crie um no editor ou importe do Canva em Templates.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() =>
                          patch({ html: tpl.html, templateId: tpl.id, templateName: tpl.name })
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-all hover:border-accent",
                          draft.templateId === tpl.id && "border-accent bg-accent/5",
                        )}
                      >
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                          {tpl.image ? (
                            <img src={tpl.image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{tpl.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{tpl.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {draft.html && (
              <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-primary">
                    {draft.templateName || "Conteúdo selecionado"}
                  </p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setPreviewMode("desktop")}>
                      <Monitor
                        size={14}
                        className={previewMode === "desktop" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                    <button type="button" onClick={() => setPreviewMode("mobile")}>
                      <Smartphone
                        size={14}
                        className={previewMode === "mobile" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  </div>
                </div>
                <EmailPreview html={draft.html} mode={previewMode} />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Configurações de envio</h3>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-bold text-primary">Enviar imediatamente</p>
                <p className="text-xs text-muted-foreground">
                  Desative para agendar a campanha para uma data futura.
                </p>
              </div>
              <Switch
                checked={draft.scheduleNow}
                onCheckedChange={(checked) => patch({ scheduleNow: checked })}
              />
            </div>

            {!draft.scheduleNow && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Data e hora do envio</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  className="h-10"
                  value={draft.scheduledAt}
                  onChange={(e) => patch({ scheduledAt: e.target.value })}
                />
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="replyTo">E-mail de resposta</Label>
                <Input
                  id="replyTo"
                  type="email"
                  className="h-10"
                  value={draft.replyTo}
                  onChange={(e) => patch({ replyTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testEmail">E-mail para teste</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="seu.email@digitaletextil.com.br"
                  className="h-10"
                  value={draft.testEmail}
                  onChange={(e) => patch({ testEmail: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Revisão final</h3>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      label: "Destinatários",
                      value: `${audience.length.toLocaleString("pt-BR")} contatos${
                        draft.lists.length > 0 ? ` (${draft.lists.join(", ")})` : " (todos os ativos)"
                      }`,
                      icon: Users,
                    },
                    { label: "Assunto", value: draft.subject || "—", icon: Info },
                    {
                      label: "Remetente",
                      value: `${draft.senderName} <${SENDER_EMAIL}>`,
                      icon: Mail,
                    },
                    {
                      label: "Conteúdo",
                      value: draft.templateName || (draft.html ? "Conteúdo personalizado" : "—"),
                      icon: Layout,
                    },
                    {
                      label: "Envio",
                      value: draft.scheduleNow
                        ? "Imediato"
                        : `Agendado para ${new Date(draft.scheduledAt).toLocaleString("pt-BR")}`,
                      icon: CalendarClock,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="mt-0.5 text-accent">
                        <item.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-primary">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    variant="outline"
                    className="font-bold"
                    onClick={handleSendTest}
                    disabled={isBusy}
                  >
                    {pending === "test" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send size={14} className="mr-2" /> Enviar teste
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="font-bold"
                    onClick={handleSchedule}
                    disabled={isBusy || draft.scheduleNow}
                  >
                    {pending === "schedule" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarClock size={14} className="mr-2" /> Agendar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="font-bold"
                    onClick={handleSaveDraft}
                    disabled={isBusy}
                  >
                    {pending === "draft" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save size={14} className="mr-2" /> Rascunho
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="text-xs font-bold uppercase text-primary">Preview</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setPreviewMode("desktop")}>
                      <Monitor
                        size={14}
                        className={previewMode === "desktop" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                    <button type="button" onClick={() => setPreviewMode("mobile")}>
                      <Smartphone
                        size={14}
                        className={previewMode === "mobile" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  </div>
                </div>
                <EmailPreview html={draft.html} mode={previewMode} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-between border-t pt-6">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={step === 1 || isBusy}
            className="font-bold text-muted-foreground"
          >
            Anterior
          </Button>
          <Button
            onClick={() => (step === 5 ? setConfirmSend(true) : goNext())}
            disabled={isBusy}
            className={cn(
              "px-8 font-bold shadow-md transition-all active:scale-95",
              step === 5 ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-accent text-accent-foreground",
            )}
          >
            {pending === "send" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {step === 5 ? "Enviar agora" : "Continuar"}
                {step !== 5 && <ChevronRight size={18} className="ml-2" />}
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar a campanha agora?</AlertDialogTitle>
            <AlertDialogDescription>
              O e-mail será disparado imediatamente para {audience.length.toLocaleString("pt-BR")}{" "}
              contatos ativos a partir de {SENDER_EMAIL}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendNow} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CampaignsPage() {
  const { campaigns, deleteCampaign, fetchCampaigns } = useDataStore();
  const [isCreating, setIsCreating] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("Todas");

  React.useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const filterMap: Record<string, string> = {
    Enviadas: "Enviada",
    Agendadas: "Agendada",
    Rascunhos: "Rascunho",
    "Em andamento": "Em andamento",
  };

  const filteredCampaigns = campaigns.filter(
    (c) => statusFilter === "Todas" || c.status === filterMap[statusFilter],
  );

  if (isCreating) {
    return (
      <CampaignWizard
        onDone={() => {
          setIsCreating(false);
          void fetchCampaigns();
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Campanhas</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Gestão profissional de envios para a Digitale Têxtil.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-accent px-6 font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" />
          Nova Campanha
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto bg-muted/50">
          {["Todas", "Enviadas", "Agendadas", "Rascunhos", "Em andamento"].map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="text-xs font-bold data-[state=active]:text-primary"
            >
              {status}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b hover:bg-transparent">
                <TableHead className="py-4 pl-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Campanha
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Tipo
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Data
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Destinatários
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Abertura
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Cliques
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Status
                </TableHead>
                <TableHead className="w-[50px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhuma campanha nesta visão.
                  </TableCell>
                </TableRow>
              )}
              {filteredCampaigns.map((camp) => (
                <TableRow key={camp.id} className="group transition-all hover:bg-secondary/40">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{camp.name}</span>
                      <span className="text-[10px] text-muted-foreground">{camp.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter">
                      {camp.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(camp.createdAt || Date.now()).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {camp.recipients.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">{camp.open}</TableCell>
                  <TableCell className="text-xs font-bold text-primary">{camp.clicks}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full border-none px-2 py-0.5 text-[9px] font-bold",
                        camp.status === "Enviada" && "bg-emerald-100 text-emerald-700",
                        camp.status === "Agendada" && "bg-blue-100 text-blue-700",
                        camp.status === "Rascunho" && "bg-gray-100 text-gray-700",
                        camp.status === "Em andamento" && "bg-orange-100 text-orange-700",
                      )}
                    >
                      {camp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            void deleteCampaign(camp.id);
                            toast.success("Campanha excluída.");
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  );
}
