import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainSettingsForm } from "@/components/domain/DomainSettingsForm";
import { DnsRecordsPanel, type DnsCheckItem } from "@/components/domain/DnsRecordsPanel";
import { useDomainConfigs, useDomainMutations, type DomainConfigUpdate } from "@/hooks/use-domain-config";
import { checkDomainDns } from "@/lib/domain.functions";
import { getProviderPreset } from "@/lib/domain/providers";

export const Route = createFileRoute("/_authenticated/settings_/domain")({
  head: () => ({
    meta: [
      { title: "Domínio de E-mail | Newsletter Digitale Têxtil" },
      {
        name: "description",
        content:
          "Configure o domínio de envio, provedor, remetente e registros SPF, DKIM e DMARC da plataforma de e-mail da Digitale Têxtil.",
      },
      { property: "og:title", content: "Domínio de E-mail | Digitale Têxtil" },
      {
        property: "og:description",
        content: "Painel interno para verificar SPF, DKIM e DMARC do domínio de envio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DomainSettingsPage,
});

function DomainSettingsPage() {
  const { data: configs, isLoading } = useDomainConfigs();
  const { create, update, remove } = useDomainMutations();
  const runCheck = useServerFn(checkDomainDns);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [checks, setChecks] = React.useState<Record<string, { items: DnsCheckItem[]; checkedAt: string }>>({});
  const [isChecking, setIsChecking] = React.useState(false);

  const activeId = selectedId ?? configs?.[0]?.id ?? null;
  const active = configs?.find((c) => c.id === activeId) ?? null;
  const activeCheck = active ? checks[active.id] : undefined;

  const handleCreate = () => {
    const preset = getProviderPreset("lovable");
    create.mutate(
      {
        domain: "digitaletextil.com.br",
        provider: preset.id,
        sender_name: "Digitale Têxtil",
        sender_email: "noreply@digitaletextil.com.br",
        spf_value: preset.spf,
        dkim_selector: preset.dkimSelector,
      },
      {
        onSuccess: (created) => {
          setSelectedId(created.id);
          toast.success("Domínio criado. Ajuste os dados e cadastre os registros DNS.");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const handleSave = (patch: DomainConfigUpdate) => {
    if (!active) return;
    update.mutate(
      { id: active.id, patch },
      {
        onSuccess: () => toast.success("Configuração de domínio salva."),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const handleDelete = () => {
    if (!active) return;
    remove.mutate(active.id, {
      onSuccess: () => {
        setSelectedId(null);
        toast.success("Domínio removido.");
      },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  const handleVerify = async () => {
    if (!active) return;
    setIsChecking(true);
    try {
      const result = await runCheck({
        data: {
          domain: active.domain,
          token: active.verification_token,
          dkimSelector: active.dkim_selector,
          spfInclude: active.spf_value,
        },
      });
      const items = result.items as DnsCheckItem[];
      setChecks((prev) => ({ ...prev, [active.id]: { items, checkedAt: result.checkedAt } }));

      const byKey = (key: string) => items.find((i) => i.key === key)?.ok ?? false;
      await update.mutateAsync({
        id: active.id,
        patch: {
          ownership_verified: byKey("ownership"),
          spf_verified: byKey("spf"),
          dkim_verified: byKey("dkim"),
          dmarc_verified: byKey("dmarc"),
          last_checked_at: result.checkedAt,
        },
      });
      toast.success("Verificação DNS concluída.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível consultar o DNS.");
    } finally {
      setIsChecking(false);
    }
  };

  const isReady = Boolean(active?.spf_verified && active?.dkim_verified && active?.ownership_verified);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Globe className="h-6 w-6 text-primary" />
            Domínio de e-mail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure o provedor, o remetente e a autenticação (SPF, DKIM e DMARC) do domínio de envio.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Novo domínio
        </Button>
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-12 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando domínios...
        </div>
      )}

      {!isLoading && (configs?.length ?? 0) === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Nenhum domínio configurado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre o domínio da Digitale Têxtil para habilitar disparos autenticados.
          </p>
        </div>
      )}

      {active && (
        <>
          {(configs?.length ?? 0) > 1 && (
            <Tabs value={active.id} onValueChange={setSelectedId}>
              <TabsList>
                {configs?.map((config) => (
                  <TabsTrigger key={config.id} value={config.id}>
                    {config.domain}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isReady ? "default" : "secondary"}>
              {isReady ? "Domínio autenticado" : "Autenticação pendente"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Remetente: {active.sender_name} &lt;{active.sender_email || "não definido"}&gt;
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DomainSettingsForm
              config={active}
              isSaving={update.isPending}
              onSave={handleSave}
              onDelete={handleDelete}
            />
            <DnsRecordsPanel
              config={active}
              items={activeCheck?.items ?? null}
              checkedAt={activeCheck?.checkedAt ?? active.last_checked_at}
              isChecking={isChecking}
              onVerify={handleVerify}
            />
          </div>
        </>
      )}
    </div>
  );
}