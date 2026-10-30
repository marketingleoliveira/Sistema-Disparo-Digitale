import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/templates/whatsapp")({
  component: ChannelPage,
});

function ChannelPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/templates" className="rounded-lg border px-4 py-2 text-sm">
          E-mail
        </a>
        <a href="/templates/sms" className="rounded-lg border px-4 py-2 text-sm">
          SMS
        </a>
        <a href="/templates/whatsapp" className="rounded-lg border px-4 py-2 text-sm">
          WhatsApp
        </a>
      </div>
      <h1 className="text-2xl font-semibold">Templates de WhatsApp</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Modulo em desenvolvimento.
      </p>
    </main>
  );
}
