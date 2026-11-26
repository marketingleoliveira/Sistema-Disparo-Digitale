import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/agent/v1")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/disparo-agent-api.server")).handleAgent(request),
      POST: async ({ request }) => (await import("@/lib/disparo-agent-api.server")).handleAgent(request),
    }
  }
});
