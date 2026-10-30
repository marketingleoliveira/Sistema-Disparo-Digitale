import { PixelTrackingSummary } from "@/components/analytics/PixelTrackingSummary";
import { createFileRoute } from "@tanstack/react-router";
import { EmailAnalyticsView } from "@/components/analytics/EmailAnalyticsView";
import { SmtpDeliveryPanel } from "@/components/campaigns/SmtpDeliveryPanel";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (<div className="space-y-6"><PixelTrackingSummary /><SmtpDeliveryPanel /><EmailAnalyticsView /></div>)
});
