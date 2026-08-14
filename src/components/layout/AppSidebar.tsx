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
  CreditCard,
  Globe,
  Bell,
  Menu,
  ShieldCheck,
  Smartphone,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
          { label: "E-mail", icon: Mail, href: "/campaigns/email" },
          { label: "SMS", icon: Smartphone, href: "/campaigns/sms" },
          { label: "WhatsApp", icon: Zap, href: "/campaigns/whatsapp" },
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
      { label: "Todos os contatos", icon: Users, href: "/contacts" },
      { label: "Listas", icon: List, href: "/lists" },
      { label: "Segmentos", icon: Target, href: "/segments" },
      { label: "Tags", icon: Tag, href: "/tags" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "Relatórios", icon: BarChart3, href: "/reports" },
      { label: "Desempenho", icon: TrendingUp, href: "/analytics/performance" },
    ],
  },
  {
    group: "Configurações",
    items: [
      { label: "Conta", icon: User, href: "/settings/account" },
      { label: "E-mail", icon: Mail, href: "/settings/email" },
      { label: "Domínio", icon: Globe, href: "/settings/domain" },
      { label: "Usuários", icon: ShieldCheck, href: "/settings/users" },
    ],
  },
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-primary">
            Newsletter Digitale
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {sidebarStructure.map((group, idx) => (
          <div key={group.group} className={cn("mb-6", idx === 0 && "mt-2")}>
            <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {group.group}
            </h2>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </nav>
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3 space-y-0.5">
        <Link
          to="/help"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-primary"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Ajuda</span>
        </Link>
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-primary cursor-pointer">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] text-primary font-bold">
            DO
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs text-foreground font-semibold">Digitale Oliveira</p>
            <p className="truncate text-[10px] opacity-60">Plano Enterprise</p>
          </div>
        </div>
      </div>
    </div>
  );

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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] border-r bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-transform lg:block">
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

  // Auto-open if child is active
  React.useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-[14px] font-medium transition-all duration-200",
            (isOpen || isChildActive) ? "text-primary" : "text-muted-foreground",
            "hover:bg-secondary hover:text-primary"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {isOpen && (
          <div className="ml-7 space-y-1 border-l pl-2">
            {item.items!.map((sub) => (
              <Link
                key={sub.href}
                to={sub.href}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-[13px] font-medium transition-all",
                  location.pathname === sub.href
                    ? "text-primary bg-secondary/60"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/40"
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
      to={item.href}
      className={cn(
        "group flex items-center justify-between rounded-md px-3 py-2 text-[14px] font-medium transition-all duration-200",
        isActive 
          ? "bg-secondary text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-secondary hover:text-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}
