import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (
    <div className="rounded-xl border p-6">
      <h1 className="text-xl font-semibold">
        Analytics temporariamente indisponível
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este módulo está temporariamente desativado.
      </p>
    </div>
  ),
});
