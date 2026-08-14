import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Plus, 
  Play, 
  Clock, 
  Zap, 
  MoreHorizontal, 
  ChevronRight,
  Pause,
  Trash2,
  Copy,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Automation } from "@/components/automations/automation-types";
import { WorkflowBuilder } from "@/components/automations/WorkflowBuilder";

const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Boas-vindas - Novos Clientes",
    status: "active",
    trigger: "Novo contato",
    activeContacts: 124,
    lastRun: "Há 12 minutos",
    nodes: [
      { id: "n1", type: "trigger", label: "Novo contato adicionado", description: "Lista: Clientes Varejo" },
      { id: "n2", type: "action", label: "Enviar e-mail: Boas-vindas", description: "Template: Welcome_Premium" },
      { id: "n3", type: "action", label: "Esperar 2 dias", description: "Aguardar interação" },
      { id: "n4", type: "condition", label: "Abriu e-mail?", description: "Verificar engajamento" }
    ]
  },
  {
    id: "2",
    name: "Recuperação de Carrinho - 24h",
    status: "inactive",
    trigger: "Evento: Carrinho Abandonado",
    activeContacts: 0,
    lastRun: "Ontem, 18:30",
    nodes: [
      { id: "c1", type: "trigger", label: "Carrinho Abandonado", description: "Trigger API / Webhook" },
      { id: "c2", type: "action", label: "Esperar 1 hora", description: "Intervalo de segurança" },
      { id: "c3", type: "action", label: "Enviar e-mail: Não esqueça!", description: "Template: Cart_Recovery" }
    ]
  },
  {
    id: "3",
    name: "Nutrição de Leads - Inverno 2024",
    status: "active",
    trigger: "Entrou em lista",
    activeContacts: 852,
    lastRun: "Há 4 horas",
    nodes: [
      { id: "l1", type: "trigger", label: "Entrou na lista Leads Inverno", description: "Origem: Landing Page" }
    ]
  }
];

export const Route = createFileRoute("/_authenticated/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  const handleCreate = () => {
    setSelectedAutomation({
      id: "new",
      name: "Nova Automação",
      status: "draft",
      trigger: "Selecionar gatilho",
      activeContacts: 0,
      lastRun: "Nunca executada",
      nodes: [{ id: "start", type: "trigger", label: "Clique para definir o gatilho" }]
    });
    setIsBuilderOpen(true);
  };

  const handleEdit = (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsBuilderOpen(true);
  };

  if (isBuilderOpen && selectedAutomation) {
    return (
      <WorkflowBuilder 
        automation={selectedAutomation} 
        onClose={() => setIsBuilderOpen(false)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Automações</h1>
          <p className="text-muted-foreground mt-1">Crie jornadas personalizadas para seus contatos.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Criar automação
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex-1">
          <Input placeholder="Buscar automações..." className="max-w-xs" />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-muted">Todos</Badge>
          <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted">Ativos</Badge>
          <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted">Inativos</Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl ring-1 ring-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold py-4">Nome da Automação</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Gatilho Principal</TableHead>
              <TableHead className="font-bold text-center">Contatos Ativos</TableHead>
              <TableHead className="font-bold">Última Execução</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAutomations.map((automation) => (
              <TableRow key={automation.id} className="group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleEdit(automation)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      automation.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                    )}>
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">{automation.name}</span>
                      <span className="text-xs text-muted-foreground">{automation.nodes.length} passos no fluxo</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={automation.status === "active" ? "default" : "secondary"}
                    className={cn(
                      "font-bold text-[10px] uppercase",
                      automation.status === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                    )}
                  >
                    {automation.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {automation.trigger}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono font-medium">{automation.activeContacts.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {automation.lastRun}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(automation)}>
                        <Settings2 className="mr-2 h-4 w-4" /> Editar Fluxo
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" /> Ver Relatório
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      {automation.status === "active" ? (
                        <DropdownMenuItem className="text-amber-600">
                          <Pause className="mr-2 h-4 w-4" /> Pausar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-emerald-600">
                          <Play className="mr-2 h-4 w-4" /> Ativar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

