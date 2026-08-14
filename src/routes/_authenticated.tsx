import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "../components/layout/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Mock de autenticação para o MVP
    const isAuthenticated = true;
    if (!isAuthenticated) {
      throw redirect({
        to: "/",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="container mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
