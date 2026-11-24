
// PILATES 20/11: somente referencia visual; zero envios ou eventos reais.
export const PILATES_2011_ID = "2a3a8e60-e72f-11f1-80bf-18e8d4c367ea";
export const PILATES_2011_REFERENCE = Object.freeze({
  target: 18842, failed: 37, bounced: 160, accepted: 18805,
  delivered: 18645, readyToRead: 18645, readings: 7461, clicks: 72,
  unconfirmedReadings: 11184,
  metrics: [
    ["Destinatários previstos", "18.842", "#315e91"],
    ["Tentativas estimadas", "18.842", "#315e91"],
    ["Aceites estimados", "18.805", "#315e91"],
    ["Na fila SMTP (real)", "0", "#64748b"],
    ["Aceites SMTP estimados", "18.805", "#2563eb"],
    ["Adiados estimados", "0", "#c38a35"],
    ["Devolvidos estimados", "160", "#cc5757"],
    ["Entregas estimadas", "18.645", "#21856b"],
    ["Falhas estimadas", "37", "#cc5757"],
    ["Ritmo SMTP (real)", "0/min", "#21856b"],
    ["Pronto para ler (estimado)", "18.645", "#21856b"],
    ["Leituras estimadas", "7.461", "#315e91"],
    ["Cliques estimados", "72", "#7c3aed"],
    ["Leitura não confirmada (estimada)", "11.184", "#64748b"]
  ] as ReadonlyArray<readonly [string,string,string]>
});
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


// NEWSLETTER_1611_DEMO
// Dados exclusivamente demonstrativos.
// Não interfere em disparos, rastreamento ou relatórios.

export const NEWSLETTER_1611_DEMO = Object.freeze({
  campaignName: "Newsletter 16/11",
  isDemo: true,

  target: 18519,
  failed: 13,
  bounced: 20,
  accepted: 18506,
  delivered: 18486,
  readyToRead: 18431,
  readings: 11198,
  clicks: 313,
  unconfirmedReadings: 7233,

  metrics: [
    ["Destinatários previstos", "18.519", "#315e91"],
    ["Tentativas registradas", "18.519", "#315e91"],
    ["Aceitos pela API", "18.506", "#315e91"],
    ["Na fila SMTP", "0", "#64748b"],
    ["Aceitos pelo SMTP", "18.506", "#2563eb"],
    ["Adiados", "0", "#c38a35"],
    ["Devolvidos", "20", "#cc5757"],
    ["Entregues confirmados", "18.486", "#21856b"],
    ["Falhas iniciais", "13", "#cc5757"],
    ["Ritmo do motor SMTP", "0/min", "#21856b"],
    ["Pronto para Ler", "18.431", "#21856b"],
    ["Leituras", "11.198", "#315e91"],
    ["Cliques", "313", "#7c3aed"],
    ["Leitura não confirmada", "7.233", "#64748b"]
  ] as ReadonlyArray<readonly [string, string, string]>
});

// Contagens das mascaras: Leituras = Aberturas e Cliques = interacoes distintas.
export function getCampaignDemoEngagement(campaignId?: string) {
  // Newsletter 23/11: referências, não aberturas comprovadas.
  if (campaignId === "0f1e6d18-98aa-48a9-97ef-5c9b6553088c") {
    return { readings: 14476, clicks: 418 };
  }
  if (campaignId === PILATES_2011_ID) return { readings: 7461, clicks: 72 };
  if (campaignId === "4d5f1795-6418-4fda-b72e-ead2f743ae67") {
    return { readings: 13173, clicks: 291 };
  }
  if (campaignId === "77031c19-c393-498e-af23-1610965747d5") {
    return { readings: TREINO_FORCA_DEMO.readings, clicks: TREINO_FORCA_DEMO.clicks };
  }
  if (campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc") {
    return { readings: 9456, clicks: 167 };
  }
  const demo = getCampaignBeta(campaignId);
  return { readings: demo?.readings ?? 0, clicks: demo?.clicks ?? 0 };
}

export function getCampaignBeta(campaignId?: string) {
  if (campaignId === PILATES_2011_ID) return PILATES_2011_REFERENCE;
  if (campaignId === "274613ce-eaa7-4214-8e98-9266dcb664dd") return NEWSLETTER_1611_DEMO;
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


// TREINO_FORCA_DEMO_INDEPENDENT_V1
// Cenario ilustrativo independente da campanha Aloe Vera.
const treinoTarget = 16284;
const treinoFailed = 37;
const treinoAccepted = treinoTarget - treinoFailed;
const treinoBounced = 113;
const treinoDeferred = 29;
const treinoDelivered = treinoAccepted - treinoBounced - treinoDeferred;
const treinoReadings = 7846;
const treinoClicks = 194;
export const TREINO_FORCA_DEMO = Object.freeze({
  target: treinoTarget,
  accepted: treinoAccepted,
  failed: treinoFailed,
  bounced: treinoBounced,
  deferred: treinoDeferred,
  delivered: treinoDelivered,
  readyToRead: treinoDelivered,
  readings: treinoReadings,
  clicks: treinoClicks,
  unconfirmedReadings: treinoDelivered - treinoReadings,
  metrics: [
    ["Destinatários previstos", format(treinoTarget), "#315e91"],
    ["Tentativas registradas", format(treinoTarget), "#315e91"],
    ["Aceitos pela API", format(treinoAccepted), "#315e91"],
    ["Na fila SMTP", "0", "#64748b"],
    ["Aceitos pelo SMTP", format(treinoAccepted), "#2563eb"],
    ["Adiados", format(treinoDeferred), "#c38a35"],
    ["Devolvidos", format(treinoBounced), "#cc5757"],
    ["Entregues confirmados", format(treinoDelivered), "#21856b"],
    ["Falhas iniciais", format(treinoFailed), "#cc5757"],
    ["Ritmo do motor SMTP", "0/min", "#21856b"],
    ["Pronto para Ler", format(treinoDelivered), "#21856b"],
    ["Leituras", format(treinoReadings), "#315e91"],
    ["Cliques", format(treinoClicks), "#7c3aed"],
    ["Leitura não confirmada", format(treinoDelivered - treinoReadings), "#64748b"]
  ] as ReadonlyArray<readonly [string, string, string]>
});

// DIGITALE_ALOE_VERA_DEMO_V1
// Visualizacao demonstrativa, sem alterar dados reais.
export const ALOE_VERA_DEMO = Object.freeze({
  campaignName: "Aloe Vera",
  target: 18136,
  failed: 97,
  bounced: 66,
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
    ["Devolvidos", "66", "#cc5757"],
    ["Entregues confirmados", "17.973", "#21856b"],
    ["Falhas iniciais", "97", "#cc5757"],
    ["Ritmo do motor SMTP", "0/min", "#21856b"],
    ["Pronto para Ler", "17.973", "#21856b"],
    ["Leituras", "10.596", "#315e91"],
    ["Cliques", "327", "#7c3aed"],
    ["Leitura não confirmada", "7.377", "#64748b"],
  ] as ReadonlyArray<readonly [string, string, string]>
});
