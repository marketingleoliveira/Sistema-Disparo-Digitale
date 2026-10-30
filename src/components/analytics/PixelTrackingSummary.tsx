import * as React from "react";
import { getPixelTrackingSummary } from "@/lib/disparo-pixel-analytics.functions";

type Record = {id:string;name:string;accepted:number;failed:number;unique:number;total:number};
type Result = {campaigns:Record[];totals:{accepted:number;failed:number;unique:number;total:number};sampledCampaigns:number;note:string};
const fmt = (n:number) => new Intl.NumberFormat('pt-BR').format(n);
const pct = (a:number,b:number) => b ? ((a / b) * 100).toFixed(1).replace('.',',') + '%' : '0%';

export function PixelTrackingSummary() {
  const [data,setData] = React.useState<Result | null>(null);
  const [error,setError] = React.useState('');
  const [loading,setLoading] = React.useState(true);
  const reload = React.useCallback(() => {
    setLoading(true);
    setError('');
    void getPixelTrackingSummary().then(v => setData(v as Result))
      .catch(() => setError('Nao foi possivel carregar as metricas do pixel.'))
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { reload(); }, [reload]);
  const sums = data?.totals;
  return (
    <section className="space-y-4 rounded-xl border bg-background p-5" aria-label="Rastreamento de aberturas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rastreamento de campanhas</h2>
          <p className="text-sm text-muted-foreground">Aberturas unicas estimadas e carregamentos totais de pixel.</p>
        </div>
        <button type="button" onClick={reload} disabled={loading} className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
          {loading ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {sums && <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Aceitos pelo SMTP',sums.accepted.toString()],
          ['Aberturas unicas',sums.unique.toString()],
          ['Carregamentos do pixel',sums.total.toString()],
          ['Taxa de abertura',pct(sums.unique,sums.accepted)],
          ['Falhas',sums.failed.toString()]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold">{label === 'Taxa de abertura' ? value : fmt(Number(value))}</div>
          </div>
        ))}
      </div>}
      {data && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">
            <th className="p-2">Campanha</th><th className="p-2 text-right">Aceitos</th>
            <th className="p-2 text-right">Unicas</th><th className="p-2 text-right">Total</th>
            <th className="p-2 text-right">Taxa</th><th className="p-2 text-right">Falhas</th>
          </tr></thead>
          <tbody>{data.campaigns.map(c => <tr key={c.id} className="border-b last:border-0">
            <td className="p-2" title={c.id}>{c.name}</td>
            <td className="p-2 text-right">{fmt(c.accepted)}</td>
            <td className="p-2 text-right">{fmt(c.unique)}</td>
            <td className="p-2 text-right">{fmt(c.total)}</td>
            <td className="p-2 text-right">{pct(c.unique,c.accepted)}</td>
            <td className="p-2 text-right">{fmt(c.failed)}</td>
          </tr>)}</tbody>
        </table>
        {data.campaigns.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>}
      </div>}
      <p className="text-xs text-muted-foreground">{data?.note || 'Uma abertura contabilizada depende do carregamento de imagens no cliente de e-mail.'} A contagem total anterior a esta atualizacao tem minimo de um carregamento por abertura unica historica. Sao exibidas ate 50 campanhas recentes.</p>
    </section>
  );
}
