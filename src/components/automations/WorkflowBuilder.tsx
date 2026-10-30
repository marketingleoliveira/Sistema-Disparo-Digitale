import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Mail, 
  Clock, 
  Plus, 
  Settings2, 
  ChevronRight, 
  MoreHorizontal,
  Zap,
  Split,
  Tag,
  Eye,
  MousePointer2,
  Trash2,
  Copy,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// DIGITALE_WORKFLOW_REDESIGN_V1
import "./WorkflowBuilder-redesign.css";
// DIGITALE_EDITOR_RULES_INTEGRATION_V1
import {
  canInsertAutomationActionAfter,
  canDuplicateAutomationNode,
} from "@/lib/disparo-automation-editor-rules.mjs";
import { 
  Automation, 
  AutomationNode, 
  NodeType 
} from "./automation-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowBuilderProps {
  automation: Automation;
  onClose: () => void;
  onSaveDraft?: ((
    automation: Automation,
    nodes: AutomationNode[]
  ) => Promise<void>) | undefined;
}

export function WorkflowBuilder({
  automation,
  onClose,
  onSaveDraft,
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<AutomationNode[]>(automation.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  const handleSaveDraft = async () => {
    if (!onSaveDraft || saving) return;

    setSaving(true);
    setSaveMessage("");
    setSaveError(false);

    try {
      await onSaveDraft(automation, nodes);
      setSaveMessage("Rascunho salvo com sucesso.");
    } catch {
      setSaveError(true);
      setSaveMessage(
        "Nao foi possivel salvar o rascunho. Nenhuma ativacao foi realizada."
      );
    } finally {
      setSaving(false);
    }
  };

  const isProtectedNode = (node: AutomationNode) => {
    const protectedIds: Record<string, string[]> = {
      "digitale-newsletter": ["newsletter-1", "newsletter-2"],
      "digitale-clientes": ["clientes-1", "clientes-2"],
      "digitale-interesse": ["interesse-1", "interesse-2", "interesse-3"],
    };

    return (
      node.type === "trigger" ||
      (protectedIds[automation.id] ?? []).includes(node.id)
    );
  };

  const makeNodeId = () =>
    `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const duplicateNode = (id: string) => {
    if (saving || nodes.length >= 100) return;

    const index = nodes.findIndex((node) => node.id === id);
    const original = nodes[index];

    if (!original || isProtectedNode(original)) return;
    if (!canDuplicateAutomationNode(automation.id, nodes, id)) return;

    // DIGITALE_DUPLICATE_POSITION_GUARD_V1
    if (
      nodes.slice(index + 1).some((item) =>
        item.type === "condition" && isProtectedNode(item)
      )
    ) return;

    const { nextIds, ...fields } = original;

    const copy: AutomationNode = {
      ...fields,
      id: makeNodeId(),
      label: `${original.label} (cópia)`.slice(0, 191),
    };

    const updated = [...nodes];
    updated.splice(index + 1, 0, copy);

    setNodes(updated);
    setSaveMessage("");
  };

  const deleteNode = (id: string) => {
    if (saving) return;

    const target = nodes.find((node) => node.id === id);

    if (
      !target ||
      isProtectedNode(target) ||
      nodes.length <= 1
    ) return;

    setNodes(
      nodes.filter((node) => node.id !== id).map((node) => ({
        ...node,
        ...(node.nextIds
          ? { nextIds: node.nextIds.filter((nextId) => nextId !== id) }
          : {}),
      }))
    );

    setSelectedNodeId(null);
    setSaveMessage("");
  };

  const addNodeAfter = (id: string) => {
    if (saving || nodes.length >= 100) return;

    const index = nodes.findIndex((node) => node.id === id);
    if (index < 0) return;

    // DIGITALE_EDITOR_PROTECTED_INSERTION_V1
    // Acoes novas devem vir apos todas as verificacoes essenciais.
    const requiredConditionIds: Record<string, string[]> = {
      "digitale-newsletter": ["newsletter-2"],
      "digitale-clientes": ["clientes-2"],
      "digitale-interesse": ["interesse-2", "interesse-3"],
    };

    const lastRequiredIndex = Math.max(
      ...(
        requiredConditionIds[automation.id] ?? []
      ).map((requiredId) =>
        nodes.findIndex((node) => node.id === requiredId)
      )
    );

    if (index < lastRequiredIndex) return;
    if (!canInsertAutomationActionAfter(automation.id, nodes, id)) return;

    const newNode: AutomationNode = {
      id: makeNodeId(),
      type: "action",
      label: "Nova ação",
      description: "Configure esta etapa antes de salvar.",
    };

    const updated = [...nodes];
    updated.splice(index + 1, 0, newNode);

    setNodes(updated);
    setSaveMessage("");
  };

  const getNodeStyles = (type: NodeType) => {
    switch (type) {
      case "trigger":
        return "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "action":
        return "border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400";
      case "condition":
        return "border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400";
      default:
        return "border-border bg-card text-foreground";
    }
  };

  const getIcon = (type: NodeType, label: string) => {
    if (type === "trigger") return <Zap className="h-4 w-4" />;
    if (label.includes("e-mail")) return <Mail className="h-4 w-4" />;
    if (label.includes("Esperar")) return <Clock className="h-4 w-4" />;
    if (type === "condition") return <Split className="h-4 w-4" />;
    return <Settings2 className="h-4 w-4" />;
  };

  // DIGITALE_SIDEBAR_REDESIGN_V1
  const sidebarDescriptions: Record<string, string> = {
    "Novo contato": "Contato adicionado à base.",
    "Entrou em lista": "Entrada em uma lista específica.",
    "Data específica": "Agendamento por data e horário.",
    "Enviar e-mail": "Etapa de comunicação por e-mail.",
    "Adicionar tag": "Organização e segmentação.",
    "Esperar": "Intervalo entre etapas.",
    "Abriu e-mail?": "Verificação de abertura.",
    "Clicou?": "Verificação de clique.",
    "Está em lista?": "Verificação de associação à lista.",
  };

  const renderNode = (node: AutomationNode, isLast: boolean = false) => {
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
          onClick={() => setSelectedNodeId(node.id)}
        >
          <Card
            data-node-type={node.type}
            className={cn(
            "w-64 p-4 cursor-pointer transition-all border-2 digitale-flow-node",
            getNodeStyles(node.type),
            isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : "hover:border-primary/50"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                node.type === "trigger" ? "bg-emerald-100 dark:bg-emerald-900/50" :
                node.type === "action" ? "bg-blue-100 dark:bg-blue-900/50" :
                "bg-amber-100 dark:bg-amber-900/50"
              )}>
                {getIcon(node.type, node.label)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                  {node.type === "trigger" ? "Gatilho" : node.type === "action" ? "Ação" : "Condição"}
                </p>
                <h4 className="font-semibold text-sm truncate">{node.label}</h4>
                {node.description && (
                  <p className="text-xs opacity-80 mt-1 line-clamp-1">{node.description}</p>
                )}
              </div>
            </div>

            {/* Ações rápidas no hover */}
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full shadow-sm"
                title="Duplicar etapa"
                disabled={
                  saving ||
                  nodes.length >= 100 ||
                  !canDuplicateAutomationNode(automation.id, nodes, node.id) ||
                    isProtectedNode(node) ||
                  nodes.slice(nodes.findIndex((item) => item.id === node.id) + 1)
                    .some((item) =>
                      item.type === "condition" && isProtectedNode(item)
                    )
                }
                onClick={(event) => {
                  event.stopPropagation();
                  duplicateNode(node.id);
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 rounded-full shadow-sm"
                title="Excluir etapa"
                disabled={saving || isProtectedNode(node) || nodes.length <= 1}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteNode(node.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* DIGITALE_FINAL_ACTION_BUTTON_V1 */}
        {(!isLast ||
          canInsertAutomationActionAfter(
            automation.id,
            nodes,
            node.id
          )) && (
          <div className="flex flex-col items-center py-6 relative">
            <div className="w-0.5 h-full bg-border absolute left-1/2 -translate-x-1/2" />
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8 rounded-full bg-background border-2 hover:bg-primary hover:text-white transition-colors relative z-10 digitale-add-action"
              title="Adicionar ação"
              disabled={
                saving ||
                nodes.length >= 100 ||
                !canInsertAutomationActionAfter(automation.id, nodes, node.id) ||
                    nodes.slice(nodes.findIndex((item) => item.id === node.id) + 1)
                  .some((item) =>
                    item.type === "condition" && isProtectedNode(item)
                  )
              }
              onClick={() => addNodeAfter(node.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col digitale-workflow-redesign">
      {/* Header do Builder */}
      <div className="h-16 border-b px-6 flex items-center justify-between bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg">{automation.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-200">
                Rascunho — desativado
              </Badge>
              <span className="text-xs text-muted-foreground">Automação não publicada</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-1 mr-4">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>-</Button>
            <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>+</Button>
          </div>
          <Button variant="outline" disabled title="Simulação ainda não disponível">Testar fluxo (indisponível)</Button>
          <Button
            className="digitale-save-draft"
            onClick={handleSaveDraft}
            disabled={!onSaveDraft || saving}
          >
            {saving ? "Salvando..." : "Salvar rascunho"}
          </Button>
          {saveMessage && (
            <span
              role={saveError ? "alert" : "status"}
              className={
                saveError
                  ? "text-xs text-destructive"
                  : "text-xs text-emerald-600"
              }
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Painel Esquerdo - Biblioteca de Blocos */}
        <div className="w-72 border-r bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-y-auto space-y-6 digitale-flow-sidebar">
          <div>
            <div className="digitale-sidebar-heading"><h3>Gatilhos</h3><p>Inicie o fluxo quando algo acontecer.</p></div>
            <div className="grid gap-2">
              {[
                { label: "Novo contato", icon: <Zap className="h-4 w-4" /> },
                { label: "Entrou em lista", icon: <Tag className="h-4 w-4" /> },
                { label: "Data específica", icon: <Clock className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-emerald-500 flex items-center gap-3 transition-colors digitale-sidebar-item">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded">
                    {b.icon}
                  </div>
                  <div className="digitale-sidebar-copy">
                    <span className="digitale-sidebar-name">
                      {b.label}
                    </span>
                    <span className="digitale-sidebar-description">
                      {sidebarDescriptions[b.label]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="digitale-sidebar-heading"><h3>Ações</h3><p>Defina os próximos passos do fluxo.</p></div>
            <div className="grid gap-2">
              {[
                { label: "Enviar e-mail", icon: <Mail className="h-4 w-4" /> },
                { label: "Adicionar tag", icon: <Tag className="h-4 w-4" /> },
                { label: "Esperar", icon: <Clock className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-blue-500 flex items-center gap-3 transition-colors digitale-sidebar-item">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded">
                    {b.icon}
                  </div>
                  <div className="digitale-sidebar-copy">
                    <span className="digitale-sidebar-name">
                      {b.label}
                    </span>
                    <span className="digitale-sidebar-description">
                      {sidebarDescriptions[b.label]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="digitale-sidebar-heading"><h3>Condições</h3><p>Organize as verificações do fluxo.</p></div>
            <div className="grid gap-2">
              {[
                { label: "Abriu e-mail?", icon: <Eye className="h-4 w-4" /> },
                { label: "Clicou?", icon: <MousePointer2 className="h-4 w-4" /> },
                { label: "Está em lista?", icon: <Tag className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-amber-500 flex items-center gap-3 transition-colors digitale-sidebar-item">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded">
                    {b.icon}
                  </div>
                  <div className="digitale-sidebar-copy">
                    <span className="digitale-sidebar-name">
                      {b.label}
                    </span>
                    <span className="digitale-sidebar-description">
                      {sidebarDescriptions[b.label]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Central - DIGITALE_CANVAS_REFINEMENT_V1 */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative overflow-auto pattern-grid digitale-canvas-shell">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div 
            className="min-h-full min-w-full p-20 flex flex-col items-center transition-transform duration-200 origin-center digitale-flow-canvas"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* DIGITALE_VISUAL_CONNECTIONS_V1 */}
            <div className="mb-8 max-w-xl rounded-lg border bg-background p-4 text-center text-sm text-muted-foreground digitale-flow-notice">
              <p className="font-semibold text-foreground">
                Sequência visual do rascunho
              </p>
              <p className="mt-1">
                As linhas verticais representam a ordem exibida.
                Conexões explícitas são identificadas abaixo de cada etapa.
                Este editor não executa automações.
              </p>
            </div>

            {nodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {renderNode(node, index === nodes.length - 1)}
                {node.nextIds !== undefined && (
                  <div className="mb-4 max-w-sm rounded-md border border-dashed px-3 py-2 text-center text-xs text-muted-foreground">
                    <span className="font-semibold">
                      Conexões explícitas:
                    </span>{" "}
                    {node.nextIds.length
                      ? node.nextIds.join(", ")
                      : "nenhuma"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito - Propriedades - DIGITALE_PROPERTIES_REDESIGN_V1 */}
        <AnimatePresence>
          {selectedNodeId && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-80 border-l bg-white dark:bg-zinc-950 p-6 overflow-y-auto digitale-properties-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold digitale-properties-title">Propriedades</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNodeId(null)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Passo</label>
                  <input 
                    className="w-full bg-zinc-50 border rounded-lg p-2 text-sm digitale-properties-input"
                    value={nodes.find(n => n.id === selectedNodeId)?.label || ""}
                    disabled={nodes.some(
                      (node) => node.id === selectedNodeId && isProtectedNode(node)
                    )}
                    onChange={(e) => {
                      const newNodes = nodes.map(n => 
                        n.id === selectedNodeId ? { ...n, label: e.target.value } : n
                      );
                      setNodes(newNodes);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Configuração</label>
                  <div className="p-4 bg-zinc-50 rounded-lg border text-sm text-muted-foreground italic text-center digitale-properties-placeholder">
                    Parâmetros específicos do bloco aparecerão aqui.
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    disabled={
                      saving ||
                      nodes.length <= 1 ||
                      nodes.some((node) => node.id === selectedNodeId && isProtectedNode(node))
                    }
                    onClick={() => {
                      if (selectedNodeId) deleteNode(selectedNodeId);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Passo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
