import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/templates")({
  component: () => (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">Módulo de templates em desenvolvimento...</p>
      </div>
    </div>
  ),
});
