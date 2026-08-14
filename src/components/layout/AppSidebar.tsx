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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-transform lg:translate-x-0">
      <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-primary">
              Digitale Têxtil
            </h1>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Marketing Platform
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
                <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-[.active]:opacity-100" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
