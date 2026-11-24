import * as React from "react";
import { CampaignDetailsModal } from "./CampaignDetailsModal";

type CampaignMask = {
  id: string;
  name: string;
  target: number;
  delivered: number;
  readings: number;
  clicks: number;
};

const CAMPAIGN_MASKS: CampaignMask[] = [
  // NEWSLETTER_2311_RANK_DEMO_V1
  {
    id: "0f1e6d18-98aa-48a9-97ef-5c9b6553088c",
    name: "Newsletter 23/11 (simulação)",
    target: 18973,
    delivered: 18845,
    readings: 14476,
    clicks: 418,
  },
  {
    id: "2a3a8e60-e72f-11f1-80bf-18e8d4c367ea",
    name: "Pilates 20/11 — 20/11/2026 (estimativa)",
    target: 18842,
    delivered: 18645,
    readings: 7461,
    clicks: 72,
  },
  {
    id: "4d5f1795-6418-4fda-b72e-ead2f743ae67",
    name: "Lyon — Brilho que desperta desejo",
    target: 18682,
    delivered: 18547,
    readings: 13173,
    clicks: 291,
  },
  {
    id: "86bd2a09-85f9-4641-9f8d-5a031e13ca8b",
    name: "Milano",
    target: 17434,
    delivered: 17176,
    readings: 12293,
    clicks: 259,
  },
  {
    id: "274613ce-eaa7-4214-8e98-9266dcb664dd",
    name: "Newsletter 16/11",
    target: 18519,
    delivered: 18486,
    readings: 11198,
    clicks: 313,
  },
  {
    id: "ba60b51a-815b-4f20-8df4-29d6dc4c464d",
    name: "Malha 09/11",
    target: 17434,
    delivered: 17350,
    readings: 10369,
    clicks: 307,
  },
  {
    id: "a89e9396-9906-4c43-b0d2-a031d9bd58d7",
    name: "Aloe Vera",
    target: 18136,
    delivered: 17973,
    readings: 10596,
    clicks: 327,
  },
  {
    id: "77031c19-c393-498e-af23-1610965747d5",
    name: "Treino de Força",
    target: 16284,
    delivered: 16105,
    readings: 7846,
    clicks: 194,
  },
  {
    id: "cdd61ff9-2273-4b87-9eac-af7d1ce731fc",
    name: "Dia Fisiculturista",
    target: 17434,
    delivered: 17251,
    readings: 9456,
    clicks: 167,
  },
];

type RankedCampaign = CampaignMask & {
  deliveryRate: number;
  readingRate: number;
  clickRate: number;
  score: number;
};

function percent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function numberPtBr(value: number) {
  return value.toLocaleString("pt-BR");
}

function getScore(campaign: CampaignMask): RankedCampaign {
  const deliveryRate = campaign.target > 0
    ? (campaign.delivered / campaign.target) * 100
    : 0;

  const readingRate = campaign.delivered > 0
    ? (campaign.readings / campaign.delivered) * 100
    : 0;

  const clickRate = campaign.readings > 0
    ? (campaign.clicks / campaign.readings) * 100
    : 0;

  const score =
    deliveryRate * 0.35 +
    readingRate * 0.45 +
    clickRate * 0.20;

  return {
    ...campaign,
    deliveryRate,
    readingRate,
    clickRate,
    score,
  };
}

const ranking = CAMPAIGN_MASKS
  .map(getScore)
  .sort((a, b) => b.score - a.score);

const medals = ["🥇", "🥈", "🥉", "", "", ""];

export function CampaignMaskTopRanking() {
  const [expanded, setExpanded] = React.useState(false);
  const visibleRanking = expanded ? ranking : ranking.slice(0, 3);
  return (
    <section className="w-full min-w-0 rounded-xl border bg-card p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold">
            Top 3 campanhas — desempenho de referência
          </h3>
        </div>

        <div className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-800">
          ESTIMATIVAS / DADOS DE REFERÊNCIA
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-3">
        {visibleRanking.map((campaign, index) => (
          <div
            key={campaign.id}
            className="min-w-0 rounded-lg border px-2.5 py-2"
          >
            <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {medals[index]} {index + 1}º lugar
                </p>
                <h4 className="mt-0.5 break-words text-sm font-bold leading-snug">
                  {campaign.name}
                </h4>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <CampaignDetailsModal
                  campaignId={campaign.id}
                  name={campaign.name}
                  filtersUnderMaintenance
                  triggerLabel="Visualizar"
                />
                <div className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-right">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Score
                </p>
                <p className="text-base font-bold text-violet-700">
                  {campaign.score.toFixed(1).replace(".", ",")}
                </p>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-1.5 text-xs sm:grid-cols-4 xl:grid-cols-2">
              <div className="min-w-0 rounded-lg border px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground">Entregues</p>
                <p className="mt-0.5 break-words font-semibold text-emerald-700">
                  {numberPtBr(campaign.delivered)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg border px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground">Leituras</p>
                <p className="mt-0.5 break-words font-semibold text-blue-700">
                  {numberPtBr(campaign.readings)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg border px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground">Cliques</p>
                <p className="mt-0.5 break-words font-semibold text-violet-700">
                  {numberPtBr(campaign.clicks)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg border px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground">Taxa de leitura</p>
                <p className="mt-0.5 break-words font-semibold text-amber-700">
                  {percent(campaign.readingRate)}
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              <div>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium">{percent(campaign.deliveryRate)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-emerald-600"
                    style={{ width: `${Math.max(0, Math.min(campaign.deliveryRate, 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Leitura</span>
                  <span className="font-medium">{percent(campaign.readingRate)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(0, Math.min(campaign.readingRate, 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Clique</span>
                  <span className="font-medium">{percent(campaign.clickRate)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-violet-600"
                    style={{ width: `${Math.max(0, Math.min(campaign.clickRate, 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ranking.length > 3 && (
        <div className="mt-3 flex justify-center border-t pt-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(value => !value)}
            className="rounded-lg border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {expanded ? "Recolher ranking" : "Ver ranking completo"}
          </button>
        </div>
      )}
    </section>
  );
}
