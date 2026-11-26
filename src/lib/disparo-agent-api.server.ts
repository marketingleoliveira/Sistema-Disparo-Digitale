import { createEditableMarketingTemplate } from "./disparo-agent-template.server";
import { randomUUID } from "node:crypto";
import { withDisparoAgent, currentUser } from "./disparo-auth.server";
import * as campaigns from "./disparo-campaigns.server";
import * as contacts from "./disparo-contacts.server";
import * as lists from "./disparo-lists.server";
import * as templates from "./disparo-shared-templates.server";
import * as automations from "./disparo-automations.server";
import * as users from "./disparo-users.server";
import { rankReferenceCampaigns } from "./campaign-reference-score";
import referenceRanking from "./campaign-reference-ranking.json";
import { readDisparoBackupStatus } from "./disparo-backup-status.server";

type Input = Record<string, unknown>;
const string = (v: unknown) => typeof v === "string" ? v : "";
const object = (v: unknown): Input => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Objeto obrigatório");
  return v as Input;
};
const id = (v: unknown) => {
  const value = string(v);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("ID inválido");
  return value;
};
// Reference data only: never fall back to live delivery or tracking tables.
const referenceResults = (p: Input) => {
  const campaignId = p["campaignId"] === undefined ? null : id(p["campaignId"]);
  const items = referenceRanking.filter(row => !campaignId || row.id === campaignId).map(row => ({
    id: row.id, name: row.name, target: row.target, delivered: row.delivered,
    readings: row.readings, clicks: row.clicks
  }));
  return { dataSource: "reference_indicators", estimated: true, verifiedResults: false,
    title: "Indicadores de referência do Disparo Digitale",
    notice: "Estimativas de referência; não constituem resultados reais verificados.", items };
};
const operations = {
  "templates.createEditable": {
    write: true,
    run: createEditableMarketingTemplate
  },

  "campaigns.list": { write: false, run: referenceResults },
  "campaigns.referenceResults": { write: false, run: referenceResults },
  "reports.referenceRanking": { write: false, run: (p: Input) => {
    const result = referenceResults({});
    const ranked = rankReferenceCampaigns(result.items);
    const campaignId = p["campaignId"] === undefined ? null : id(p["campaignId"]);
    return { ...result, rankingBy: "weighted_reference_score", weights: { delivery: 0.35, reading: 0.45, click: 0.20 }, items: ranked.filter(item => !campaignId || item.id === campaignId) };
  } },
  "campaigns.createDraft": { write: true, run: (p: Input) => campaigns.createDisparoCampaignDB({
    name: string(p.name), subject: string(p.subject), type: "E-mail", status: "Rascunho", recipients: 0,
    contentJson: JSON.stringify(object(p.content ?? {}))
  }) },
  "campaigns.archive": { write: true, run: (p: Input) => campaigns.archiveDisparoCampaignDB(id(p.id), p.restore === true) },
  "contacts.list": { write: false, run: (p: Input) => {
    const offset = Math.max(0, Number.isSafeInteger(p.offset) ? Number(p.offset) : 0);
    const limit = Math.min(200, Math.max(1, Number.isSafeInteger(p.limit) ? Number(p.limit) : 50));
    const all = contacts.listContactsDB();
    return { total: all.length, offset, limit, items: all.slice(offset, offset + limit) };
  } },
  "contacts.create": { write: true, run: (p: Input) => contacts.createContactDB(object(p.contact) as contacts.ContactDraft) },
  "contacts.update": { write: true, run: (p: Input) => contacts.updateContactDB(id(p.id), object(p.contact) as contacts.ContactDraft) },
  "lists.list": { write: false, run: (_p: Input) => lists.listDisparoFoldersDB() },
  "lists.create": { write: true, run: (p: Input) => lists.createDisparoFolderDB(string(p.name), string(p.description)) },
  "templates.list": { write: false, run: (p: Input) => templates.listTemplatesDB(p.kind) },
  "templates.upsert": { write: true, run: (p: Input) => templates.upsertTemplateDB(p.kind, object(p.template)) },
  "automations.list": { write: false, run: (_p: Input) => automations.listDisparoAutomationsDB() },
  "automations.saveDraft": { write: true, run: (p: Input) => automations.saveDisparoAutomationDraftDB({ id: string(p.id), configuration: object(p.configuration) }) },
  "users.list": { write: false, run: (_p: Input) => users.listDisparoUsersInDB() },
  "reports.performance": { write: false, run: referenceResults },
  "backup.status": { write: false, run: (_p: Input) => readDisparoBackupStatus() },
} satisfies Record<string, { write: boolean; run: (p: Input) => unknown }>;

const json = (body: unknown, status=200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handleAgent(request: Request): Promise<Response> {
  const requestId = randomUUID();
  try {
    const result = withDisparoAgent(request, async (scope) => {
      const actor = currentUser()!;
      const pixel = scope === "pixelTemplates";
      const allowed = (action: string) => !pixel || ["templates.list","templates.createEditable","campaigns.referenceResults","reports.referenceRanking"].includes(action);
      const writeEnabled = pixel ? process.env["DISPARO_PIXEL_WRITE"] === "1" : process.env["DISPARO_AGENT_WRITE"] === "1";

      if (request.method === "GET") {
        return json({ version: "1.0", scope, writeEnabled,
          operations: Object.entries(operations).filter(([action]) => allowed(action)).map(([action, op]) => ({ action, write: op.write })) });
      }
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Use application/json" }, 415);
      // Limit the request even when Content-Length is absent.
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "Corpo obrigatório" }, 400);
      const chunks: Uint8Array[] = [];
      let size=0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 12*1024*1024) { await reader.cancel(); return json({error:"Corpo muito grande"},413); }
        chunks.push(value);
      }
      let body: Input;
      try { body = object(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { return json({error:"JSON inválido"},400); }
      const action = string(body.action);
      if (!Object.hasOwn(operations, action)) return json({error:"Operação desconhecida"},404);
      if (!allowed(action)) return json({error:"Operação sem permissão"},403);
      const op = operations[action as keyof typeof operations];
      if (op.write && !writeEnabled) return json({error:"Escrita desabilitada"},403);
      console.info("[disparo-agent]", JSON.stringify({requestId, actor:actor.id, action, state:"start"}));
      try {
        const params = object(body.params ?? {});
        if (pixel && action.startsWith("templates.") && params["kind"] !== "marketing") return json({error:"Somente templates de marketing"},403);
        const data = await op.run(params);
        console.info("[disparo-agent]", JSON.stringify({requestId, action, state:"ok"}));
        return json({ok:true, requestId, data: data ?? null});
      } catch {
        console.warn("[disparo-agent]", JSON.stringify({requestId, action, state:"failed"}));
        return json({ok:false, requestId, error:"Operação rejeitada ou falhou"},422);
      }
    });
    return result ? await result : json({error:"Não autorizado"},401);
  } catch {
    console.error("[disparo-agent]", JSON.stringify({requestId, state:"internal-error"}));
    return json({error:"Falha interna", requestId},500);
  }
}
