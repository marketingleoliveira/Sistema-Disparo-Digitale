import { useEffect, useMemo, useState } from "react";
import { WorkflowBuilder } from "@/components/automations/WorkflowBuilder";
import { useServerFn } from "@tanstack/react-start";
import {
  uploadDisparoAutomationPdf,
  listDisparoAutomationPdfs,
  downloadDisparoAutomationPdf,
} from "@/lib/disparo-automation-pdfs.functions";

// DIGITALE_PDF_PERSISTENCE_V1
import type {
  Automation,
  AutomationNode,
} from "@/components/automations/automation-types";

type PlannerAttachment = {
  name: string;
  size: number;
  updatedAt: string;
};

type PlannerDispatch = {
  id: string;
  kind: "day" | "event";
  scheduleLabel: string;
  title: string;
  summary: string;
  attachment: PlannerAttachment | null;
};

type PlannerAutomation = Automation;

interface AutomationPlannerProps {
  automation: PlannerAutomation;
  onClose: () => void;
  onSaveDraft?: ((
    automation: PlannerAutomation,
    nodes: AutomationNode[]
  ) => Promise<void>) | undefined;
}

const weekOptions = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
];

function storageKey(automationId: string) {
  return `digitale-automation-planner:${automationId}`;
}

function defaultDispatches(automationId: string): PlannerDispatch[] {
  if (automationId === "digitale-newsletter") {
    return [
      {
        id: "newsletter-segunda",
        kind: "day",
        scheduleLabel: "Segunda",
        title: "Email Marketing de Apresentação da Digitale",
        summary: "Disparo de boas-vindas com apresentação institucional.",
        attachment: null,
      },
      {
        id: "newsletter-quarta",
        kind: "day",
        scheduleLabel: "Quarta",
        title: "Email Marketing dos Principais Artigos",
        summary: "Disparo com os principais artigos e linhas estratégicas.",
        attachment: null,
      },
      {
        id: "newsletter-sexta",
        kind: "day",
        scheduleLabel: "Sexta",
        title: "Email Marketing das Tecnologias",
        summary: "Disparo com foco em tecnologias e diferenciais técnicos.",
        attachment: null,
      },
    ];
  }

  if (automationId === "digitale-clientes") {
    return [
      {
        id: "clientes-segunda",
        kind: "day",
        scheduleLabel: "Segunda",
        title: "Radar Digitale",
        summary: "Conteúdo recorrente com radar de novidades e movimento do mercado.",
        attachment: null,
      },
      {
        id: "clientes-quarta",
        kind: "day",
        scheduleLabel: "Quarta",
        title: "Novidades e Lançamentos",
        summary: "Disparo com lançamentos, novidades e materiais comerciais.",
        attachment: null,
      },
      {
        id: "clientes-sexta",
        kind: "day",
        scheduleLabel: "Sexta",
        title: "Dicas do Bem-Estar",
        summary: "Disparo com conteúdo de bem-estar e relacionamento.",
        attachment: null,
      },
    ];
  }

  return [
    {
      id: "interesse-estampas",
      kind: "event",
      scheduleLabel: "Ao acessar Estampas",
      title: "Ebook Estampas e Coleções",
      summary: "Entregar material sobre estampas e coleções ao detectar interesse nessa área.",
      attachment: null,
    },
    {
      id: "interesse-tecidos",
      kind: "event",
      scheduleLabel: "Ao acessar Tecidos",
      title: "Ebook Artigos",
      summary: "Entregar ebook de artigos ao detectar visita às páginas de tecidos.",
      attachment: null,
    },
    {
      id: "interesse-artigo-especifico",
      kind: "event",
      scheduleLabel: "Ao acessar um artigo específico",
      title: "Ebook Artigo Específico",
      summary: "Entregar material específico conforme o artigo visitado no site.",
      attachment: null,
    },
  ];
}

export function AutomationPlanner({
  automation,
  onClose,
  onSaveDraft,
}: AutomationPlannerProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [dispatches, setDispatches] = useState<PlannerDispatch[]>(
    defaultDispatches(automation.id)
  );
  const uploadPdf = useServerFn(uploadDisparoAutomationPdf);
  const listPdfs = useServerFn(listDisparoAutomationPdfs);
  const downloadPdf = useServerFn(downloadDisparoAutomationPdf);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(storageKey(automation.id));
      if (!raw) {
        setDispatches(defaultDispatches(automation.id));
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setDispatches(defaultDispatches(automation.id));
        return;
      }

      const safe = parsed
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.kind === "string" &&
            typeof item.scheduleLabel === "string" &&
            typeof item.title === "string" &&
            typeof item.summary === "string"
        )
        .map((item) => ({
          id: item.id,
          kind: item.kind === "event" ? "event" : "day",
          scheduleLabel: item.scheduleLabel,
          title: item.title,
          summary: item.summary,
          attachment:
            item.attachment &&
            typeof item.attachment === "object" &&
            typeof item.attachment.name === "string"
              ? {
                  name: item.attachment.name,
                  size: Number(item.attachment.size || 0),
                  updatedAt: String(item.attachment.updatedAt || ""),
                }
              : null,
        })) as PlannerDispatch[];

      setDispatches(
        safe.length > 0 ? safe : defaultDispatches(automation.id)
      );
    } catch {
      setDispatches(defaultDispatches(automation.id));
    }
  }, [automation.id]);

  useEffect(() => {
    let cancelled = false;

    listPdfs({ data: { automationId: automation.id } })
      .then((records) => {
        if (cancelled) return;

        const stored = new Map(
          records.map((record) => [record.slotId, record])
        );

        setDispatches((current) =>
          current.map((item) => {
            const record = stored.get(item.id);

            return {
              ...item,
              attachment: record
                ? {
                    name: record.name,
                    size: record.size,
                    updatedAt: record.updatedAt,
                  }
                : null,
            };
          })
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSaveError(true);
          setMessage("Não foi possível consultar os PDFs armazenados.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [automation.id, listPdfs]);

  const totalAnexados = useMemo(
    () => dispatches.filter((item) => Boolean(item.attachment?.name)).length,
    [dispatches]
  );

  const updateDispatch = (
    id: string,
    patch: Partial<PlannerDispatch>
  ) => {
    setDispatches((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, ...patch }
          : item
      )
    );
  };

  const handlePdfSelect = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.size > 10 * 1024 * 1024 ||
      file.size < 8
    ) {
      setSaveError(true);
      setMessage("Escolha um PDF válido de até 10 MB.");
      return;
    }

    setUploadingSlot(id);
    setMessage("");
    setSaveError(false);

    try {
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;

          if (typeof result !== "string") {
            reject(new Error("Falha ao ler o PDF."));
            return;
          }

          const base64 = result.split(",")[1];

          if (!base64) {
            reject(new Error("PDF sem conteúdo válido."));
            return;
          }

          resolve(base64);
        };

        reader.onerror = () => reject(
          new Error("Falha ao ler o arquivo.")
        );

        reader.readAsDataURL(file);
      });

      const saved = await uploadPdf({
        data: {
          automationId: automation.id,
          slotId: id,
          fileName: file.name,
          pdfBase64,
        },
      });

      updateDispatch(id, {
        attachment: {
          name: saved.name,
          size: saved.size,
          updatedAt: saved.updatedAt,
        },
      });

      setMessage("PDF armazenado na VPS com sucesso.");
    } catch (error) {
      setSaveError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível armazenar o PDF."
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDownloadPdf = async (id: string) => {
    setMessage("");
    setSaveError(false);

    try {
      const result = await downloadPdf({
        data: {
          automationId: automation.id,
          slotId: id,
        },
      });

      const binary = atob(result.pdfBase64);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setSaveError(true);
      setMessage("Não foi possível recuperar o PDF armazenado.");
    }
  };

  const handleSavePlanner = async () => {
    setSaving(true);
    setMessage("");
    setSaveError(false);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          storageKey(automation.id),
          JSON.stringify(dispatches)
        );
      }

      if (onSaveDraft) {
        await onSaveDraft(automation, automation.nodes || []);
      }

      setMessage("Configuração visual salva com sucesso.");
    } catch {
      setSaveError(true);
      setMessage(
        "Não foi possível salvar a configuração visual."
      );
    } finally {
      setSaving(false);
    }
  };

  if (builderOpen) {
    return (
      <WorkflowBuilder
        automation={automation}
        onClose={() => setBuilderOpen(false)}
        onSaveDraft={onSaveDraft}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-8 py-7 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
                  Configuração da automação
                </div>
                <h1 className="mt-2 text-3xl font-bold leading-tight">
                  {automation.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Defina os disparos, organize os dias ou eventos e anexe o PDF correspondente a cada comunicação.
                </p>
              </div>

              <div className="grid min-w-[280px] gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Disparos configurados</span>
                  <strong>{dispatches.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PDFs anexados</span>
                  <strong>{totalAnexados}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tipo</span>
                  <strong>
                    {automation.id === "digitale-interesse"
                      ? "Por interesse"
                      : "Por agenda"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              {dispatches.map((item, index) => (
                <section
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {item.kind === "day" ? "Disparo agendado" : "Disparo por evento"}
                        </div>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">
                          {item.title}
                        </h2>
                      </div>
                    </div>

                    <span
                      className={
                        item.attachment?.name
                          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                          : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                      }
                    >
                      {uploadingSlot === item.id
                        ? "Enviando PDF..."
                        : item.attachment?.name
                          ? "PDF armazenado"
                          : "PDF pendente"}
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        {item.kind === "day" ? "Dia do disparo" : "Evento de disparo"}
                      </span>

                      {item.kind === "day" ? (
                        <select
                          value={item.scheduleLabel}
                          onChange={(event) =>
                            updateDispatch(item.id, {
                              scheduleLabel: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500"
                        >
                          {weekOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={item.scheduleLabel}
                          onChange={(event) =>
                            updateDispatch(item.id, {
                              scheduleLabel: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500"
                        />
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        PDF do disparo
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(event) =>
                          void handlePdfSelect(item.id, event)
                        }
                        disabled={uploadingSlot !== null}
                        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-700"
                      />
                    </label>

                    <label className="block lg:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Título da comunicação
                      </span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          updateDispatch(item.id, {
                            title: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500"
                      />
                    </label>

                    <label className="block lg:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Objetivo / resumo do disparo
                      </span>
                      <textarea
                        value={item.summary}
                        onChange={(event) =>
                          updateDispatch(item.id, {
                            summary: event.target.value,
                          })
                        }
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500"
                      />
                    </label>
                  </div>

                  {item.attachment?.name ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      <strong>Arquivo:</strong> {item.attachment.name}
                      <button
                        type="button"
                        onClick={() => void handleDownloadPdf(item.id)}
                        className="ml-3 font-semibold underline"
                      >
                        Baixar PDF
                      </button>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Ações
                </h3>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleSavePlanner}
                    disabled={saving}
                    className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar configuração"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuilderOpen(true)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Abrir construtor visual
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                </div>

                {message ? (
                  <div
                    role={saveError ? "alert" : "status"}
                    className={
                      saveError
                        ? "mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        : "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    }
                  >
                    {message}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Resumo rápido
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Automação</span>
                    <strong className="text-right">{automation.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gatilho base</span>
                    <strong className="text-right">{automation.trigger}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>PDFs anexados</span>
                    <strong>{totalAnexados}</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
