import { createFileRoute } from "@tanstack/react-router";
import { VisualEmailEditor } from "@/components/editor/VisualEmailEditor";

export const Route = createFileRoute("/_authenticated/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Editor de Template</h1>
          <p className="text-sm text-muted-foreground">
            Crie e personalize seus templates de e-mail com o editor visual.
          </p>
        </div>
      </div>
      
      <VisualEmailEditor />
    </div>
  );
}

