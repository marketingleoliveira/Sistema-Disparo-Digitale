import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Minus, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMemberDialog, type TeamMemberFormValues } from "@/components/team/TeamMemberDialog";
import { useTeamMembers, useTeamMutations, type TeamMember } from "@/hooks/use-team";
import {
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  TEAM_ROLES,
  type TeamRole,
} from "@/lib/team/permissions";

export const Route = createFileRoute("/_authenticated/settings_/team")({
  head: () => ({
    meta: [
      { title: "Equipe e Cargos | Newsletter Digitale Têxtil" },
      {
        name: "description",
        content:
          "Gerencie a equipe interna da Digitale Têxtil: membros, cargos e a matriz de direitos de acesso da plataforma de e-mail marketing.",
      },
      { property: "og:title", content: "Equipe e Cargos | Digitale Têxtil" },
      {
        property: "og:description",
        content: "Painel interno de membros, cargos e permissões da plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamSettingsPage,
});

const STATUS_VARIANT: Record<string, string> = {
  Ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Convidado: "bg-amber-100 text-amber-700 border-amber-200",
  Inativo: "bg-muted text-muted-foreground border-border",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function TeamSettingsPage() {
  const { data: members, isLoading } = useTeamMembers();
  const { create, update, remove } = useTeamMutations();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamMember | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<TeamMember | null>(null);

  const list = members ?? [];

  const countsByRole = React.useMemo(() => {
    const base: Record<TeamRole, number> = {
      Desenvolvedor: 0,
      Diretoria: 0,
      "Gerência": 0,
      Marketing: 0,
    };
    for (const member of list) base[member.role as TeamRole] += 1;
    return base;
  }, [list]);

  const handleSubmit = (values: TeamMemberFormValues) => {
    const payload = {
      full_name: values.full_name,
      email: values.email,
      role: values.role,
      department: values.department.trim() || null,
      status: values.status,
      notes: values.notes.trim() || null,
    };

    if (editing) {
      update.mutate(
        { id: editing.id, patch: payload },
        {
          onSuccess: () => {
            toast.success("Membro atualizado.");
            setDialogOpen(false);
            setEditing(null);
          },
          onError: (error: Error) => toast.error(error.message),
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Membro adicionado à equipe.");
        setDialogOpen(false);
      },
      onError: (error: Error) =>
        toast.error(
          error.message.includes("duplicate")
            ? "Já existe um membro com este e-mail."
            : error.message,
        ),
    });
  };

  const handleRoleChange = (member: TeamMember, role: TeamRole) => {
    update.mutate(
      { id: member.id, patch: { role } },
      {
        onSuccess: () => toast.success(`Cargo de ${member.full_name} alterado para ${role}.`),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const member = pendingDelete;
    remove.mutate(member.id, {
      onSuccess: () => toast.success(`${member.full_name} removido da equipe.`),
      onError: (error: Error) => toast.error(error.message),
    });
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe e Cargos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre os membros internos da Digitale Têxtil e defina os direitos de acesso por cargo.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar membro
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_ROLES.map((role) => (
          <div key={role} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{role}</span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{countsByRole[role]}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Membros da equipe</h2>
          <Badge variant="secondary" className="ml-auto">
            {list.length} {list.length === 1 ? "membro" : "membros"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando equipe...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum membro cadastrado. Adicione o primeiro integrante da equipe.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(member.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{member.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.department ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member, value as TeamRole)}
                      >
                        <SelectTrigger className="h-9 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_VARIANT[member.status] ?? STATUS_VARIANT["Inativo"]
                        }`}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${member.full_name}`}
                          onClick={() => {
                            setEditing(member);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${member.full_name}`}
                          onClick={() => setPendingDelete(member)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Matriz de direitos por cargo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Os direitos são definidos pelo cargo — alterar o cargo de um membro aplica as permissões
            abaixo imediatamente.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[260px]">Permissão</TableHead>
                {TEAM_ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((permission) => (
                <TableRow key={permission.key}>
                  <TableCell>
                    <p className="text-sm font-medium">{permission.label}</p>
                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                  </TableCell>
                  {TEAM_ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {permission.roles.includes(role) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Permitido" />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-muted-foreground/50"
                          aria-label="Sem acesso"
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        member={editing}
        isSaving={create.isPending || update.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.full_name} perderá o acesso registrado na plataforma. Esta ação não pode ser desfeita.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
