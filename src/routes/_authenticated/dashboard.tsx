import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const stats = [
  { label: "Total de contatos", value: "24.512", icon: Users, trend: "+12%", trendType: "up" },
  { label: "Contatos ativos", value: "18.203", icon: Users, trend: "+5%", trendType: "up" },
  { label: "E-mails enviados", value: "145.890", icon: Mail, trend: "+18%", trendType: "up" },
  { label: "Taxa de abertura", value: "24.8%", icon: Mail, trend: "-2%", trendType: "down" },
  { label: "Taxa de cliques", value: "3.2%", icon: MousePointer2, trend: "+0.5%", trendType: "up" },
  { label: "Descadastros", value: "0.8%", icon: AlertCircle, trend: "-0.1%", trendType: "up" },
];

const contactGrowthData = [
  { name: "Jan", total: 12000 },
  { name: "Fev", total: 13500 },
  { name: "Mar", total: 15000 },
  { name: "Abr", total: 18000 },
  { name: "Mai", total: 21000 },
  { name: "Jun", total: 24512 },
];

const engagementData = [
  { name: "Muito Engajados", value: 4500, color: "oklch(0.20 0.05 260)" },
  { name: "Engajados", value: 8200, color: "oklch(0.90 0.15 50)" },
  { name: "Pouco Engajados", value: 3500, color: "oklch(0.85 0.02 260)" },
  { name: "Inativos", value: 2003, color: "oklch(0.50 0.20 30)" },
];

const lastCampaigns = [
  { id: 1, name: "Lançamento Coleção Verão", date: "12/08/2026", recipients: 15420, delivered: "99.2%", open: "32.1%", clicks: "5.4%", status: "Enviado" },
  { id: 2, name: "Promoção Dia dos Pais", date: "05/08/2026", recipients: 22100, delivered: "98.8%", open: "28.5%", clicks: "4.2%", status: "Enviado" },
  { id: 3, name: "Newsletter Semanal #32", date: "01/08/2026", recipients: 24000, delivered: "99.5%", open: "25.2%", clicks: "3.1%", status: "Enviado" },
  { id: 4, name: "Webinar Tecnologias Têxteis", date: "28/07/2026", recipients: 5200, delivered: "99.1%", open: "45.8%", clicks: "12.2%", status: "Enviado" },
];

function DashboardPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Analise o desempenho das suas campanhas em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted/50">
            Exportar dados
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 active:scale-95">
            <Plus className="h-4 w-4" />
            Criar campanha
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="group rounded-xl border bg-card p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="rounded-md bg-secondary p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <stat.icon className="h-4 w-4" />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                stat.trendType === "up" 
                  ? (stat.label === "Descadastros" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600") 
                  : "bg-red-50 text-red-600"
              )}>
                {stat.trendType === "up" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</h3>
              <p className="mt-1 text-2xl font-bold text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Evolução de contatos</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Últimos 6 meses
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contactGrowthData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.20 0.05 260)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="oklch(0.20 0.05 260)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 260)" />
                <XAxis dataKey="name" stroke="oklch(0.45 0.02 260)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="oklch(0.45 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} dx={-10} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="oklch(0.20 0.05 260)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <h3 className="mb-4 text-lg font-semibold">Engajamento da Base</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {engagementData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Campaigns Table */}
      <div className="rounded-xl border bg-card shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-center justify-between bg-muted/20 border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Últimas campanhas</h3>
          <Link to="/campaigns" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Campanha</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Destinatários</th>
                <th className="px-6 py-3">Entregues</th>
                <th className="px-6 py-3">Abertura</th>
                <th className="px-6 py-3">Cliques</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lastCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">{campaign.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{campaign.date}</td>
                  <td className="px-6 py-4">{campaign.recipients.toLocaleString()}</td>
                  <td className="px-6 py-4">{campaign.delivered}</td>
                  <td className="px-6 py-4">{campaign.open}</td>
                  <td className="px-6 py-4">{campaign.clicks}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Utility function (simplified version of cn)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
