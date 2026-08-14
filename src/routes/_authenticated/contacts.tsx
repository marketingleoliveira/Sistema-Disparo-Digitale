import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: () => (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
      <p className="text-muted-foreground">Gerencie sua base de clientes e leads.</p>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">Módulo de contatos em desenvolvimento...</p>
      </div>
    </div>
  ),
});
