import * as React from "react";
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { AppSidebar } from "../components/layout/AppSidebar";
import { useAuthStore } from "@/hooks/use-auth";
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
  beforeLoad: async () => {
    // Apenas no cliente para evitar erros de SSR com localStorage
    if (typeof window === "undefined") return;

    // Nota: Em um fluxo real do Supabase, usaríamos supabase.auth.getSession()
    // Como a migração está em progresso e mantemos persistência local para cargos,
    // verificamos se há um usuário autenticado no store ou localStorage.
    
    let isAuthenticated = false;
    try {
      const authData = window.localStorage.getItem("digitale-auth-storage");
      if (authData) {
        const parsed = JSON.parse(authData);
        isAuthenticated = Boolean(parsed?.state?.isAuthenticated);
      }
    } catch {
      isAuthenticated = false;
    }

    if (!isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  
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
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const currentTitle = (lastPart && pathMap[lastPart]) || "Visão Geral";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-accent flex">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] bg-slate-50">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b bg-background/80 px-4 md:px-8 backdrop-blur-md shadow-sm">

          {/* Left Side: Breadcrumb & Context Title */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
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
            <h2 className="text-sm font-bold text-primary md:hidden">
              {currentTitle}
            </h2>
          </div>

          {/* Right Side: Actions & Profile */}
          <div className="flex items-center gap-1 md:gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-all active:scale-95 group">
                <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-all active:scale-95 relative group">
                <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="absolute top-2 right-2 flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
              </button>
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
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 transition-colors hover:bg-secondary">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Perfil da Agência</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 transition-colors hover:bg-secondary">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem className="text-destructive cursor-pointer rounded-lg mx-1 transition-colors hover:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-sm font-bold">Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="mx-auto max-w-[1600px] p-6 md:p-10 lg:p-12 transition-all duration-500 animate-in fade-in slide-in-from-top-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>

  );
}
