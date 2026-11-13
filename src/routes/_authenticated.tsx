// DIGITALE_CAMPAIGN_NOTIFICATIONS_V1
import { CampaignNotificationBell } from "@/components/notifications/CampaignNotifications";
import * as React from "react";
import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "../components/layout/AppSidebar";
import { useAuthStore } from "@/hooks/use-auth";
import { getDisparoSession } from "@/lib/disparo-auth.functions";
import { 
  Bell, 
  HelpCircle, 
  Search, 
  ChevronRight,
  User,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    let user = null;

    try {
      user = await getDisparoSession();
    } catch (error) {
      console.error("Erro ao verificar sessao:", error);
    }

    if (!user) {
      throw redirect({ to: "/" });
    }

    if (
      user.role === "SDK" &&
      window.location.pathname !== "/templates" &&
      !window.location.pathname.startsWith("/templates/")
    ) {
      throw redirect({ to: "/templates" });
    }

    useAuthStore.getState().acceptSession(user);
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/", replace: true });
  };
  
  // Mapeamento simples de caminhos para títulos amigáveis
  const pathMap: Record<string, string> = {
    dashboard: "Dashboard",
    campaigns: "Campanhas",
    templates: "Templates",
    automations: "Automações",
    forms: "Formulários",
    contacts: "Contatos",
    lists: "Listas",
    segments: "Segmentos",
    reports: "Relatórios",
    settings: "Configurações",
    perfil: "Perfil",
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const currentTitle = (lastPart && pathMap[lastPart]) || "Visão Geral";

  // DIGITALE_WHITE_DARK_V1
  React.useEffect(() => {
    const KEY = "digitale-disparo-appearance-v1";

    const apply = (value: string | null) => {
      document.documentElement.classList.toggle(
        "digitale-dark",
        value === "dark"
      );
    };

    try {
      apply(window.localStorage.getItem(KEY));
    } catch {
      apply(null);
    }

    const handleChange = () => {
      try {
        apply(window.localStorage.getItem(KEY));
      } catch {
        apply(null);
      }
    };

    window.addEventListener(
      "digitale-appearance-change",
      handleChange
    );

    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(
        "digitale-appearance-change",
        handleChange
      );
      window.removeEventListener("storage", handleChange);
    };
  }, []);


  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-accent flex">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] bg-slate-50 digitale-app-surface">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b bg-background/80 pl-16 pr-4 md:pl-20 md:pr-8 lg:px-8 backdrop-blur-md shadow-sm">

          {/* Left Side: Breadcrumb & Context Title */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard" className="text-[11px] font-medium transition-colors hover:text-primary">Início</BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathParts.map((part, index) => {
                    const isLast = index === pathParts.length - 1;
                    const title = pathMap[part] || part;
                    return (
                      <React.Fragment key={part}>
                        <BreadcrumbSeparator className="opacity-40" />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="text-[11px] font-bold text-primary">{title}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={`/${part}`} className="text-[11px] font-medium transition-colors hover:text-primary">{title}</BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <h2 className="text-sm font-bold text-primary lg:hidden">
              {currentTitle}
            </h2>
          </div>

          {/* Right Side: Actions & Profile */}
          <div className="flex items-center gap-1 md:gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-all active:scale-95 group">
                <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>
              <CampaignNotificationBell />
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-all active:scale-95 group">
                <HelpCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>
            </div>
            
            <div className="mx-2 h-6 w-px bg-border/60 hidden sm:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-all hover:bg-secondary active:scale-[0.98] border border-transparent hover:border-border/40">
                  <Avatar className="h-8 w-8 border-2 border-primary/10 shadow-sm transition-transform hover:rotate-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">{user?.initials || '??'}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="text-[11px] font-bold leading-none text-foreground">{user?.name || 'Usuário'}</p>
                    <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">{user?.role || 'Visitante'}</p>
                  </div>
                  <ChevronDown className="hidden h-3 w-3 text-muted-foreground/60 lg:block transition-transform duration-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 transition-colors hover:bg-secondary" onSelect={() => navigate({ to: "/perfil" })}>
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 transition-colors hover:bg-secondary">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleLogout();
                  }}
                  className="text-destructive cursor-pointer rounded-lg mx-1 transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-sm font-bold">Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Aviso temporário: incidente Microsoft 365 / Exchange Online */}
        <div
          role="status"
          aria-label="Aviso sobre atrasos em e-mails Microsoft 365"
          className="digitale-service-marquee relative z-20 flex h-10 w-full items-center overflow-hidden border-b border-amber-200 bg-amber-50 text-amber-950"
        >
          <span className="absolute left-0 z-10 flex h-full items-center bg-amber-50 px-3 text-amber-700 shadow-[8px_0_12px_#fffbeb] md:px-5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <div className="digitale-service-marquee-track flex w-max min-w-full items-center whitespace-nowrap pl-9 text-xs font-medium md:text-sm">
            <span className="px-10">
              AVISO IMPORTANTE — A Microsoft informou instabilidade no Exchange Online (Outlook / Microsoft 365). Mensagens destinadas a esses serviços podem apresentar atrasos no envio ou na entrega. Acompanhe os relatórios de disparo.
            </span>
            <span className="px-10" aria-hidden="true">
              AVISO IMPORTANTE — A Microsoft informou instabilidade no Exchange Online (Outlook / Microsoft 365). Mensagens destinadas a esses serviços podem apresentar atrasos no envio ou na entrega. Acompanhe os relatórios de disparo.
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12 transition-all duration-500 animate-in fade-in slide-in-from-top-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>

  );
}
