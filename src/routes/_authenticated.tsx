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
    <div className="min-h-screen bg-white text-foreground selection:bg-accent/20 selection:text-accent">
      <AppSidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-[1400px] p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
