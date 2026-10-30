import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE = "https://disparo.digitaletextil.com.br";

const NETWORKS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "site", label: "Site" }
] as const;

function iconUrl(key: string, color: unknown) {
  const hex = /^#[0-9a-f]{6}$/i.test(String(color))
    ? String(color).slice(1) : "EC6C20";
  return `${BASE}/social-icon/${key}/${hex}.png`;
}

export function SocialBlockPreview({
  content, styles
}: {
  content: any;
  styles: Record<string, any>;
}) {
  if (!content.socialLinks) {
    return <span className="text-blue-600 underline">
      {content.text || "Rede social"}
    </span>;
  }

  const links = content.socialLinks || {};
  const size = Math.max(16, Math.min(64, Number(styles.socialSize) || 30));
  const gap = Math.max(0, Math.min(40, Number(styles.socialGap) || 12));

  const active = NETWORKS.filter(n =>
    /^https?:\/\//i.test(String(links[n.key] || ""))
  );

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent:
        styles.textAlign === "left" ? "flex-start" :
        styles.textAlign === "right" ? "flex-end" : "center",
      gap
    }}>
      {active.length ? active.map(n => (
        <img
          key={n.key}
          src={iconUrl(n.key, styles.socialColor)}
          alt={n.label}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      )) : (
        <span className="text-xs text-slate-400">
          Configure os links das redes sociais
        </span>
      )}
    </div>
  );
}

export function SocialBlockControls({
  content, styles, onContentChange, onStyleChange
}: {
  content: any;
  styles: Record<string, any>;
  onContentChange: (key: string, value: any) => void;
  onStyleChange: (key: string, value: any) => void;
}) {
  const links = content.socialLinks || {};

  return (
    <div className="space-y-4 rounded-lg border p-3">
      <p className="text-xs font-semibold">Redes sociais</p>

      {NETWORKS.map(n => (
        <div key={n.key} className="space-y-1">
          <Label className="text-xs">{n.label}</Label>
          <Input
            type="url"
            className="h-8 text-xs"
            placeholder="https://..."
            value={String(links[n.key] || "")}
            onChange={e =>
              onContentChange("socialLinks", {
                ...links,
                [n.key]: e.target.value
              })
            }
          />
        </div>
      ))}

      <div className="space-y-1">
        <Label className="text-xs">Cor dos ícones PNG</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            className="h-9 w-12 p-1"
            value={/^#[0-9a-f]{6}$/i.test(String(styles.socialColor))
              ? styles.socialColor : "#EC6C20"}
            onChange={e => onStyleChange("socialColor", e.target.value)}
          />
          <Input
            className="h-9 flex-1 font-mono text-xs"
            placeholder="#EC6C20"
            value={styles.socialColor || "#EC6C20"}
            onChange={e => onStyleChange("socialColor", e.target.value)}
          />
        </div>
      </div>

      {[
        { key: "socialSize", label: "Tamanho", min: 16, max: 64, fallback: 30 },
        { key: "socialGap", label: "Espaçamento", min: 0, max: 40, fallback: 12 }
      ].map(item => (
        <div key={item.key} className="space-y-1">
          <Label className="text-xs">{item.label} (px)</Label>
          <Input
            type="number"
            min={item.min}
            max={item.max}
            value={styles[item.key] ?? item.fallback}
            onChange={e => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) {
                onStyleChange(
                  item.key,
                  Math.max(item.min, Math.min(item.max, n))
                );
              }
            }}
          />
        </div>
      ))}

      <div className="space-y-1">
        <Label className="text-xs">Alinhamento</Label>
        <select
          value={styles.textAlign || "center"}
          onChange={e => onStyleChange("textAlign", e.target.value)}
          className="h-9 w-full rounded-md border bg-white px-2 text-xs"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </div>

      <p className="text-xs text-slate-500">
        Apenas as redes com links preenchidos serão exibidas.
      </p>
    </div>
  );
}
