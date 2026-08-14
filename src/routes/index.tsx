import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore, UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ShieldCheck, Loader2 } from "lucide-react";
import logoAsset from "@/assets/Digitale_ALTATECNOLOGIA.png.asset.json";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("Marketing");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await login(email, role);
      navigate({ to: "/dashboard" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e2d4d] relative overflow-hidden p-4">
      <div className="absolute inset-0 opacity-[0.05] pattern-grid pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <img 
            src={logoAsset.url} 
            alt="Digitale Têxtil" 
            className="h-16 w-auto mx-auto brightness-0 invert"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Newsletter Interna</h1>
            <p className="text-white/60 text-sm">Acesse o sistema com suas credenciais</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">E-mail Corporativo</ className="text-white/80">
              <Input 
                id="email" 
                type="email" 
                placeholder="exemplo@digitaletextil.com.br"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:ring-accent focus:border-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white/80">Seu Cargo</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                  <SelectValue placeholder="Selecione seu cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desenvolvedor">Admin Master (Dev)</SelectItem>
                  <SelectItem value="Diretoria">Diretoria</SelectItem>
                  <SelectItem value="Gerência">Gerência</SelectItem>
                  <SelectItem value="Marketing">Marketing (Analista)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-5 w-5" />
              )}
              Entrar no Sistema
            </Button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs">
          © 2026 Digitale Têxtil • Acesso restrito
        </p>
      </div>
    </div>
  );
}
