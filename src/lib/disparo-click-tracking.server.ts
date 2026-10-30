import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const BASE = "https://disparo.digitaletextil.com.br";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[0-9a-f]{64}$/i;

function sqlText(value: string): string {
  return "CONVERT(UNHEX('" +
    Buffer.from(value, "utf8").toString("hex") +
    "') USING utf8mb4)";
}

function mysql(sql: string): string {
  const env = process.env;
  if (env["DB_NAME"] !== "TESTE_DISPARO" ||
      !env["DB_USER"] ||
      env["DB_PASSWORD"] === undefined) {
    throw new Error("click_tracking_db_not_configured");
  }

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names"
  ], {
    input: sql,
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024,
    env: {...env, MYSQL_PWD: env["DB_PASSWORD"]}
  });

  if (result.error || result.status !== 0) {
    throw new Error("click_tracking_database_error");
  }

  return result.stdout.trim();
}

function hash(token: string): string {
  return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

function decodeHref(value: string): string {
  return value
    .replace(/&amp;|&#38;|&#x26;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'");
}

function safeDestination(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname || url.username || url.password) return null;

    const host = url.hostname.toLowerCase();
    if (host === "disparo.digitaletextil.com.br") return null;

    // Links operacionais de descadastro nao devem ser reescritos.
    if (/unsubscribe|descadastr|opt.?out|list-unsubscribe/i.test(value)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function rewriteTrackedLinks(
  html: string,
  input: { campaignId: string; attemptId: string }
): string {
  if (!UUID.test(input.campaignId) || !UUID.test(input.attemptId)) {
    throw new Error("click_tracking_invalid_ids");
  }

  const links: Array<{token: string; url: string}> = [];

  const rewritten = html.replace(/<a\b[^>]*>/gi, tag => {
    const match = tag.match(/(\s+href\s*=\s*)(["'])(.*?)\2/i);
    if (!match) return tag;

    const url = safeDestination(decodeHref(match[3] ?? ""));
    if (!url) return tag;

    const token = randomBytes(32).toString("hex");
    links.push({token, url});

    const original = match[0];
    const replacement =
      match[1] + match[2] +
      BASE + "/track/click?t=" + token +
      match[2];

    return tag.replace(original, replacement);
  });

  if (links.length === 0) return rewritten;

  const statements = links.map(link => `
    INSERT INTO disparo_tracking_links
      (id, campaign_id, attempt_id, token_hash, destination_url)
    SELECT
      UUID(),
      a.campaign_id,
      a.id,
      '${hash(link.token)}',
      ${sqlText(link.url)}
    FROM disparo_email_attempts a
    JOIN disparo_campaign_recipients r
      ON BINARY r.attempt_id = BINARY a.id
     AND BINARY r.campaign_id = BINARY a.campaign_id
    WHERE BINARY a.id = BINARY ${sqlText(input.attemptId)}
      AND BINARY a.campaign_id = BINARY ${sqlText(input.campaignId)}
      AND a.send_kind = 'campaign'
      AND a.status = 'queued'
      AND r.delivery_status = 'prepared';
    SET @click_rows = @click_rows + ROW_COUNT();
  `).join("\n");

  const output = mysql(`
    START TRANSACTION;
    SET @click_rows = 0;
    ${statements}
    SELECT @click_rows;
    COMMIT;
  `);

  const count = Number(output.split("\n")[0]);
  if (count !== links.length) {
    throw new Error("click_tracking_links_not_persisted");
  }

  return rewritten;
}

function escapeRedirectHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function handleTrackedClick(request: Request): Response {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (!TOKEN.test(token)) {
    return new Response("Link invalido", {status: 404});
  }

  let destination: string;

  try {
    const result = mysql(`
      SELECT HEX(l.destination_url)
      FROM disparo_tracking_links l
      JOIN disparo_email_attempts a
        ON BINARY a.id = BINARY l.attempt_id
       AND BINARY a.campaign_id = BINARY l.campaign_id
      JOIN disparo_campaign_recipients r
        ON BINARY r.attempt_id = BINARY a.id
       AND BINARY r.campaign_id = BINARY a.campaign_id
      WHERE l.token_hash = '${hash(token)}'
        AND a.status = 'accepted'
        AND a.send_kind = 'campaign'
        AND r.delivery_status = 'accepted'
      LIMIT 1;
    `);

    if (!result || !/^[0-9a-f]+$/i.test(result)) {
      return new Response("Link nao encontrado", {status: 404});
    }

    destination = Buffer.from(result, "hex").toString("utf8");
  } catch {
    return new Response("Servico temporariamente indisponivel", {
      status: 503,
      headers: {"Retry-After": "30"}
    });
  }

  const safe = safeDestination(destination);
  if (!safe) {
    return new Response("Destino invalido", {status: 404});
  }

  try {
    mysql(`
      INSERT INTO disparo_click_events
        (id, link_id, occurred_at)
      SELECT UUID(), l.id, UTC_TIMESTAMP(6)
      FROM disparo_tracking_links l
      WHERE l.token_hash = '${hash(token)}';
    `);
  } catch (error) {
    console.error("Falha ao registrar clique", error);
    // O destino validado continua acessivel.
  }

  // DIGITALE_REDIRECT_SCREEN_V1
  const nonce = randomBytes(16).toString("base64");

  const destinationJson = JSON.stringify(safe)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  const escapedDestination = escapeRedirectHtml(safe);

  const page = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Redirecionamento seguro | Digitale Têxtil</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 28px;
      background: #17283d;
      color: #fff;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    main {
      width: 100%;
      max-width: 580px;
      text-align: center;
    }
    .logo {
      width: min(75%, 275px);
      height: auto;
      object-fit: contain;
      margin: 0 auto 42px;
      display: block;
    }
    .message {
      font-size: clamp(17px, 3.8vw, 23px);
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: -.3px;
    }
    .dots { display: inline-flex; width: 35px; }
    .dot {
      display: inline-block;
      width: 10px;
      opacity: .15;
      animation: digitale-dot 1.2s infinite;
    }
    .dot:nth-child(2) { animation-delay: .25s; }
    .dot:nth-child(3) { animation-delay: .5s; }
    @keyframes digitale-dot {
      0%, 70%, 100% {
        opacity: .15;
        transform: translateY(0);
      }
      25% {
        opacity: 1;
        transform: translateY(-5px);
      }
    }
    .progress {
      margin: 32px auto 22px;
      height: 3px;
      max-width: 230px;
      background: rgba(255,255,255,.16);
      overflow: hidden;
      border-radius: 20px;
    }
    .progress::before {
      content: "";
      display: block;
      height: 100%;
      width: 0;
      background: #e97730;
      animation: digitale-progress 2s linear forwards;
    }
    @keyframes digitale-progress {
      to { width: 100%; }
    }
    .subtitle {
      color: #d6dce4;
      font-size: 12px;
      letter-spacing: .2px;
    }
    .fallback {
      display: inline-block;
      color: #e5e9ee;
      margin-top: 25px;
      font-size: 12px;
      text-underline-offset: 4px;
    }
    @media (prefers-reduced-motion: reduce) {
      .dot, .progress::before { animation: none; }
    }
  </style>
</head>
<body>
  <main>
    <img
      class="logo"
      src="https://digitaletextil.com.br/assets/logo-white-BL4XdEG_.png"
      alt="Digitale Têxtil"
    >
    <div class="message">
      Estamos te direcionando com segurança<span class="dots"
      aria-label="..."><span class="dot">.</span><span
      class="dot">.</span><span class="dot">.</span></span>
    </div>
    <div class="progress" aria-hidden="true"></div>
    <p class="subtitle">Digitale Têxtil · Redirecionamento seguro</p>
    <a class="fallback" href="${escapedDestination}">
      Clique aqui caso não seja redirecionado
    </a>
  </main>
  <script nonce="${nonce}">
    setTimeout(function() {
      window.location.replace(${destinationJson});
    }, 2000);
  </script>
  <noscript>
    <meta http-equiv="refresh"
      content="2;url=${escapedDestination}">
  </noscript>
</body>
</html>`;

  return new Response(page, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy":
        "default-src 'none'; " +
        "img-src https://digitaletextil.com.br; " +
        "style-src 'unsafe-inline'; " +
        "script-src 'nonce-" + nonce + "'; " +
        "base-uri 'none'; form-action 'none'; " +
        "frame-ancestors 'none'"
    }
  });
}
