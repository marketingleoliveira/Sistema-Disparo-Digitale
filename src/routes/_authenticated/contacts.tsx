import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Tag as TagIcon, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Trash2,
  UserPlus,
  UserMinus,
  Star,
  History,
  Send,
  MousePointer2,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useDataStore } from "@/hooks/use-data";
import { downloadContactsCsv } from "@/lib/contacts/export-csv";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: ContactsPage,
});

// --- State ---


// --- Sub-components ---

function EngagementScore({ score }: { score: number }) {
  let color = "bg-red-500";
  if (score >= 80) color = "bg-emerald-500";
  else if (score >= 40) color = "bg-orange-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground">{score}%</span>
    </div>
  );
}

function ContactDetailSheet({ contact, open, onOpenChange }: { contact: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4 text-left">
            <Avatar className="h-16 w-16 text-xl">
              <AvatarFallback className="bg-primary text-primary-foreground">{contact.initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl">{contact.name}</SheetTitle>
              <SheetDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail size={12} /> {contact.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</p>
              <p className="text-sm font-medium flex items-center gap-1.5"><Phone size={14} className="text-muted-foreground" /> {contact.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Empresa</p>
              <p className="text-sm font-medium flex items-center gap-1.5"><Building2 size={14} className="text-muted-foreground" /> {contact.company}</p>
            </div>
          </div>

          <Separator />

          {/* Tags & Lists */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-secondary/50 text-primary border-none text-[10px]">
                    {tag}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground"><Plus size={10} className="mr-1"/> Adicionar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Listas</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.lists.map((list: string) => (
                  <Badge key={list} variant="outline" className="text-primary text-[10px]">
                    {list}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Aberturas</p>
              <p className="text-xl font-bold text-primary mt-1">84%</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Cliques</p>
              <p className="text-xl font-bold text-primary mt-1">12%</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2"><History size={16} /> Atividade recente</h4>
            <div className="space-y-6 pl-4 border-l-2 border-muted/50 ml-2">
              {[
                { icon: Send, title: "Abriu campanha: Coleção Verão", time: "Hoje, 10:45", color: "text-emerald-500" },
                { icon: MousePointer2, title: "Clicou no link: Categoria Algodão", time: "Ontem, 16:20", color: "text-primary" },
                { icon: Send, title: "Recebeu campanha: Newsletter #42", time: "12 Ago, 09:00", color: "text-muted-foreground" },
                { icon: UserPlus, title: "Entrou na lista: Clientes VIP", time: "10 Ago, 14:15", color: "text-accent" },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                    <item.icon size={8} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddContactSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { addContact } = useDataStore();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    status: "Ativo" as const,
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addContact({
        ...formData,
        lists: ["Contatos Diretos"],
        tags: ["Manual"],
      });
      toast.success("Contato salvo com sucesso!");
      setFormData({ name: "", email: "", company: "", phone: "", status: "Ativo" });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save contact:", error);
      const errorMessage = error?.message || error?.details || "Tente novamente mais tarde.";
      toast.error("Erro ao salvar contato", { 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Adicionar Novo Contato</SheetTitle>
          <SheetDescription>
            Preencha as informações básicas do contato para sua base de marketing.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                placeholder="Ex: João Silva" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="joao@exemplo.com" 
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input 
                id="company" 
                placeholder="Nome da empresa" 
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                placeholder="+55 (11) 99999-9999" 
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Salvar Contato
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ContactsPage() {
  const { contacts, deleteContact, fetchContacts, isLoading } = useDataStore();
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [detailContact, setDetailContact] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  React.useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Busca aplicada sobre nome, e-mail e empresa
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) =>
      [c.name, c.email, c.company].some((v) => (v ?? "").toLowerCase().includes(term)),
    );
  }, [contacts, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageContacts = React.useMemo(
    () => filtered.slice(startIndex, startIndex + pageSize),
    [filtered, startIndex, pageSize],
  );

  // Volta para a primeira página quando a busca ou o tamanho da página muda
  React.useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const pageIds = pageContacts.map((c) => c.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedContacts.includes(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedContacts((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedContacts((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const pageNumbers = React.useMemo<Array<number | "...">>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: Array<number | "..."> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) items.push("...");
    for (let p = start; p <= end; p++) items.push(p);
    if (end < totalPages - 1) items.push("...");
    items.push(totalPages);
    return items;
  }, [totalPages, currentPage]);

  const toggleSelect = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const [isAdding, setIsAdding] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  const exportContacts = (ids?: string[]) => {
    const rows = ids && ids.length > 0 ? contacts.filter((c) => ids.includes(c.id)) : contacts;
    if (rows.length === 0) return;
    downloadContactsCsv(rows);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AddContactSheet open={isAdding} onOpenChange={setIsAdding} />
      <ImportContactsDialog open={isImporting} onOpenChange={setIsImporting} />
      <ContactDetailSheet 
        contact={detailContact} 
        open={!!detailContact} 
        onOpenChange={(open) => !open && setDetailContact(null)} 
      />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Contatos</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Gestão inteligente de audiência para a Digitale Têxtil.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => exportContacts()}
            disabled={contacts.length === 0}
            className="text-xs font-bold border-border/60 hover:bg-secondary hidden sm:flex px-4"
          >
            <Download size={14} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImporting(true)}
            className="text-xs font-bold border-border/60 hover:bg-secondary hidden sm:flex px-4"
          >
            <Upload size={14} className="mr-2" />
            Importar
          </Button>
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6"
          >
            <Plus size={18} className="mr-2" />
            Adicionar Contato
          </Button>
        </div>
      </div>


      {/* Toolbar & Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Pesquisar contatos..." 
            className="pl-9 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {['Lista', 'Tags', 'Status', 'Engajamento'].map((filter) => (
            <DropdownMenu key={filter}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-medium border-dashed">
                  {filter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filtrar por {filter}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Todos</DropdownMenuItem>
                <DropdownMenuItem>Opção 1</DropdownMenuItem>
                <DropdownMenuItem>Opção 2</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <Button variant="secondary" size="sm" className="h-9 px-3 text-xs font-bold text-primary ml-auto md:ml-0">
            <Filter size={14} className="mr-2" />
            Filtros avançados
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContacts.length > 0 && (
        <div className="sticky top-2 z-20 flex items-center justify-between rounded-lg bg-primary px-6 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selectedContacts.length} selecionados</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-white hover:bg-white/10">
                <TagIcon size={14} className="mr-1.5" /> Tag
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-white hover:bg-white/10">
                <Plus size={14} className="mr-1.5" /> Lista
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => exportContacts(selectedContacts)}
                className="h-8 px-2 text-xs font-bold text-white hover:bg-white/10"
              >
                <Download size={14} className="mr-1.5" /> Exportar
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 text-xs font-bold text-red-300 hover:bg-red-500/20"
              onClick={() => {
                selectedContacts.forEach(id => deleteContact(id));
                setSelectedContacts([]);
              }}
            >
              <Trash2 size={14} className="mr-1.5" /> Excluir
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedContacts([])} className="h-8 w-8 p-0 text-white/70 hover:text-white">
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[50px] pl-6">
                <Checkbox 
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 py-4">Nome</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Empresa</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Listas</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Tags</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Engajamento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Status</TableHead>
              <TableHead className="w-[50px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                  {isLoading ? "Carregando contatos..." : "Nenhum contato encontrado."}
                </TableCell>
              </TableRow>
            )}
            {pageContacts.map((contact) => (
              <TableRow 
                key={contact.id} 
                className={cn(
                  "group transition-colors cursor-pointer",
                  selectedContacts.includes(contact.id) && "bg-muted/50"
                )}
                onClick={() => setDetailContact(contact)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => toggleSelect(contact.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 text-[10px]">
                      <AvatarFallback className="bg-secondary text-primary font-bold">{contact.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{contact.name}</span>
                      <span className="text-[10px] text-muted-foreground">{contact.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-muted-foreground">{contact.company}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[120px]">
                    {contact.lists?.map((list: string) => (
                      <span key={list} className="text-[10px] text-muted-foreground border rounded px-1">{list}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-secondary/50 text-primary border-none text-[9px] px-1.5 py-0 font-bold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <EngagementScore score={contact.engagement} />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "rounded-full px-2 py-0 text-[10px] font-bold",
                      contact.status === 'Ativo' && "border-emerald-200 text-emerald-700 bg-emerald-50",
                      contact.status === 'Pendente' && "border-orange-200 text-orange-700 bg-orange-50",
                      contact.status === 'Descadastrado' && "border-red-200 text-red-700 bg-red-50",
                    )}
                  >
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Adicionar à lista</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteContact(contact.id)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/10">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando{" "}
              <span className="text-primary font-bold">
                {total === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, total)}
              </span>{" "}
              de <span className="text-primary font-bold">{total.toLocaleString("pt-BR")}</span> contatos
            </p>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-xs font-medium"
              aria-label="Contatos por página"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} por página
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center gap-1">
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-8 w-8 text-xs font-bold",
                      p === currentPage ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {p}
                  </Button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      <ContactDetailSheet 
        contact={detailContact} 
        open={!!detailContact} 
        onOpenChange={(open) => !open && setDetailContact(null)} 
      />
    </div>
  );
}
