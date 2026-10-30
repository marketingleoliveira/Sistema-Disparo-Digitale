import { createDisparoUser, listDisparoUsers, updateDisparoUser, deleteDisparoUser } from "@/lib/disparo-users.functions";
import { toast } from "sonner";
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck, Users, LockKeyhole, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

type Role = "Desenvolvedor" | "Diretoria" | "Gerência" | "SDK";

const roles: { id: Role; name: string; description: string }[] = [
  {
    id: "Desenvolvedor",
    name: "Admin Master",
    description: "Controle total do sistema e dos usuários."
  },
  {
    id: "Diretoria",
    name: "Diretoria",
    description: "Operação completa, exceto configurações e usuários."
  },
  {
    id: "Gerência",
    name: "Gerência",
    description: "Mesmos acessos da Diretoria."
  },
  {
    id: "SDK",
    name: "SDK",
    description: "Somente criação e edição de templates de e-mail."
  },
];

const permissions = [
  { name: "Dashboard", roles: ["Desenvolvedor", "Diretoria", "Gerência"] },
  { name: "Campanhas e disparos", roles: ["Desenvolvedor", "Diretoria", "Gerência"] },
  { name: "Contatos e listas", roles: ["Desenvolvedor", "Diretoria", "Gerência"] },
  { name: "Templates de e-mail", roles: ["Desenvolvedor", "Diretoria", "Gerência", "SDK"] },
  { name: "Automações e relatórios", roles: ["Desenvolvedor", "Diretoria", "Gerência"] },
  { name: "Configurações", roles: ["Desenvolvedor"] },
  { name: "Criar e gerenciar usuários", roles: ["Desenvolvedor"] },
];

function UsuariosPage() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("SDK");

  const [saving, setSaving] = React.useState(false);
  const [members, setMembers] = React.useState<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
  }>>([]);
  const [editing, setEditing] = React.useState<(typeof members)[number] | null>(null);
  const [removing, setRemoving] = React.useState<(typeof members)[number] | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState<Role>("SDK");
  const [editActive, setEditActive] = React.useState(true);

  const refreshMembers = React.useCallback(async () => {
    const users = await listDisparoUsers();
    setMembers(users);
  }, []);

  React.useEffect(() => {
    if (user?.role === "Desenvolvedor") {
      void refreshMembers().catch(() => {
        toast.error("Nao foi possivel carregar os usuarios.");
      });
    }
  }, [user?.role, refreshMembers]);

  const handleSave = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe o e-mail de login.");
      return;
    }

    if (password.length < 12) {
      toast.error("Informe uma senha com no minimo 12 caracteres.");
      return;
    }

    setSaving(true);

    try {
      await createDisparoUser({
        data: { email: email.trim(), password, role }
      });

      setEmail("");
      setPassword("");
      setRole("SDK");
      setOpen(false);

      await refreshMembers();
      toast.success("Usuario criado no MariaDB com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar usuario."
      );
    } finally {
      setSaving(false);
    }
  };


  const openEdit = (member: (typeof members)[number]) => {
    setEditing(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role as Role);
    setEditActive(member.active);
  };

  const handleUpdate = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateDisparoUser({ data: {
        id: editing.id, name: editName, email: editEmail,
        role: editRole, active: editActive,
      }});
      await refreshMembers();
      setEditing(null);
      toast.success("Usuario atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removing || saving) return;
    setSaving(true);
    try {
      await deleteDisparoUser({ data: { id: removing.id } });
      await refreshMembers();
      setRemoving(null);
      toast.success("Usuario excluido definitivamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "Desenvolvedor") {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <LockKeyhole className="mx-auto mb-3 h-8 w-8" />
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Área exclusiva do Admin Master.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Usuários e Permissões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o acesso da equipe ao Sistema de Disparo Digitale.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}
          className="gap-2 bg-accent text-accent-foreground">
          <Plus size={16} /> Criar usuário
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((item, index) => (
          <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Nível {index + 1}</Badge>
            </div>
            <h2 className="mt-4 text-base font-bold">{item.name}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b p-5">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Administrador principal</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge>Admin Master</Badge>
        </div>
        <div className="border-t p-5">
          <p className="mb-3 text-sm font-bold">
            Usuários cadastrados ({members.length})
          </p>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id}
                className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role === "Desenvolvedor"
                      ? "Admin Master" : member.role}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">
                    {member.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button size="sm" variant="outline" className="gap-1"
                    disabled={saving || member.id === user.id}
                    onClick={() => openEdit(member)} title="Editar usuario">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-destructive"
                    disabled={saving || member.id === user.id}
                    onClick={() => setRemoving(member)} title="Excluir usuario">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-bold">Matriz de permissões</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Direitos previstos para cada nível de acesso.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-4 text-left">Funcionalidade</th>
                {roles.map((r) => (
                  <th key={r.id} className="p-4 text-center">{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.name} className="border-t">
                  <td className="p-4 font-medium">{p.name}</td>
                  {roles.map((r) => (
                    <td key={r.id} className="p-4 text-center">
                      {p.roles.includes(r.id) ? (
                        <span className="font-bold text-emerald-600">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(value) => { if (!value && !saving) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Altere os dados e o acesso da conta. A senha atual sera preservada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2"><Label>E-mail de login</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2"><Label>Cargo</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                {editRole === ("Marketing" as Role) && <option value="Marketing">Marketing (legado)</option>}
              </select>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={editActive ? "1" : "0"} onChange={(e) => setEditActive(e.target.value === "1")}>
                <option value="1">Ativo</option><option value="0">Inativo</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancelar</Button>
            <Button disabled={saving} onClick={() => void handleUpdate()}>{saving ? "Salvando..." : "Salvar alteracoes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(value) => { if (!value && !saving) setRemoving(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir usuario definitivamente?</DialogTitle>
            <DialogDescription>
              Esta acao remove a conta de {removing?.email} e encerra suas sessoes.
              Nao e possivel desfazer pela interface.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setRemoving(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={saving} onClick={() => void handleRemove()}>
              {saving ? "Excluindo..." : "Confirmar exclusao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (!value) setPassword("");
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar novo usuário</DialogTitle>
            <DialogDescription>
              Defina o acesso inicial do colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">E-mail de login</Label>
              <Input
                id="new-user-email"
                type="email"
                autoComplete="off"
                placeholder="colaborador@digitaletextil.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Senha provisória</Label>
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 12 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use uma senha individual e provisória, nunca a mesma para todos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Cargo do usuário</Label>
              <select
                id="new-user-role"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-bold">
                {roles.find((r) => r.id === role)?.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roles.find((r) => r.id === role)?.description}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar usuário"}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground">
            A senha sera armazenada como hash scrypt, nunca em texto puro.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
