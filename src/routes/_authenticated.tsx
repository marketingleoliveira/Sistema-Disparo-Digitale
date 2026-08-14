import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { AppSidebar } from "../components/layout/AppSidebar";
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
  const location = useLocation();
  
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
  const currentTitle = pathMap[pathParts[pathParts.length - 1]] || "Visão Geral";

  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-accent/20 selection:text-accent flex">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
          {/* Left Side: Breadcrumb & Context Title */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard" className="text-xs">Início</BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathParts.map((part, index) => {
                    const isLast = index === pathParts.length - 1;
                    const title = pathMap[part] || part;
                    return (
                      <React.Fragment key={part}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="text-xs font-semibold">{title}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={`/${part}`} className="text-xs">{title}</BreadcrumbLink>
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
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-accent"></span>
            </button>
            <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
            
            <div className="mx-2 h-6 w-px bg-border"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-all hover:bg-secondary">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">DO</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="text-[12px] font-bold leading-none text-foreground">Digitale Oliveira</p>
                    <p className="text-[10px] text-muted-foreground">Admin</p>
                  </div>
                  <ChevronDown className="hidden h-3 w-3 text-muted-foreground lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-white">
          <div className="mx-auto max-w-[1400px] p-6 md:p-10 transition-all duration-500 animate-in fade-in slide-in-from-top-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
