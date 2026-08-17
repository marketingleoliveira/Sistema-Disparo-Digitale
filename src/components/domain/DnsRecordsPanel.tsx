import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "./CopyField";
import { OWNERSHIP_TXT_HOST, ownershipTxtValue } from "@/lib/domain/providers";
import type { DomainConfig } from "@/hooks/use-domain-config";
import { cn } from "@/lib/utils";

export interface DnsCheckItem {
  key: string;
  label: string;
  ok: boolean;
  found: string[];
  detail: string;
}

export interface DnsRecordsPanelProps {
  config: DomainConfig;
  items: DnsCheckItem[] | null;
  checkedAt: string | null;
  isChecking: boolean;
  onVerify: () => void;
}

export function DnsRecordsPanel({ config, items, checkedAt, isChecking, onVerify }: DnsRecordsPanelProps) {
  const records = [
    { label: `TXT — ${OWNERSHIP_TXT_HOST}.${config.domain}`, value: ownershipTxtValue(config.verification_token) },
    { label: `TXT — ${config.domain} (SPF)`, value: config.spf_value },
    {
      label: `TXT — ${config.dkim_selector}._domainkey.${config.domain} (DKIM)`,
      value: config.dkim_value || "cole aqui a chave pública fornecida pelo provedor",
    },
    { label: `TXT — _dmarc.${config.domain} (DMARC)`, value: config.dmarc_value },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Registros DNS</h2>
            <p className="text-xs text-muted-foreground">
              Cadastre estes registros no painel do seu provedor de DNS.
            </p>
          </div>
          <Button onClick={onVerify} disabled={isChecking} size="sm">
            {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Verificar agora
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((record) => (
            <CopyField key={record.label} label={record.label} value={record.value} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Status da verificação</h2>
          {checkedAt && (
            <span className="text-[11px] text-muted-foreground">
              Última checagem: {new Date(checkedAt).toLocaleString("pt-BR")}
            </span>
          )}
        </div>

        {!items && (
          <p className="text-sm text-muted-foreground">
            Nenhuma verificação executada ainda. Clique em “Verificar agora” para consultar o DNS.
          </p>
        )}

        <div className="space-y-3">
          {items?.map((item) => (
            <div key={item.key} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
              {item.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <Badge variant={item.ok ? "default" : "destructive"} className="text-[10px]">
                    {item.ok ? "Configurado" : "Pendente"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                {item.found.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.found.map((found, index) => (
                      <li
                        key={`${item.key}-${index}`}
                        className={cn("break-all font-mono text-[11px]", item.ok ? "text-foreground" : "text-muted-foreground")}
                      >
                        {found}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}