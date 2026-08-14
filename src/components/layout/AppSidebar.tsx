import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  List,
  Target,
  Mail,
  FileText,
  Zap,
  FormInput,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contatos", icon: Users, href: "/contacts" },
  { label: "Listas", icon: List, href: "/lists" },
  { label: "Segmentação", icon: Target, href: "/segments" },
  { label: "Campanhas", icon: Mail, href: "/campaigns" },
  { label: "Templates", icon: FileText, href: "/templates" },
  { label: "Automação", icon: Zap, href: "/automations" },
  { label: "Formulários", icon: FormInput, href: "/forms" },
  { label: "Relatórios", icon: BarChart3, href: "/reports" },
  { label: "Configurações", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card shadow-sm transition-transform lg:translate-x-0">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Digitale Têxtil
            </h1>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">
              Newsletter Platform
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-[14px] font-medium transition-all duration-200",
                "text-muted-foreground hover:bg-secondary hover:text-primary",
                "[&.active]:bg-secondary [&.active]:text-primary [&.active]:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 group-[.active]:opacity-100" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
