import * as React from "react";
import {
  Users, UserCheck, UserMinus, Clock, CalendarDays,
  BarChart3, Download, Mail, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip
} from "recharts";
import { toast } from "sonner";
import { getDisparoPerformance } from "@/lib/disparo-performance.functions";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";

type Performance = Awaited<ReturnType<typeof getDisparoPerformance>>;

const formatNumber = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(n);

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function PerformanceView({
  summary = false
}: {
  summary?: boolean;
}) {
  const [days, setDays] = React.useState("30");
  const [list, setList] = React.useState("");
  const [data, setData] = React.useState<Performance | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);

    getDisparoPerformance({
      data: { days: Number(days), list }
    })
      .then(result => {
        if (active) setData(result);
      })
      .catch(error => {
        if (!active) return;
        setData(null);
        toast.error("Erro ao carregar desempenho", {
          description: error instanceof Error
            ? error.message : undefined
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [days, list, refresh]);

  const exportCsv = () => {
    if (!data) return;

    const lines: unknown[][] = [
      ["Relatorio de Desempenho Digitale"],
      ["Periodo (dias)", data.days],
      ["Lista", data.selectedList || "Todas"],
      ["Indicador", "Quantidade"],
      ["Contatos cadastrados", data.totalContacts],
      ["Ativos", data.activeContacts],
      ["Pendentes", data.pendingContacts],
      ["Descadastrados", data.unsubscribedContacts],
      ["Novos no periodo", data.newContacts],
      ["Campanhas registradas no periodo", data.totalCampaigns],
      ["Destinatarios registrados em campanhas enviadas",
        data.recordedRecipients],
      [],
      ["Data", "Novos contatos"]
    ];

    for (const row of data.daily) {
      lines.push([row.date, row.contacts]);
    }

    lines.push([], ["Lista", "Contatos"]);

    for (const row of data.lists) {
      lines.push([row.name, row.contacts]);
    }

    lines.push([], ["Campanha", "Status",
      "Destinatarios registrados", "Data"]);

    for (const row of data.campaigns) {
      lines.push([
        row.name, row.status, row.recipients, row.createdAt
      ]);
    }

    const csv = "\uFEFF" +
      lines.map(line => line.map(csvCell).join(";")).join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = summary
      ? "metricas-digitale.csv"
      : "relatorio-digitale.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const cards = data ? [
    { label: "Contatos", value: data.totalContacts, icon: Users },
    { label: "Ativos", value: data.activeContacts, icon: UserCheck },
    { label: "Pendentes", value: data.pendingContacts, icon: Clock },
    { label: "Descadastrados",
      value: data.unsubscribedContacts, icon: UserMinus },
    { label: "Novos no período",
      value: data.newContacts, icon: CalendarDays },
    { label: "Campanhas no período",
      value: data.totalCampaigns, icon: Mail }
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {summary ? "Métricas" : "Relatórios"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary
              ? "Resumo dos indicadores reais do relatório."
              : "Análise detalhada da base e das campanhas cadastradas."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[145px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={list || "__all"}
            onValueChange={value =>
              setList(value === "__all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Todas as listas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as listas</SelectItem>
              {data?.lists.map(item => (
                <SelectItem key={item.name} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefresh(n => n + 1)}
            title="Atualizar dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw size={16} />
          </Button>

          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!data || loading}
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Atualizando dados do MariaDB...
        </p>
      )}

      {!loading && !data && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Não foi possível carregar os dados. Verifique o servidor.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {cards.map(item => (
              <Card key={item.label} className="shadow-sm">
                <CardContent className="p-4">
                  <item.icon
                    size={18}
                    className="mb-3 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {formatNumber(item.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Status e total de contatos: situação atual.
            Novos contatos e campanhas: período selecionado.
            Campanhas são totalizadas globalmente, sem filtro por lista.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Crescimento da base — últimos {data.days} dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.daily.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum contato cadastrado neste período.
                </p>
              ) : (
                <div className="h-[290px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.daily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickFormatter={value =>
                          String(value).slice(5).replace("-", "/")
                        }
                      />
                      <YAxis
                        allowDecimals={false}
                        fontSize={11}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="contacts"
                        name="Novos contatos"
                        fill="#1e2d4d"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Distribuição dos contatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["Ativos", data.activeContacts],
                  ["Pendentes", data.pendingContacts],
                  ["Descadastrados", data.unsubscribedContacts]
                ].map(([label, value]) => (
                  <div key={String(label)}
                    className="flex justify-between border-b pb-2 text-sm">
                    <span>{label}</span>
                    <strong>{formatNumber(Number(value))}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Contatos por lista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma lista encontrada.
                  </p>
                ) : data.lists.map(item => (
                  <div key={item.name}
                    className="flex justify-between border-b pb-2 text-sm">
                    <span>{item.name}</span>
                    <strong>{formatNumber(item.contacts)}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {!summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Histórico de campanhas no período
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.campaigns.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma campanha registrada neste período.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead className="border-b text-left">
                        <tr>
                          <th className="p-3">Campanha</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Destinatários</th>
                          <th className="p-3">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.campaigns.map((camp, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{camp.name}</td>
                            <td className="p-3">{camp.status}</td>
                            <td className="p-3">
                              {formatNumber(camp.recipients)}
                            </td>
                            <td className="p-3">{camp.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <BarChart3 className="mt-0.5 shrink-0 text-muted-foreground"
                size={18} />
              <p className="text-sm text-muted-foreground">
                Entregas, aberturas, cliques e rejeições ainda
                não possuem eventos de rastreamento registrados.
                Esses indicadores serão disponibilizados quando
                houver uma fonte de dados verificável.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
