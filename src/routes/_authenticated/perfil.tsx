import { changeDisparoPassword } from "@/lib/disparo-password.functions";
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera, LockKeyhole, ShieldCheck, Eye, EyeOff, Sun, Moon
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {

  // DIGITALE_WHITE_DARK_V1
  const [digitaleDark, setDigitaleDark] = React.useState(false);

  React.useEffect(() => {
    try {
      setDigitaleDark(
        window.localStorage.getItem(
          "digitale-disparo-appearance-v1"
        ) === "dark"
      );
    } catch {
      setDigitaleDark(false);
    }
  }, []);

  const toggleDigitaleAppearance = () => {
    const next = !digitaleDark;

    try {
      window.localStorage.setItem(
        "digitale-disparo-appearance-v1",
        next ? "dark" : "light"
      );
    } catch {
      // A troca funciona mesmo se o navegador bloquear storage.
    }

    document.documentElement.classList.toggle(
      "digitale-dark",
      next
    );

    setDigitaleDark(next);

    window.dispatchEvent(
      new Event("digitale-appearance-change")
    );
  };

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const fileRef = React.useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = React.useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [valid, setValid] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  const roleLabel = user?.role === "Desenvolvedor"
    ? "Admin Master"
    : user?.role || "Usuário";

  const initials = user?.initials || "US";

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    setValid(false);
    setShowPasswords(false);
  }

  function changePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("A foto deve ter no máximo 5 MB.");
      return;
    }

    setMessage("");
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function validatePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setValid(false);
    setMessage("");

    if (!currentPassword) {
      setMessage("Informe sua senha atual.");
      return;
    }

    if (newPassword.length < 12 || newPassword.length > 256) {
      setMessage("A nova senha deve ter entre 12 e 256 caracteres.");
      return;
    }

    if (newPassword === currentPassword) {
      setMessage("A nova senha deve ser diferente da atual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("As duas novas senhas nao coincidem.");
      return;
    }

    setSavingPassword(true);

    try {
      await changeDisparoPassword({
        data: {
          currentPassword,
          newPassword,
          confirmation: confirmPassword
        }
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar a senha."
      );
      setSavingPassword(false);
      return;
    }

    setSavingPassword(false);
    resetPasswordForm();
    setPasswordOpen(false);

    try {
      await logout();
    } catch {
      // A sessao ja foi invalidada no servidor.
    }

    window.location.replace("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Meu Perfil
          </h1>

          {/* DIGITALE_WHITE_DARK_V1 */}
          <div className="flex shrink-0 items-center gap-2">
            <Sun
              size={15}
              aria-hidden="true"
              className={digitaleDark
                ? "text-muted-foreground"
                : "text-accent"}
            />

            <button
              type="button"
              role="switch"
              aria-checked={digitaleDark}
              aria-label={digitaleDark
                ? "Ativar modo claro"
                : "Ativar modo escuro"}
              title={digitaleDark
                ? "Modo escuro"
                : "Modo claro"}
              onClick={toggleDigitaleAppearance}
              className={
                "relative h-[28px] w-[50px] rounded-full " +
                "border border-border transition-colors " +
                "focus-visible:outline-none focus-visible:ring-2 " +
                "focus-visible:ring-accent " +
                (digitaleDark
                  ? "bg-[#294764]"
                  : "bg-[#cbd5e1]")
              }
            >
              <span
                className={
                  "absolute top-[3px] left-[3px] flex h-5 w-5 " +
                  "items-center justify-center rounded-full " +
                  "bg-white text-[#d77b39] shadow-sm " +
                  "transition-transform duration-200 " +
                  (digitaleDark ? "translate-x-[21px]" : "")
                }
              >
                {digitaleDark
                  ? <Moon size={12} aria-hidden="true" />
                  : <Sun size={12} aria-hidden="true" />}
              </span>
            </button>

            <Moon
              size={15}
              aria-hidden="true"
              className={digitaleDark
                ? "text-accent"
                : "text-muted-foreground"}
            />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais e a segurança da conta.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold">
          Informações do usuário
        </h2>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={changePhoto}
            aria-label="Selecionar foto de perfil"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 rounded-full
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary"
            aria-label="Trocar foto de perfil"
          >
            <div className="flex h-24 w-24 items-center justify-center
                            overflow-hidden rounded-full border-4
                            border-primary/10 bg-primary text-xl
                            font-bold text-white">
              {photo ? (
                <img
                  src={photo}
                  alt="Prévia da foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <span className="absolute bottom-0 right-0 flex h-8 w-8
                             items-center justify-center rounded-full
                             border-2 border-white bg-accent
                             text-accent-foreground shadow-md
                             transition-transform group-hover:scale-110">
              <Camera size={15} />
            </span>
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-bold">
              {user?.name || "Usuário"}
            </h3>
            <p className="break-all text-sm text-muted-foreground">
              {user?.email || "E-mail indisponível"}
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck size={15} />
              {roleLabel}
            </div>
            <p className="text-xs text-muted-foreground">
              Clique na foto para escolher outra imagem.
            </p>
          </div>
        </div>

        {photo && (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs
                        text-muted-foreground">
            Foto selecionada. Esta é apenas uma pré-visualização;
            a imagem ainda não será salva no servidor.
          </p>
        )}

        {message && !passwordOpen && (
          <p className="mt-3 text-xs text-destructive">{message}</p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row
                        sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <LockKeyhole size={21} />
            </div>

            <div>
              <h2 className="font-bold">Alterar senha</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Atualize sua senha de acesso ao sistema.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              resetPasswordForm();
              setPasswordOpen(true);
            }}
          >
            Alterar senha
          </Button>
        </div>
      </section>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (!open) resetPasswordForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Informe sua senha atual e digite a nova senha duas vezes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={validatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <Input
                id="senha-atual"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha-nova">Nova senha</Label>
              <Input
                id="senha-nova"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 12 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha-confirmacao">
                Confirmar nova senha
              </Label>
              <Input
                id="senha-confirmacao"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a nova senha"
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-2 text-xs
                         text-muted-foreground hover:text-primary"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords
                ? <EyeOff size={15} />
                : <Eye size={15} />}
              {showPasswords ? "Ocultar senhas" : "Mostrar senhas"}
            </button>

            {message && (
              <p
                role="status"
                className={
                  "rounded-lg p-3 text-xs " +
                  (valid
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700")
                }
              >
                {message}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Sua senha atual sera verificada no servidor.
              Apos a alteracao, sera necessario entrar novamente.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
