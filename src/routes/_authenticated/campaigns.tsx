import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Calendar, 
  ChevronRight,
  Send,
  Clock,
  FileText,
  Play,
  CheckCircle2,
  Users,
  Layout,
  Settings,
  ArrowLeft,
  Monitor,
  Smartphone,
  Info,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
});

// --- Mock Data ---

const campaigns: any[] = [];

const steps = [
  { id: 1, label: "Informações", icon: Info },
  { id: 2, label: "Destinatários", icon: Users },
  { id: 3, label: "Design", icon: Layout },
  { id: 4, label: "Configurações", icon: Settings },
  { id: 5, label: "Revisão", icon: CheckCircle2 },
];

// --- Sub-components ---

function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative mb-12 flex justify-between">
      <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted/50" />
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
            <div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                isActive ? "border-accent bg-background text-accent shadow-md scale-110" : 
                isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                "border-muted bg-background text-muted-foreground"
              )}
            >
              {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CampaignWizard({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: "",
    subject: "",
    sender: "Digitale Têxtil",
    senderEmail: "marketing@digitaletextil.com.br",
    replyTo: "contato@digitaletextil.com.br"
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevStep} disabled={step === 1} className="font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary">Criar nova campanha</h2>
          <p className="text-xs text-muted-foreground">Etapa {step} de 5</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground hover:text-red-500">
          Cancelar
        </Button>
      </div>

      <WizardProgress currentStep={step} />

      <div className="rounded-2xl border bg-card p-8 shadow-sm min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Informações da campanha</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome da campanha (interno)</Label>
                <Input id="name" placeholder="Ex: Lançamento Primavera 2026" className="h-10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="subject">Assunto do e-mail</Label>
                <Input id="subject" placeholder="Confira as novidades da nova estação" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender">Nome do remetente</Label>
                <Input id="sender" defaultValue="Digitale Têxtil" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">E-mail do remetente</Label>
                <Input id="senderEmail" defaultValue="marketing@digitaletextil.com.br" className="h-10" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-primary">Quem receberá esta campanha?</h3>
            <div className="grid gap-4">
              {["Listas", "Segmentos"].map(type => (
                <div key={type} className="rounded-xl border p-6 hover:border-primary/20 hover:bg-muted/5 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-primary">{type}</p>
                        <p className="text-xs text-muted-foreground">Selecione uma ou mais {type.toLowerCase()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold">Selecionar</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-lg bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3 text-emerald-700">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium"><strong>2.384 contatos</strong> serão alcançados.</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300 text-center py-12">
            <h3 className="text-2xl font-bold text-primary">Escolha o design</h3>
            <p className="text-muted-foreground">Como você deseja criar o conteúdo do seu e-mail?</p>
            <div className="grid gap-6 sm:grid-cols-2 mt-8">
              <div className="group rounded-2xl border-2 border-dashed p-10 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted group-hover:bg-accent/20 flex items-center justify-center text-muted-foreground group-hover:text-accent mb-4 transition-colors">
                  <Plus size={32} />
                </div>
                <p className="font-bold text-primary">Criar do zero</p>
                <p className="text-xs text-muted-foreground mt-1">Use nosso editor drag & drop</p>
              </div>
              <div className="group rounded-2xl border p-10 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted group-hover:bg-accent/20 flex items-center justify-center text-muted-foreground group-hover:text-accent mb-4 transition-colors">
                  <Layout size={32} />
                </div>
                <p className="font-bold text-primary">Escolher template</p>
                <p className="text-xs text-muted-foreground mt-1">Use um de nossos modelos prontos</p>
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
                    { label: "Destinatários", value: "2.384 contatos (Clientes VIP)", icon: Users },
                    { label: "Assunto", value: "Confira as novidades da nova estação", icon: Info },
                    { label: "Remetente", value: "Digitale Têxtil <marketing@digitaletextil.com.br>", icon: Mail },
                    { label: "Template", value: "Coleção Verão 2026 - v2", icon: Layout },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 text-accent"><CheckCircle2 size={16} /></div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium text-primary">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 font-bold">Enviar teste</Button>
                  <Button variant="outline" className="flex-1 font-bold">Agendar</Button>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="text-xs font-bold text-primary uppercase">Preview</p>
                  <div className="flex gap-2">
                    <Monitor size={14} className="text-primary" />
                    <Smartphone size={14} className="text-muted-foreground" />
                  </div>
                </div>
                <div className="bg-white rounded border h-[200px] flex items-center justify-center text-[10px] text-muted-foreground">
                  Simulação do conteúdo do e-mail
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-between border-t pt-6">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1} className="font-bold text-muted-foreground">Anterior</Button>
          <Button 
            onClick={nextStep} 
            className={cn(
              "font-bold px-8 shadow-md active:scale-95 transition-all",
              step === 5 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-accent text-accent-foreground"
            )}
          >
            {step === 5 ? "Enviar agora" : "Continuar"} {step !== 5 && <ChevronRight size={18} className="ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampaignsPage() {
  const [isCreating, setIsCreating] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("Todas");

  if (isCreating) {
    return <CampaignWizard onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Campanhas</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Gestão profissional de envios para a Digitale Têxtil.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6"
        >
          <Plus size={18} className="mr-2" />
          Nova Campanha
        </Button>
      </div>


      {/* Filters Tabs */}
      <Tabs defaultValue="Todas" className="w-full">
        <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto no-scrollbar">
          {["Todas", "Enviadas", "Agendadas", "Rascunhos", "Em andamento"].map(status => (
            <TabsTrigger 
              key={status} 
              value={status} 
              onClick={() => setStatusFilter(status)}
              className="text-xs font-bold data-[state=active]:text-primary"
            >
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="mt-6 rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 py-4 pl-6">Campanha</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Tipo</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Data</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Destinatários</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Abertura</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Cliques</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Status</TableHead>
                <TableHead className="w-[50px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((camp) => (
                <TableRow key={camp.id} className="group hover:bg-secondary/40 transition-all cursor-pointer">

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{camp.name}</span>
                      <span className="text-[10px] text-muted-foreground">ID: #{camp.id}00{camp.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter">
                      {camp.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{camp.date}</TableCell>
                  <TableCell className="text-xs font-medium">{camp.recipients.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-bold text-primary">{camp.open}</TableCell>
                  <TableCell className="text-xs font-bold text-primary">{camp.clicks}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold border-none",
                        camp.status === 'Enviada' && "bg-emerald-100 text-emerald-700",
                        camp.status === 'Agendada' && "bg-blue-100 text-blue-700",
                        camp.status === 'Rascunho' && "bg-gray-100 text-gray-700",
                        camp.status === 'Em andamento' && "bg-orange-100 text-orange-700"
                      )}
                    >
                      {camp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Ver Relatório</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
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
