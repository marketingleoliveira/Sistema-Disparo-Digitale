import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
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
  HelpCircle,
  User,
  ChevronRight,
  ChevronDown,
  Tag,
  TrendingUp,
  Globe,
  Menu,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAsset from "@/assets/Digitale_ALTATECNOLOGIA.png.asset.json";
import { useAuthStore } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  items?: { label: string; icon: React.ElementType; href: string }[];
}

const sidebarStructure: { group: string; items: NavItem[] }[] = [
  {
    group: "Principal",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    group: "Marketing",
    items: [
      {
        label: "Campanhas",
        icon: Mail,
        items: [
          { label: "Todas as campanhas", icon: Mail, href: "/campaigns" },
          { label: "SMS", icon: Smartphone, href: "/campaigns/sms" as any },
          { label: "WhatsApp", icon: Zap, href: "/campaigns/whatsapp" as any },
        ],
      },
      { label: "Templates", icon: FileText, href: "/templates" },
      { label: "Automações", icon: Zap, href: "/automations" },
      { label: "Formulários", icon: FormInput, href: "/forms" },
    ],
  },
  {
    group: "Contatos",
    items: [
      {
        label: "Contatos",
        icon: Users,
        items: [
          { label: "Todos os contatos", icon: Users, href: "/contacts" },
          { label: "Listas", icon: List, href: "/lists" },
          { label: "Segmentos", icon: Target, href: "/segments" },
          { label: "Tags", icon: Tag, href: "/tags" as any },
        ],
      },
    ],
  },
  {
    group: "Analytics",
    items: [
      {
        label: "Desempenho",
        icon: BarChart3,
        items: [
          { label: "Relatórios", icon: BarChart3, href: "/reports" },
          { label: "Métricas", icon: TrendingUp, href: "/analytics/metrics" as any },
        ],
      },
    ],
  },
  {
    group: "Configurações",
    items: [
      {
        label: "Ajustes",
        icon: Settings,
        items: [
          { label: "Geral", icon: Settings, href: "/settings" },
          { label: "Domínio", icon: Globe, href: "/settings/domain" as any },
          { label: "Equipe", icon: ShieldCheck, href: "/settings/team" as any },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const { user } = useAuthStore();

  const SidebarContent = () => {
    const isMarketing = user.role === 'Marketing';
    const isDev = user.role === 'Desenvolvedor';

    const filteredStructure = sidebarStructure.filter(group => {
      // Marketing só vê Principal (Dashboard) e Analytics
      if (isMarketing) {
        return group.group === "Principal" || group.group === "Analytics";
      }
      
      // Configurações só para Desenvolvedor
      if (group.group === "Configurações") {
        return isDev;
      }

      return true;
    });

    return (
      <div className="flex h-full flex-col bg-[#1e2d4d] relative overflow-hidden">
        {/* Pattern background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] pattern-grid" />
        
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-white/10 px-6 relative z-10 bg-[#1e2d4d]/80 backdrop-blur-sm">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img 
                src={logoAsset.url} 
                alt="Digitale Têxtil" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#163a3d] border border-[#1d4d50] text-[10px] font-bold text-[#20b88d] uppercase tracking-wider">
              <div className="h-1.5 w-1.5 rounded-sm bg-[#20b88d]" />
              #Sustentabilidade
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6 scrollbar-white">
          {filteredStructure.map((group, idx) => (
            <div key={group.group} className={cn("mb-8", idx === 0 && "mt-0")}>
              <h2 className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                {group.group}
              </h2>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem key={item.label} item={item} />
                ))}
              </nav>
            </div>
          ))}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 space-y-1">
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white cursor-pointer group"
          >
            <HelpCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Central de Ajuda</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/5 mt-2 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white font-bold shadow-inner border border-white/10">
              {user.initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs text-white font-bold">{user.name}</p>
              <p className="truncate text-[10px] text-white/50 font-medium">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="fixed left-4 top-4 z-50 rounded-md border bg-white p-2 shadow-sm lg:hidden">
            <Menu className="h-5 w-5 text-primary" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] border-r border-white/10 bg-[#1e2d4d] shadow-2xl transition-transform lg:block">
      <SidebarContent />
    </aside>
  );
}

function SidebarItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const isActive = item.href ? location.pathname === item.href : false;
  const hasSubItems = item.items && item.items.length > 0;
  const isChildActive = item.items?.some(child => location.pathname === child.href);

  React.useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            (isOpen || isChildActive) ? "text-white bg-white/15 shadow-sm" : "text-white/70",
            "hover:bg-white/10 hover:text-white active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn("h-4 w-4", (isOpen || isChildActive) && "text-white")} />
            <span>{item.label}</span>
          </div>
          <ChevronRight className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen && "rotate-90"
          )} />
        </button>
        {isOpen && (
          <div className="ml-4 space-y-1 border-l border-white/10 pl-4 py-1">
            {item.items!.map((sub) => (
              <Link
                key={sub.href}
                to={sub.href as any}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  location.pathname === sub.href
                    ? "text-white font-bold bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href as any}
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200",
        isActive 
          ? "bg-white text-primary shadow-xl scale-[1.02] translate-x-1" 
          : "text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}
