// Presentation-only simulation. Never used by delivery or reporting APIs.
export const MILANO_BETA_CAMPAIGN_ID = "86bd2a09-85f9-4641-9f8d-5a031e13ca8b";

const target = 17434;
const failed = 8;
const bounced = 76;
const readings = 12293;
const clicks = 259;
const accepted = target - failed;
const deferred = 174;
const delivered = accepted - bounced - deferred;
const readyToRead = delivered;
const unconfirmedReadings = readyToRead - readings - clicks;
const format = (value: number) => value.toLocaleString("pt-BR");

const metrics: ReadonlyArray<readonly [string, string, string]> = [
  ["Destinatários previstos", format(target), "#315e91"],
  ["Tentativas registradas", format(target), "#315e91"],
  ["Aceitos pela API", format(accepted), "#315e91"],
  ["Na fila SMTP", format(0), "#64748b"],
  ["Aceitos pelo SMTP", format(accepted), "#2563eb"],
  ["Adiados", format(deferred), "#c38a35"],
  ["Devolvidos", format(bounced), "#cc5757"],
  ["Entregues confirmados", format(delivered), "#21856b"],
  ["Falhas iniciais", format(failed), "#cc5757"],
  ["Ritmo do motor SMTP", "0/min", "#21856b"],
  ["Pronto para Ler", format(readyToRead), "#21856b"],
  ["Leituras", format(readings), "#315e91"],
  ["Cliques", format(clicks), "#7c3aed"],
  ["Leitura não confirmada", format(unconfirmedReadings), "#64748b"]
];

const milano = Object.freeze({
  target, failed, bounced, readings, clicks, accepted, delivered,
  readyToRead, unconfirmedReadings, metrics
});

export function getCampaignBeta(campaignId?: string) {
  if (campaignId === "ba60b51a-815b-4f20-8df4-29d6dc4c464d") return MALHA_0911_DEMO;
  if (campaignId === "a89e9396-9906-4c43-b0d2-a031d9bd58d7") return ALOE_VERA_DEMO;
  return campaignId === MILANO_BETA_CAMPAIGN_ID ? milano : null;
}


// DIGITALE_MALHA_0911_DEMO_V1
// Simulação exclusiva para apresentação.
// Não modifica métricas reais nem relatórios.
export const MALHA_0911_DEMO = Object.freeze({
  campaignName: "Malha 09/11",
  target: 17434,
  failed: 8,
  bounced: 76,
  accepted: 17426,
  delivered: 17350,
  readyToRead: 17312,
  readings: 10369,
  clicks: 307,
  unconfirmedReadings: 6943,
  metrics: [
    ["Destinatários previstos", "17.434", "#315e91"],
    ["Tentativas registradas", "17.434", "#315e91"],
    ["Aceitos pela API", "17.426", "#315e91"],
    ["Na fila SMTP", "0", "#64748b"],
    ["Aceitos pelo SMTP", "17.426", "#2563eb"],
    ["Adiados", "0", "#c38a35"],
    ["Devolvidos", "76", "#cc5757"],
    ["Entregues confirmados", "17.350", "#21856b"],
    ["Falhas iniciais", "8", "#cc5757"],
    ["Ritmo do motor SMTP", "0/min", "#21856b"],
    ["Pronto para Ler", "17.312", "#21856b"],
    ["Leituras", "10.369", "#315e91"],
    ["Cliques", "307", "#7c3aed"],
    ["Leitura não confirmada", "6.943", "#64748b"]
  ] as ReadonlyArray<readonly [string, string, string]>
});


// DIGITALE_ALOE_VERA_DEMO_V1
// Visualizacao demonstrativa, sem alterar dados reais.
export const ALOE_VERA_DEMO = Object.freeze({
  campaignName: "Aloe Vera",
  target: 18136,
  failed: 66,
  bounced: 12,
  accepted: 18039,
  delivered: 17973,
  readyToRead: 17973,
  readings: 10596,
  clicks: 327,
  unconfirmedReadings: 7377,
  metrics: [
    ["Destinatários previstos", "18.136", "#315e91"],
    ["Tentativas registradas", "18.039", "#315e91"],
    ["Aceitos pela API", "18.039", "#315e91"],
    ["Na fila SMTP", "0", "#64748b"],
    ["Aceitos pelo SMTP", "18.039", "#2563eb"],
    ["Adiados", "0", "#c38a35"],
    ["Devolvidos", "12", "#cc5757"],
    ["Entregues confirmados", "17.973", "#21856b"],
    ["Falhas iniciais", "66", "#cc5757"],
    ["Ritmo do motor SMTP", "0/min", "#21856b"],
    ["Pronto para Ler", "17.973", "#21856b"],
    ["Leituras", "10.596", "#315e91"],
    ["Cliques", "327", "#7c3aed"],
    ["Leitura não confirmada", "7.377", "#64748b"],
  ] as ReadonlyArray<readonly [string, string, string]>
});
