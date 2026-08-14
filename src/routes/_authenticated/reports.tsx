import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  CheckCircle2, 
  Eye, 
  MousePointer2, 
  AlertCircle, 
  UserMinus,
  Calendar,
  Filter,
  Users,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Cell,
  PieChart,
  Pie
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const performanceData = [
  { name: "Seg", open: 4000, click: 2400 },
  { name: "Ter", open: 3000, click: 1398 },
  { name: "Qua", open: 2000, click: 9800 },
  { name: "Qui", open: 2780, click: 3908 },
  { name: "Sex", open: 1890, click: 4800 },
  { name: "Sáb", open: 2390, click: 3800 },
  { name: "Dom", open: 3490, click: 4300 },
];

const growthData = [
  { name: "Jan", total: 10000 },
  { name: "Fev", total: 12500 },
  { name: "Mar", total: 15200 },
  { name: "Abr", total: 18900 },
  { name: "Mai", total: 22400 },
  { name: "Jun", total: 26800 },
];

const engagementData = [
  { name: "Muito Engajado", value: 45, color: "#0f172a" }, // Navy
  { name: "Engajado", value: 30, color: "#f97316" },      // Orange
  { name: "Pouco Engajado", value: 15, color: "#94a3b8" }, // Gray
  { name: "Inativo", value: 10, color: "#e2e8f0" },       // Light Gray
];

const topCampaigns = [
  { name: "Lançamento Coleção Verão", sent: "12,450", open: "28.5%", click: "8.2%", bounce: "0.5%", unsubs: "0.2%" },
  { name: "Newsletter Semanal #42", sent: "28,900", open: "22.1%", click: "4.5%", bounce: "0.8%", unsubs: "0.3%" },
  { name: "Promoção Relâmpago 48h", sent: "15,200", open: "35.2%", click: "12.4%", bounce: "0.4%", unsubs: "0.5%" },
  { name: "Reengajamento Clientes Inativos", sent: "5,400", open: "15.8%", click: "2.1%", bounce: "1.2%", unsubs: "0.8%" },
];

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function KPICard({ title, value, change, icon: Icon, trend }: { title: string, value: string, change: string, icon: any, trend: 'up' | 'down' }) {
  return (
    <Card className="shadow-sm border-none ring-1 ring-border overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsPage() {
  const [period, setPeriod] = useState("30");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Análise estratégica de performance para a Digitale Têxtil.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-card">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Enviados" value="48,250" change="+12%" icon={Mail} trend="up" />
        <KPICard title="Entregues" value="47,980" change="+11%" icon={CheckCircle2} trend="up" />
        <KPICard title="Aberturas" value="12,400" change="+8%" icon={Eye} trend="up" />
        <KPICard title="Cliques" value="3,850" change="+5%" icon={MousePointer2} trend="up" />
        <KPICard title="Bounce" value="0.45%" change="-2%" icon={AlertCircle} trend="down" />
        <KPICard title="Descadastros" value="0.12%" change="+1%" icon={UserMinus} trend="down" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Desempenho ao longo do tempo</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Aberturas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Cliques</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="open" 
                    stroke="#0f172a" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="click" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg ring-1 ring-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Engajamento da Base</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
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
            <div className="w-full space-y-2 mt-4">
              {engagementData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth & Top Campaigns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Crescimento da Base</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Evolução total de contatos ativos.</p>
            </div>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">+24% este ano</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#0f172a" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Melhores Campanhas</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold py-3 pl-6">Campanha</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-center">Abertura</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-center">Cliques</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCampaigns.map((camp, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="pl-6 py-4">
                      <span className="font-medium text-sm block truncate max-w-[200px]">{camp.name}</span>
                      <span className="text-[10px] text-muted-foreground">{camp.sent} enviados</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                        {camp.open}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm text-primary">
                      {camp.click}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Segmentation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Mais Engajados", count: "8,420", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Menos Engajados", count: "3,150", icon: Filter, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Contatos Inativos", count: "1,240", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-border hover:ring-primary/20 transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-colors", item.bg, item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                <div className="flex items-end gap-2 mt-1">
                  <h4 className="text-2xl font-bold tracking-tight">{item.count}</h4>
                  <span className="text-[10px] text-muted-foreground mb-1">contatos</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

