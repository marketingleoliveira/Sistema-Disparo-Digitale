
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { SmtpDeliveryPanel } from
  "@/components/campaigns/SmtpDeliveryPanel";

export function CampaignDetailsModal({
  campaignId, name
}: {
  campaignId: string;
  name: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left font-semibold text-primary hover:text-orange-600 hover:underline focus-visible:outline focus-visible:outline-2 rounded-sm"
        title={`Acompanhar campanha ${name}`}
      >
        {name}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do envio</DialogTitle>
            <DialogDescription>
              {name} · acompanhamento por destinatário
            </DialogDescription>
          </DialogHeader>

          {open && (
            <SmtpDeliveryPanel campaignId={campaignId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
