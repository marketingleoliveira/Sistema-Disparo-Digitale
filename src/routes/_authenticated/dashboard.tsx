import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  UserMinus, 
  AlertOctagon,
  TrendingUp, 
  TrendingDown,
  Calendar,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  ChevronRight,
  Send,
  UserPlus,
  CheckCircle2,
  Clock,
  Bell
} from "lucide-react";

import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// --- Mock Data ---

const kpiStats = [
  { label: "Contatos", value: "24.512", trend: "12,4%", trendType: "up", icon: Users },
  { label: "E-mails enviados", value: "1.2M", trend: "8,2%", trendType: "up", icon: Mail },
  { label: "Taxa de abertura", value: "24,8%", trend: "2,1%", trendType: "down", icon: ArrowUpRight },
  { label: "Taxa de cliques", value: "3,2%", trend: "0,5%", trendType: "up", icon: MousePointer2 },
  { label: "Descadastros", value: "42", trend: "1,2%", trendType: "down", icon: UserMinus },
  { label: "Bounce", value: "0,8%", trend: "0,2%", trendType: "up", icon: AlertOctagon },
];

const performanceData = [
  { name: "Seg", enviados: 12000, aberturas: 4200, cliques: 800 },
  { name: "Ter", enviados: 15000, aberturas: 5100, cliques: 950 },
  { name: "Qua", enviados: 18000, aberturas: 6200, cliques: 1200 },
  { name: "Qui", enviados: 14000, aberturas: 4800, cliques: 850 },
  { name: "Sex", enviados: 22000, aberturas: 7500, cliques: 1500 },
  { name: "Sáb", enviados: 8000, aberturas: 2800, cliques: 400 },
  { name: "Dom", enviados: 5000, aberturas: 1500, cliques: 200 },
];

const engagementLevels = [
  { name: "Muito engajados", value: 45, color: "oklch(0.20 0.05 260)" },
  { name: "Engajados", value: 30, color: "oklch(0.65 0.20 45)" },
  { name: "Pouco engajados", value: 15, color: "oklch(0.97 0.01 260)" },
  { name: "Inativos", value: 10, color: "oklch(0.85 0.02 260)" },
];

const recentCampaigns = [
  { id: 1, name: "Lançamento Coleção Verão 2026", date: "14 Ago, 2026", recipients: 24512, open: "32,4%", clicks: "5,8%", status: "Enviada" },
  { id: 2, name: "Webinar: Tendências Têxteis", date: "16 Ago, 2026", recipients: 1200, open: "-", clicks: "-", status: "Agendada" },
  { id: 3, name: "Newsletter Semanal #42", date: "12 Ago, 2026", recipients: 24100, open: "28,1%", clicks: "4,2%", status: "Enviada" },
  { id: 4, name: "Draft: Promoção Algodão Egípcio", date: "10 Ago, 2026", recipients: 0, open: "-", clicks: "-", status: "Rascunho" },
];

const activities = [
  { id: 1, type: "envio", title: "Campanha enviada", desc: "Lançamento Coleção Verão", time: "Há 2 horas", icon: Send },
  { id: 2, type: "contato", title: "Novo contato", desc: "joao.silva@exemplo.com", time: "Há 4 horas", icon: UserPlus },
  { id: 3, type: "automacao", title: "Automação ativada", desc: "Boas-vindas Cliente VIP", time: "Ontem", icon: CheckCircle2 },
  { id: 4, type: "agendamento", title: "Campanha agendada", desc: "Webinar: Tendências", time: "Ontem", icon: Clock },
];

// --- Components ---

function KpiCard({ stat }: { stat: typeof kpiStats[0] }) {
  const isUp = stat.trendType === "up";
  const isNeutral = stat.label === "Descadastros" || stat.label === "Bounce";
  
  const trendColor = isNeutral 
    ? (isUp ? "text-destructive bg-destructive/10" : "text-emerald-600 bg-emerald-50")
    : (isUp ? "text-emerald-600 bg-emerald-50" : "text-destructive bg-destructive/10");

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/5 p-2 text-primary shadow-inner">
          <stat.icon size={16} />
        </div>
        <div className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm", trendColor)}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {stat.trend}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
        <p className="text-2xl font-bold text-primary tracking-tight mt-0.5">{stat.value}</p>
      </div>
    </div>
  );
}


function EmptyState({ title, description, actionLabel }: { title: string, description: string, actionLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-4 rounded-full bg-secondary p-4 text-primary">
        <Mail size={32} />
      </div>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      <Button className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
        <Plus size={16} className="mr-2" />
        {actionLabel}
      </Button>
    </div>
  );
}

function DashboardPage() {
  const hasData = false; // Toggle for empty state testing

  if (!hasData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Visão geral</h1>
          <Button className="bg-accent text-accent-foreground"><Plus size={16} className="mr-2" /> Criar campanha</Button>
        </div>
        <EmptyState 
          title="Você ainda não enviou nenhuma campanha" 
          description="Comece agora a se comunicar com sua base de contatos e veja os resultados aqui."
          actionLabel="Criar primeira campanha"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Boa tarde, Leonardo!</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Confira as informações do seu painel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-border/60 hover:bg-secondary">
             Exportar Dados
          </Button>
          <Button className="w-full sm:w-auto bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6">
            <Plus size={18} className="mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>


      {/* Notifications Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold text-primary">Notificações Recentes</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[].map((notif, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 hover:bg-secondary/30 transition-colors">
              <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Bell size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">{notif.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{notif.desc}</p>
                <p className="text-[10px] text-muted-foreground/60">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Usuários Online</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-primary">0</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Em tempo real</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <UserPlus size={24} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Usuários</p>
            <span className="text-3xl font-black text-primary">1</span>
            <p className="text-[10px] text-muted-foreground font-medium">Ativos no sistema</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Users size={24} />
          </div>
        </div>
      </div>


      {/* Main Charts & Side Info Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-primary">Desempenho das campanhas</h3>
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
              {['7d', '30d', '90d', '12m'].map((period) => (
                <button 
                  key={period} 
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px] font-bold transition-all",
                    period === '7d' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorEnviados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>

                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 260)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: 'oklch(0.45 0.02 260)'}} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{fill: 'oklch(0.45 0.02 260)'}} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 260)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="enviados" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorEnviados)" />
                <Area type="monotone" dataKey="aberturas" stroke="var(--color-accent)" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="cliques" stroke="var(--color-muted-foreground)" strokeWidth={2} fill="transparent" />

              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Enviados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Aberturas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">Cliques</span>
            </div>
          </div>
        </div>

        {/* Engagement Level */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-base font-bold text-primary">Engajamento da base</h3>
          <div className="flex flex-col items-center">
            <div className="relative h-[180px] w-full max-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementLevels} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {engagementLevels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 w-full space-y-3">
              {engagementLevels.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table & Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaigns Table */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-base font-bold text-primary">Campanhas recentes</h3>
            <Link to="/campaigns" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Campanha</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Destinatários</th>
                  <th className="px-6 py-3">Abertura</th>
                  <th className="px-6 py-3">Cliques</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCampaigns.map((camp) => (
                  <tr key={camp.id} className="group hover:bg-secondary/40 transition-all cursor-pointer">
                    <td className="px-6 py-5 font-bold text-primary text-sm">{camp.name}</td>
                    <td className="px-6 py-5 text-xs font-medium text-muted-foreground">{camp.date}</td>
                    <td className="px-6 py-5 text-xs font-mono">{camp.recipients.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-5 text-xs">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-8 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: camp.open.replace('%', '').replace(',', '.') + '%' }} />
                         </div>
                         <span className="font-bold">{camp.open}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-primary">{camp.clicks}</td>
                    <td className="px-6 py-5">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-sm",
                          camp.status === 'Enviada' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                          camp.status === 'Agendada' && "bg-blue-50 text-blue-700 border-blue-100",
                          camp.status === 'Rascunho' && "bg-zinc-50 text-zinc-600 border-zinc-200",
                          camp.status === 'Em andamento' && "bg-orange-50 text-orange-700 border-orange-100"
                        )}
                      >
                        {camp.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Recent Activity Timeline */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-base font-bold text-primary">Atividade recente</h3>
          <div className="space-y-6">
            {activities.map((act, i) => (
              <div key={act.id} className="relative flex gap-4">
                {i !== activities.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-full w-[2px] bg-muted/50" />
                )}
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <act.icon size={14} />
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <p className="text-xs font-bold text-primary">{act.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{act.desc}</p>
                  <span className="text-[10px] text-muted-foreground/60">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-4 w-full text-xs font-bold text-muted-foreground hover:text-primary">
            Ver log completo
          </Button>
        </div>
      </div>
    </div>
  );
}
