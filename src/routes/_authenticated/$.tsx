import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-6 rounded-full bg-orange-100 p-6">
        <AlertTriangle className="h-12 w-12 text-orange-600" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">404</h1>
      <p className="mt-4 text-lg font-medium text-muted-foreground">
        Oops! A página que você está procurando não existe ou foi movida.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild className="bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20">
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
