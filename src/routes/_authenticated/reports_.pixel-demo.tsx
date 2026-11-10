import { createFileRoute } from "@tanstack/react-router";
import { PixelTrackingDemo } from "@/components/analytics/PixelTrackingDemo";

export const Route = createFileRoute(
  "/_authenticated/reports_/pixel-demo"
)({
  component: PixelTrackingDemo,
});
