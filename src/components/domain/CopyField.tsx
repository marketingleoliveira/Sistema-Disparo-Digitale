import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyFieldProps extends React.ComponentProps<"div"> {
  label: string;
  value: string;
}

export function CopyField({ label, value, className, ...props }: CopyFieldProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("space-y-1", className)} {...props}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{value || "—"}</code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copiar ${label}`}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}