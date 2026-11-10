import * as React from "react";

const date = "2026-11-09";
const factor = 1.33;
const scale = (n: number) => Math.round(n * factor);
const fmt = (n: number) => n.toLocaleString("pt-BR");

const target = scale(17434);
const failed = scale(8);
const bounced = scale(76);
const accepted = target - failed;
const delivered = accepted - bounced;
const ready = scale(17312);
const readings = scale(10369);
const clicks = scale(307);
const unconfirmed = ready - readings;

const rows = [
  ["Destinatários previstos", target],
  ["Tentativas registradas", target],
  ["Aceitos pela API", accepted],
  ["Na fila SMTP", 0],
  ["Aceitos pelo SMTP", accepted],
  ["Adiados", 0],
  ["Devolvidos", bounced],
  ["Entregues confirmados", delivered],
  ["Falhas iniciais", failed],
  ["Pronto para Ler", ready],
  ["Leituras", readings],
  ["Cliques", clicks],
  ["Leitura não confirmada", unconfirmed],
] as const;

export function PixelTrackingDemo() {
  const [selectedDate, setSelectedDate] = React.useState(date);
  const selected = selectedDate === date;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-semibold">
          Tracking Pixel — Dados
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cenário ilustrativo: Malha 09/11 com acréscimo de 33%.
          Não representa eventos reais de rastreamento.
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <label
          htmlFor="pixel-demo-date"
          className="mb-2 block text-sm font-medium"
        >
          Filtrar por data
        </label>
        <input
          id="pixel-demo-date"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        />
      </div>

      {selected ? (
        <>
          <div className="rounded-xl border p-4">
            <p className="text-sm font-semibold">
              DADOS — 09/11/2026
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dados calculados para demonstração.
              Não são resultados observados no Tracking Pixel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Leituras", readings],
              ["Cliques", clicks],
              ["Prontos para ler", ready],
              ["Não confirmadas", unconfirmed],
            ].map(([name, value]) => (
              <div key={name} className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">{name}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {fmt(Number(value))}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Indicador</th>
                  <th className="p-3 text-right">09/11/2026</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([name, value]) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="p-3">{name}</td>
                    <td className="p-3 text-right font-medium">
                      {fmt(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Não existem dados cadastrados para esta data.
          Data de referência: 09/11/2026.
        </div>
      )}
    </main>
  );
}
