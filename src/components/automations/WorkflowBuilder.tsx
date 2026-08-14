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
}

export function WorkflowBuilder({ automation, onClose }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<AutomationNode[]>(automation.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

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
          <Card className={cn(
            "w-64 p-4 cursor-pointer transition-all border-2",
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
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm">
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {!isLast && (
          <div className="flex flex-col items-center py-6 relative">
            <div className="w-0.5 h-full bg-border absolute left-1/2 -translate-x-1/2" />
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8 rounded-full bg-background border-2 hover:bg-primary hover:text-white transition-colors relative z-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
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
                Ativo
              </Badge>
              <span className="text-xs text-muted-foreground">Última edição há 2 horas</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-1 mr-4">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>-</Button>
            <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>+</Button>
          </div>
          <Button variant="outline">Testar fluxo</Button>
          <Button>Salvar e Ativar</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Painel Esquerdo - Biblioteca de Blocos */}
        <div className="w-72 border-r bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Gatilhos</h3>
            <div className="grid gap-2">
              {[
                { label: "Novo contato", icon: <Zap className="h-4 w-4" /> },
                { label: "Entrou em lista", icon: <Tag className="h-4 w-4" /> },
                { label: "Data específica", icon: <Clock className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-emerald-500 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded">
                    {b.icon}
                  </div>
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Ações</h3>
            <div className="grid gap-2">
              {[
                { label: "Enviar e-mail", icon: <Mail className="h-4 w-4" /> },
                { label: "Adicionar tag", icon: <Tag className="h-4 w-4" /> },
                { label: "Esperar", icon: <Clock className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-blue-500 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded">
                    {b.icon}
                  </div>
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Condições</h3>
            <div className="grid gap-2">
              {[
                { label: "Abriu e-mail?", icon: <Eye className="h-4 w-4" /> },
                { label: "Clicou?", icon: <MousePointer2 className="h-4 w-4" /> },
                { label: "Está em lista?", icon: <Tag className="h-4 w-4" /> }
              ].map(b => (
                <div key={b.label} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border shadow-sm hover:border-amber-500 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded">
                    {b.icon}
                  </div>
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Central */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative overflow-auto pattern-grid">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div 
            className="min-h-full min-w-full p-20 flex flex-col items-center transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {nodes.map((node, index) => renderNode(node, index === nodes.length - 1))}
          </div>
        </div>

        {/* Painel Direito - Propriedades */}
        <AnimatePresence>
          {selectedNodeId && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-80 border-l bg-white dark:bg-zinc-950 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">Propriedades</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNodeId(null)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Passo</label>
                  <input 
                    className="w-full bg-zinc-50 border rounded-lg p-2 text-sm"
                    value={nodes.find(n => n.id === selectedNodeId)?.label || ""}
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
                  <div className="p-4 bg-zinc-50 rounded-lg border text-sm text-muted-foreground italic text-center">
                    Parâmetros específicos do bloco aparecerão aqui.
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button variant="destructive" className="w-full gap-2">
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
