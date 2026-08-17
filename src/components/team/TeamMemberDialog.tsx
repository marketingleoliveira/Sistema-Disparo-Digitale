import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE_DESCRIPTIONS,
  TEAM_ROLES,
  TEAM_STATUSES,
  permissionsForRole,
  type TeamRole,
  type TeamStatus,
} from "@/lib/team/permissions";
import type { TeamMember } from "@/hooks/use-team";

export interface TeamMemberFormValues {
  full_name: string;
  email: string;
  role: TeamRole;
  department: string;
  status: TeamStatus;
  notes: string;
}

export interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  isSaving?: boolean;
  onSubmit: (values: TeamMemberFormValues) => void;
}

const EMPTY: TeamMemberFormValues = {
  full_name: "",
  email: "",
  role: "Marketing",
  department: "",
  status: "Ativo",
  notes: "",
};

export function TeamMemberDialog({
  open,
  onOpenChange,
  member,
  isSaving = false,
  onSubmit,
}: TeamMemberDialogProps) {
  const [values, setValues] = React.useState<TeamMemberFormValues>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(
      member
        ? {
            full_name: member.full_name,
            email: member.email,
            role: member.role as TeamRole,
            department: member.department ?? "",
            status: (member.status as TeamStatus) ?? "Ativo",
            notes: member.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, member]);

  const set = <K extends keyof TeamMemberFormValues>(key: K, value: TeamMemberFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = values.full_name.trim();
    const email = values.email.trim().toLowerCase();
    if (name.length < 2) {
      setError("Informe o nome completo do membro.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail corporativo válido.");
      return;
    }
    setError(null);
    onSubmit({ ...values, full_name: name, email });
  };

  const rolePermissions = permissionsForRole(values.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Editar membro" : "Adicionar membro"}</DialogTitle>
          <DialogDescription>
            Defina o cargo do membro — os direitos de acesso são aplicados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="team-name">Nome completo</Label>
              <Input
                id="team-name"
                value={values.full_name}
                onChange={(event) => set("full_name", event.target.value)}
                placeholder="Leonardo Oliveira"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="team-email">E-mail corporativo</Label>
              <Input
                id="team-email"
                type="email"
                value={values.email}
                onChange={(event) => set("email", event.target.value)}
                placeholder="nome@digitaletextil.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={values.role} onValueChange={(value) => set("role", value as TeamRole)}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={values.status} onValueChange={(value) => set("status", value as TeamStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="team-department">Departamento</Label>
              <Input
                id="team-department"
                value={values.department}
                onChange={(event) => set("department", event.target.value)}
                placeholder="Marketing, Comercial, TI..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="team-notes">Observações</Label>
              <Textarea
                id="team-notes"
                rows={2}
                value={values.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Notas internas sobre o acesso deste membro"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-semibold text-foreground">Direitos do cargo {values.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[values.role]}</p>
            <ul className="mt-2 space-y-1">
              {rolePermissions.map((permission) => (
                <li key={permission.key} className="text-xs text-muted-foreground">
                  • {permission.label}
                </li>
              ))}
            </ul>
          </div>

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : member ? "Salvar alterações" : "Adicionar membro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
