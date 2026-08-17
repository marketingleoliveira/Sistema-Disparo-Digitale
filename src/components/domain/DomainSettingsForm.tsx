import * as React from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAIN_PROVIDERS, getProviderPreset } from "@/lib/domain/providers";
import type { DomainConfig, DomainConfigUpdate } from "@/hooks/use-domain-config";

export interface DomainSettingsFormProps {
  config: DomainConfig;
  isSaving: boolean;
  onSave: (patch: DomainConfigUpdate) => void;
  onDelete: () => void;
}

export function DomainSettingsForm({ config, isSaving, onSave, onDelete }: DomainSettingsFormProps) {
  const [form, setForm] = React.useState<DomainConfig>(config);

  React.useEffect(() => setForm(config), [config]);

  const setField = <K extends keyof DomainConfig>(key: K, value: DomainConfig[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleProvider = (providerId: string) => {
    const preset = getProviderPreset(providerId);
    setForm((prev) => ({
      ...prev,
      provider: providerId,
      spf_value: preset.spf,
      dkim_selector: preset.dkimSelector,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      domain: form.domain.trim().toLowerCase(),
      provider: form.provider,
      sender_name: form.sender_name,
      sender_email: form.sender_email.trim().toLowerCase(),
      reply_to: form.reply_to?.trim().toLowerCase() || null,
      dkim_selector: form.dkim_selector,
      dkim_value: form.dkim_value,
      spf_value: form.spf_value,
      dmarc_value: form.dmarc_value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="domain">Domínio</Label>
          <Input
            id="domain"
            value={form.domain}
            onChange={(e) => setField("domain", e.target.value)}
            placeholder="digitaletextil.com.br"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provedor de e-mail</Label>
          <Select value={form.provider} onValueChange={handleProvider}>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              {DOMAIN_PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sender_name">Nome do remetente</Label>
          <Input
            id="sender_name"
            value={form.sender_name}
            onChange={(e) => setField("sender_name", e.target.value)}
            placeholder="Digitale Têxtil"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sender_email">E-mail de envio</Label>
          <Input
            id="sender_email"
            type="email"
            value={form.sender_email}
            onChange={(e) => setField("sender_email", e.target.value)}
            placeholder="noreply@digitaletextil.com.br"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reply_to">Responder para (opcional)</Label>
          <Input
            id="reply_to"
            type="email"
            value={form.reply_to ?? ""}
            onChange={(e) => setField("reply_to", e.target.value)}
            placeholder="marketing@digitaletextil.com.br"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dkim_selector">Seletor DKIM</Label>
          <Input
            id="dkim_selector"
            value={form.dkim_selector}
            onChange={(e) => setField("dkim_selector", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spf_value">Registro SPF</Label>
        <Input id="spf_value" value={form.spf_value} onChange={(e) => setField("spf_value", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dmarc_value">Registro DMARC</Label>
        <Input id="dmarc_value" value={form.dmarc_value} onChange={(e) => setField("dmarc_value", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dkim_value">Chave pública DKIM</Label>
        <Textarea
          id="dkim_value"
          rows={3}
          value={form.dkim_value ?? ""}
          onChange={(e) => setField("dkim_value", e.target.value)}
          placeholder="v=DKIM1; k=rsa; p=..."
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Remover domínio
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar configuração
        </Button>
      </div>
    </form>
  );
}