// Presentation-only simulation. Never used by delivery or reporting APIs.
export const MILANO_BETA_CAMPAIGN_ID = "86bd2a09-85f9-4641-9f8d-5a031e13ca8b";

const target = 17434;
const failed = 8;
const bounced = 76;
const readings = 9627;
const clicks = 216;
const accepted = target - failed;
const delivered = accepted - bounced;
const readyToRead = delivered;
const unconfirmedReadings = readyToRead - readings - clicks;
const format = (value: number) => value.toLocaleString("pt-BR");

const metrics: ReadonlyArray<readonly [string, string, string]> = [
  ["Destinatários previstos", format(target), "#315e91"],
  ["Tentativas registradas", format(target), "#315e91"],
  ["Aceitos pela API", format(accepted), "#315e91"],
  ["Na fila SMTP", format(0), "#64748b"],
  ["Aceitos pelo SMTP", format(accepted), "#2563eb"],
  ["Adiados", format(0), "#c38a35"],
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
  return campaignId === MILANO_BETA_CAMPAIGN_ID ? milano : null;
}
