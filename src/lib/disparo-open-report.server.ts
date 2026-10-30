
import { spawnSync } from "node:child_process";
import { requireDisparoUser }
  from "./disparo-auth.server";

function checkAccess(): void {
  const user = requireDisparoUser();

  if (![
    "Desenvolvedor",
    "Diretoria",
    "Gerência"
  ].includes(user.role)) {
    throw new Error("Acesso nao autorizado ao relatorio.");
  }
}

function query(sql: string): string[][] {
  const env = process.env;
  const user = env["DB_USER"];
  const password = env["DB_PASSWORD"];

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !user ||
    password === undefined
  ) {
    throw new Error("MariaDB nao configurado.");
  }

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", user,
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names"
  ], {
    input: sql + ";\n",
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: password
    }
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha ao consultar aberturas.");
  }

  const output = result.stdout.trim();

  return output
    ? output.split("\n").map(line => line.split("\t"))
    : [];
}

function decode(hex: string | undefined): string {
  if (!hex || hex === "NULL") return "";

  if (!/^(?:[0-9A-F]{2})*$/i.test(hex)) {
    throw new Error("Resultado SQL invalido.");
  }

  return Buffer.from(hex, "hex").toString("utf8");
}

const baseSql = `
  FROM disparo_email_events e
  JOIN disparo_email_attempts a
    ON BINARY a.id = BINARY e.attempt_id
  JOIN disparo_campaign_recipients r
    ON BINARY r.attempt_id = BINARY a.id
   AND BINARY r.campaign_id = BINARY a.campaign_id
  JOIN disparo_contact_lists l
    ON BINARY l.id = BINARY r.list_id
  LEFT JOIN disparo_campaigns cp
    ON BINARY cp.id = BINARY r.campaign_id
  WHERE e.event_type = 'open'
    AND a.status = 'accepted'
    AND a.send_kind = 'campaign'
    AND r.delivery_status = 'accepted'
    AND r.sent_at IS NOT NULL
    AND (cp.id IS NULL OR cp.archived_at IS NULL)
`;

function filterForList(listId: string): string {
  if (listId === "all") return "";

  if (!/^(?:[0-9A-F]{2}){1,128}$/i.test(listId)) {
    throw new Error("Identificador da lista invalido.");
  }

  return ` AND HEX(l.id) = '${listId.toUpperCase()}'`;
}

export function getIaProspectingOpenReportDB(
  listId: string = "all"
) {
  checkAccess();

  const filter = filterForList(listId);

  const lists = query(`
    SELECT HEX(id), HEX(name)
    FROM disparo_contact_lists
    ORDER BY name ASC
    LIMIT 5000
  `).map(row => ({
    id: row[0] ?? "",
    name: decode(row[1])
  }));

  const totals = query(`
    SELECT
      COUNT(DISTINCT LOWER(TRIM(r.recipient_email))),
      COUNT(DISTINCT r.campaign_id),
      COUNT(DISTINCT e.id)
    ${baseSql}
    ${filter}
  `);

  const total = totals[0] ?? ["0", "0", "0"];

  const records = query(`
    SELECT
      HEX(LOWER(TRIM(r.recipient_email))),
      HEX(l.id),
      HEX(l.name),
      HEX(r.campaign_id),
      HEX(COALESCE(cp.name, 'Campanha removida')),
      DATE_FORMAT(MIN(e.occurred_at), '%Y-%m-%d %H:%i:%s'),
      DATE_FORMAT(MAX(e.occurred_at), '%Y-%m-%d %H:%i:%s'),
      COUNT(DISTINCT e.id)
    ${baseSql}
    ${filter}
    GROUP BY
      LOWER(TRIM(r.recipient_email)),
      l.id, l.name, r.campaign_id, cp.name
    ORDER BY MAX(e.occurred_at) DESC
    LIMIT 500
  `);

  let cnpjMap = new Map<string, string>();
  let cnpjLookupUnavailable = false;

  try {
    cnpjMap = lookupCnpjs(
      records.map(row => decode(row[0]))
    );
  } catch {
    cnpjLookupUnavailable = true;
  }

  return {
    lists,
    selectedListId: listId,
    uniqueOpeners: Number(total[0] ?? 0),
    openedCampaigns: Number(total[1] ?? 0),
    recordedEvents: Number(total[2] ?? 0),
    cnpjLookupUnavailable,
    rows: records.map(row => ({
      email: decode(row[0]),
      listId: row[1] ?? "",
      listName: decode(row[2]),
      cnpj: cnpjMap.get(decode(row[0])) ?? null,
      campaignId: decode(row[3]),
      campaignName: decode(row[4]),
      firstOpenedAt: row[5] ?? "",
      lastOpenedAt: row[6] ?? "",
      eventCount: Number(row[7] ?? 0)
    }))
  };
}

export function getIaProspectingOpenCountDB(): number {
  checkAccess();

  const rows = query(`
    SELECT COUNT(DISTINCT LOWER(TRIM(r.recipient_email)))
    ${baseSql}
  `);

  return Number(rows[0]?.[0] ?? 0);
}

function validCnpj(description:string):string|null {
  const match=description.match(
    /\bCNPJ\s*:\s*([0-9.\-/\s]{14,20})/i
  );

  // Grupos de regex podem ser indefinidos.
  const digits=(match?.[1] ?? "").replace(/\D/g,"");

  if(
    digits.length!==14 ||
    /^(\d)\1{13}$/.test(digits)
  )return null;

  function verifier(
    part:string,
    weights:number[]
  ):number {
    const sum=weights.reduce(
      (total,weight,i)=>
        total+Number(part.charAt(i))*weight,
      0
    );
    const rest=sum%11;
    return rest<2?0:11-rest;
  }

  if(
    verifier(
      digits.slice(0,12),
      [5,4,3,2,9,8,7,6,5,4,3,2]
    )!==Number(digits.charAt(12))
    ||
    verifier(
      digits.slice(0,13),
      [6,5,4,3,2,9,8,7,6,5,4,3,2]
    )!==Number(digits.charAt(13))
  )return null;

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function lookupCnpjs(emails:string[]):Map<string,string> {
  const results=new Map<string,string>();
  const ambiguous=new Set<string>();

  const unique=[...new Set(
    emails.map(e=>e.trim().toLowerCase())
  )].filter(e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if(!unique.length)return results;

  const values=unique.map(e=>
    "'"+Buffer.from(e,"utf8").toString("hex").toUpperCase()+"'"
  );

  // Comparacao exata do email usando HEX.
  // Nenhum CNPJ e gravado no Disparo.
  const sql=`
    SELECT
      HEX(LOWER(TRIM(p.email))),
      HEX(COALESCE(d.description,''))
    FROM portal_digitale.crm_deals d
    JOIN portal_digitale.crm_people p
      ON BINARY p.id=BINARY d.person_id
    WHERE HEX(LOWER(TRIM(p.email)))
      IN (${values.join(",")})
      AND d.description LIKE '%CNPJ%'
    LIMIT 2500
  `;

  const run=spawnSync("mysql",[
    "--defaults-extra-file=/var/www/TESTE_DISPARO/.portal-ia-read.cnf",
    "--batch","--raw","--skip-column-names",
    "--default-character-set=utf8mb4",
    "--execute",sql
  ],{
    encoding:"utf8",
    timeout:20000,
    maxBuffer:8*1024*1024
  });

  if(run.error||run.status!==0){
    throw new Error("Agendor indisponivel.");
  }

  for(const row of run.stdout.trim().split("\n")){
    if(!row)continue;

    const [emailHex,descriptionHex]=row.split("\t");

    const email=Buffer.from(
      emailHex??"","hex"
    ).toString("utf8");

    const description=Buffer.from(
      descriptionHex??"","hex"
    ).toString("utf8");

    const cnpj=validCnpj(description);
    if(!cnpj||ambiguous.has(email))continue;

    const previous=results.get(email);

    if(previous && previous!==cnpj){
      results.delete(email);
      ambiguous.add(email);
    }else{
      results.set(email,cnpj);
    }
  }

  return results;
}
