import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type CampaignStatus =
  | "Rascunho"
  | "Agendada"
  | "Em andamento"
  | "Processando"
  | "Interrompida"
  | "Simulada"
  | "Parcial"
  | "Falha"
  | "Enviada";

export type CampaignWriteInput = {
  name: string;
  subject: string;
  type: string;
  status: CampaignStatus;
  recipients: number;
  contentJson: string;
};

const sqlText = (value: string | null): string =>
  value === null
    ? "NULL"
    : `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4)`;

const decode = (value?: string): string =>
  Buffer.from(value || "", "hex").toString("utf8");

const validId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function rows(sql: string): string[][] {
  const e = process.env;

  if (
    e["DB_NAME"] !== "TESTE_DISPARO" ||
    !e["DB_USER"] ||
    e["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Configuracao do MariaDB invalida.");
  }

  const result = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", e["DB_USER"],
    "--database", e["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names"
  ], {
    input: sql,
    env: { ...e, MYSQL_PWD: e["DB_PASSWORD"] },
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 32 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    console.error(
      "Falha MariaDB:",
      result.error?.message || result.stderr
    );
    throw new Error("Nao foi possivel acessar campanhas.");
  }

  const output = result.stdout.trim();

  return output
    ? output.split("\n").map(line => line.split("\t"))
    : [];
}

export async function listDisparoCampaignsDB(archived = false) {
  const user = await requireDisparoUser();
  if (archived && user.role !== "Desenvolvedor") {
    throw new Error("Acesso exclusivo para Desenvolvedores.");
  }

  return rows(`
    SELECT
      HEX(id),
      HEX(name),
      HEX(COALESCE(type, 'E-mail')),
      HEX(status),
      recipients,
      HEX(COALESCE(open_rate, '0%')),
      HEX(COALESCE(click_rate, '0%')),
      HEX(COALESCE(subject, '')),
      HEX(COALESCE(content_json, '{}')),
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s')
    FROM disparo_campaigns
    WHERE archived_at IS ${archived ? "NOT NULL" : "NULL"}
    ORDER BY created_at DESC
    LIMIT 1000;
  `).map(row => {
    const rawStatus = decode(row[3]);

    const allowed: CampaignStatus[] = [
      "Rascunho",
      "Agendada",
      "Em andamento",
      "Processando",
      "Simulada",
      "Parcial",
      "Falha",
      "Enviada"
    ];

    const status: CampaignStatus =
      allowed.includes(rawStatus as CampaignStatus)
        ? rawStatus as CampaignStatus
        : "Rascunho";

    return {
      id: decode(row[0]),
      name: decode(row[1]),
      type: decode(row[2]) || "E-mail",
      status,
      recipients: Number(row[4] || 0),
      open: decode(row[5]) || "0%",
      clicks: decode(row[6]) || "0%",
      subject: decode(row[7]),
      contentJson: decode(row[8]) || "{}",
      date: row[9] || "",
      createdAt: row[9] || ""
    };
  });
}

export async function createDisparoCampaignDB(
  data: CampaignWriteInput
): Promise<string> {
  await requireDisparoUser();

  const name = String(data.name || "").trim();
  const subject = String(data.subject || "").trim();

  if (!name || name.length > 191 || subject.length > 191) {
    throw new Error("Nome ou assunto invalido.");
  }

  if (data.type !== "E-mail") {
    throw new Error("Somente campanhas de e-mail sao suportadas.");
  }

  if (![
    "Rascunho",
    "Agendada",
    "Em andamento"
  ].includes(data.status)) {
    throw new Error("Status invalido para criar campanha.");
  }

  if (
    !Number.isSafeInteger(data.recipients) ||
    data.recipients < 0 ||
    data.recipients > 10000000
  ) {
    throw new Error("Quantidade de destinatarios invalida.");
  }

  if (data.contentJson.length > 5 * 1024 * 1024) {
    throw new Error("Conteudo da campanha excede 5 MB.");
  }

  let content: unknown;

  try {
    content = JSON.parse(data.contentJson);
  } catch {
    throw new Error("Conteudo JSON invalido.");
  }

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    throw new Error("Conteudo da campanha deve ser um objeto.");
  }

  const id = randomUUID();

  rows(`
    INSERT INTO disparo_campaigns (
      id, name, subject, type, status,
      recipients, open_rate, click_rate, content_json
    )
    VALUES (
      ${sqlText(id)},
      ${sqlText(name)},
      ${sqlText(subject)},
      'E-mail',
      ${sqlText(data.status)},
      ${data.recipients},
      '0%',
      '0%',
      ${sqlText(data.contentJson)}
    );
  `);

  return id;
}


export async function deleteDisparoCampaignDB(
  id: string
): Promise<void> {
  const user = await requireDisparoUser();

  // Exclusao definitiva exclusiva do administrador.
  if (user.role !== "Desenvolvedor") {
    throw new Error(
      "Somente usuarios com perfil Desenvolvedor podem excluir campanhas."
    );
  }

  if (!validId(id)) {
    throw new Error("Identificador de campanha invalido.");
  }

  const campaign = rows(`
    SELECT status
    FROM disparo_campaigns
    WHERE id = ${sqlText(id)}
    LIMIT 1
  `);

  if (!campaign.length) {
    throw new Error("Campanha nao encontrada.");
  }

  if (!["Rascunho","Agendada"].includes(campaign[0][0])) {
    throw new Error(
      "Campanha enviada ou em andamento nao pode " +
      "ser apagada porque possui historico de disparos."
    );
  }

  // Protege tentativas de envio e registros de destinatarios.
  const dependencies = rows(`
    SELECT
      (SELECT COUNT(*)
       FROM disparo_email_attempts
       WHERE campaign_id = ${sqlText(id)}),
      (SELECT COUNT(*)
       FROM disparo_campaign_recipients
       WHERE campaign_id = ${sqlText(id)})
  `);

  if (
    Number(dependencies[0]?.[0] || 0)>0 ||
    Number(dependencies[0]?.[1] || 0)>0
  ) {
    throw new Error(
      "Campanha possui registros associados. " +
      "Exclusao definitiva bloqueada para proteger o historico."
    );
  }

  // Uma campanha agendada deve ser cancelada antes da exclusao.
  if (campaign[0][0]==="Agendada") {
    throw new Error(
      "Cancele o agendamento antes de excluir esta campanha."
    );
  }

  // Exclusao definitiva somente de rascunhos sem dependencias.
  rows(`
    DELETE FROM disparo_campaigns
    WHERE id = ${sqlText(id)}
      AND status = 'Rascunho'
      AND NOT EXISTS (
        SELECT 1 FROM disparo_email_attempts
        WHERE campaign_id = ${sqlText(id)}
      )
      AND NOT EXISTS (
        SELECT 1 FROM disparo_campaign_recipients
        WHERE campaign_id = ${sqlText(id)}
      )
  `);

  const remaining=rows(`
    SELECT COUNT(*)
    FROM disparo_campaigns
    WHERE id = ${sqlText(id)}
  `);

  if (Number(remaining[0]?.[0] || 0)!==0) {
    throw new Error(
      "A campanha nao foi excluida. Verifique as permissoes " +
      "do MariaDB e o estado da campanha."
    );
  }
}

// Arquivamento reversivel: os registros de envio sao preservados.
export async function archiveDisparoCampaignDB(id: string, restore = false): Promise<void> {
  const user = await requireDisparoUser();
  if (user.role !== "Desenvolvedor") {
    throw new Error("Somente Desenvolvedores podem arquivar ou restaurar campanhas.");
  }
  if (!validId(id)) throw new Error("Identificador de campanha invalido.");
  const current = rows(`SELECT status, archived_at IS NOT NULL FROM disparo_campaigns WHERE id = ${sqlText(id)} LIMIT 1`);
  if (!current.length) throw new Error("Campanha nao encontrada.");
  const isArchived = current[0]?.[1] === "1";
  if (restore) {
    if (!isArchived) throw new Error("Campanha nao esta arquivada.");
    rows(`UPDATE disparo_campaigns SET archived_at = NULL WHERE id = ${sqlText(id)} AND archived_at IS NOT NULL`);
    const check = rows(`SELECT archived_at IS NULL FROM disparo_campaigns WHERE id = ${sqlText(id)} LIMIT 1`);
    if (check[0]?.[0] !== "1") throw new Error("Restauracao nao confirmada.");
    return;
  }
  if (isArchived) throw new Error("Campanha ja arquivada.");
  if (["Agendada", "Em andamento", "Processando"].includes(current[0]?.[0] || "")) {
    throw new Error("Campanha agendada ou em processamento: finalize ou cancele antes de arquivar.");
  }
  const queued = rows(`SELECT COUNT(*) FROM disparo_email_attempts WHERE campaign_id = ${sqlText(id)} AND status = 'queued'`);
  if (Number(queued[0]?.[0] || 0) > 0) throw new Error("Ha envios pendentes: arquivamento bloqueado.");
  rows(`UPDATE disparo_campaigns SET archived_at = UTC_TIMESTAMP() WHERE id = ${sqlText(id)} AND archived_at IS NULL AND status NOT IN ('Agendada', 'Em andamento', 'Processando') AND NOT EXISTS (SELECT 1 FROM disparo_email_attempts WHERE campaign_id = ${sqlText(id)} AND status = 'queued')`);
  const check = rows(`SELECT archived_at IS NOT NULL FROM disparo_campaigns WHERE id = ${sqlText(id)} LIMIT 1`);
  if (check[0]?.[0] !== "1") throw new Error("Arquivamento nao confirmado.");
}

// ===== DISPARO_MARIADB_ETAPA_3D =====

export type DisparoSendCampaign = {
  id: string;
  subject: string;
  status: string;
  content: Record<string, unknown>;
};

export type DisparoSendRecipient = {
  contactId: string;
  email: string;
  listId: string;
};

export async function getDisparoCampaignByIdDB(
  campaignId: string
): Promise<DisparoSendCampaign> {
  await requireDisparoUser();

  if (!validId(campaignId)) {
    throw new Error("ID de campanha invalido.");
  }

  const result = rows(`
    SELECT
      HEX(id),
      HEX(COALESCE(subject, '')),
      HEX(status),
      HEX(COALESCE(content_json, '{}'))
    FROM disparo_campaigns
    WHERE id = ${sqlText(campaignId)}
    LIMIT 1;
  `);

  if (result.length !== 1) {
    throw new Error("Campanha nao encontrada no MariaDB.");
  }

  const row = result[0]!;
  const parsed: unknown = JSON.parse(decode(row[3]));

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error("Conteudo da campanha invalido.");
  }

  return {
    id: decode(row[0]),
    subject: decode(row[1]),
    status: decode(row[2]),
    content: parsed as Record<string, unknown>
  };
}

export async function getDisparoRecipientsDB(
  rawLists: string[]
): Promise<DisparoSendRecipient[]> {
  await requireDisparoUser();

  const selected = [...new Set(
    rawLists.map(x => String(x).trim()).filter(Boolean)
  )];

  if (selected.length < 1 || selected.length > 100) {
    throw new Error("Selecao de listas invalida.");
  }

  const listRows = rows(`
    SELECT HEX(id), HEX(name)
    FROM disparo_contact_lists;
  `);

  const available = new Map<string, string>();

  for (const row of listRows) {
    available.set(decode(row[1]), decode(row[0]));
  }

  for (const name of selected) {
    if (!available.has(name)) {
      throw new Error(
        "Lista nao encontrada no MariaDB: " + name
      );
    }
  }

  const conditions = selected.map(name => `
    JSON_CONTAINS(
      c.lists_json,
      JSON_QUOTE(${sqlText(name)})
    ) = 1
  `);

  const contactRows = rows(`
    SELECT
      HEX(c.id),
      HEX(c.email),
      HEX(c.lists_json)
    FROM disparo_contacts c
    WHERE c.status = 'Ativo'
      AND JSON_VALID(c.lists_json) = 1
      AND (${conditions.join(" OR ")});
  `);

  const recipients = new Map<string, DisparoSendRecipient>();

  for (const row of contactRows) {
    const contactId = decode(row[0]);
    const email = decode(row[1]).trim().toLowerCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      continue;
    }

    const lists: unknown = JSON.parse(decode(row[2]));

    if (!Array.isArray(lists)) {
      continue;
    }

    const matching = selected.find(
      name => lists.includes(name)
    );

    if (!matching) continue;

    const listId = available.get(matching);

    if (!listId) continue;

    if (!recipients.has(email)) {
      recipients.set(email, {
        contactId,
        email,
        listId
      });
    }
  }

  return [...recipients.values()];
}

export async function claimDisparoCampaignForSendingDB(
  campaignId: string
): Promise<void> {
  await requireDisparoUser();

  if (!validId(campaignId)) {
    throw new Error("Campanha invalida.");
  }

  // UPDATE condicional atomico:
  // apenas uma requisicao consegue reservar.
  const result = rows(`
    UPDATE disparo_campaigns
    SET
      status = 'Processando',
      updated_at = NOW()
    WHERE id = ${sqlText(campaignId)}
      AND status = 'Em andamento'
      AND NOT EXISTS (
        SELECT 1
        FROM disparo_email_attempts a
        WHERE a.campaign_id = ${sqlText(campaignId)}
      );

    SELECT ROW_COUNT();
  `);

  if (Number(result[0]?.[0] || 0) !== 1) {
    throw new Error(
      "Campanha ja processada, em execucao ou indisponivel."
    );
  }
}

export async function finishDisparoCampaignDB(input: {
  campaignId: string;
  sent: number;
  simulated: number;
  failed: number;
}): Promise<void> {
  await requireDisparoUser();

  if (!validId(input.campaignId)) {
    throw new Error("Campanha invalida.");
  }

  for (const n of [input.sent, input.simulated, input.failed]) {
    if (!Number.isSafeInteger(n) || n < 0) {
      throw new Error("Contagem de envio invalida.");
    }
  }

  // Simulacoes nao sao contabilizadas como envio real.
  const finalStatus =
    input.sent > 0 && input.failed > 0
      ? "Parcial"
      : input.sent > 0
        ? "Enviada"
        : input.simulated > 0
          ? "Simulada"
          : "Falha";

  const result = rows(`
    UPDATE disparo_campaigns
    SET
      status = ${sqlText(finalStatus)},
      recipients = ${input.sent},
      updated_at = NOW()
    WHERE id = ${sqlText(input.campaignId)}
      AND status = 'Processando';

    SELECT ROW_COUNT();
  `);

  if (Number(result[0]?.[0] || 0) !== 1) {
    const current = rows(`
      SELECT status
      FROM disparo_campaigns
      WHERE id = ${sqlText(input.campaignId)}
      LIMIT 1;
    `);

    // DIGITALE_FORCE_END_FINISH_V2
    // Uma campanha interrompida nunca volta a ser finalizada.
    if (current[0]?.[0] === "Interrompida") {
      return;
    }

    throw new Error(
      "Nao foi possivel finalizar a campanha."
    );
  }
}

// DIGITALE_FORCE_END_V1
export async function forceEndDisparoCampaignDB(
  campaignId: string
): Promise<void> {
  const user = await requireDisparoUser();

  if (!["Desenvolvedor", "Diretoria", "Gerência"].includes(user.role)) {
    throw new Error("Sem permissao para encerrar campanhas.");
  }

  if (!validId(campaignId)) {
    throw new Error("Campanha invalida.");
  }

  const result = rows(`
    START TRANSACTION;

    UPDATE disparo_campaign_execution_control ec
    JOIN disparo_campaigns c ON c.id = ec.campaign_id
    SET ec.enabled = 0, ec.state = 'stopped'
    WHERE c.id = ${sqlText(campaignId)}
      AND c.status IN ('Processando', 'Em andamento');

    UPDATE disparo_campaigns
    SET status = 'Interrompida', updated_at = NOW()
    WHERE id = ${sqlText(campaignId)}
      AND status IN ('Processando', 'Em andamento');

    SELECT ROW_COUNT();

    COMMIT;
  `);

  if (Number(result[0]?.[0] || 0) !== 1) {
    throw new Error("Campanha nao esta em processamento.");
  }
}

export function isDisparoCampaignInterruptedDB(
  campaignId: string
): boolean {
  if (!validId(campaignId)) {
    throw new Error("Campanha invalida.");
  }

  const result = rows(`
    SELECT status
    FROM disparo_campaigns
    WHERE id = ${sqlText(campaignId)}
    LIMIT 1;
  `);

  return result[0]?.[0] !== "Processando";
}
