import { PixelTrackingSummary } from "@/components/analytics/PixelTrackingSummary";
import { createFileRoute } from "@tanstack/react-router";
import { EmailAnalyticsView } from "@/components/analytics/EmailAnalyticsView";

// A arvore de rotas sera regenerada no proximo build.
// @ts-ignore
export const Route = createFileRoute("/_authenticated/metrics")({
  component: () => (<div className="space-y-6"><PixelTrackingSummary /><EmailAnalyticsView summary /></div>)
});
