import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import logoAsset from "@/assets/digitale-logo-white.png.asset.json";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, initialize } = useAuthStore();

  React.useEffect(() => {
    void initialize();
  }, [initialize]);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch {
      setError("Nao foi possivel entrar. Verifique suas credenciais e utilize uma conexao segura.");
    } finally {
      setIsLoading(false);
    }
  };

  const logoUrl = logoAsset.url;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e2d4d] relative overflow-hidden p-4">
      <div className="absolute inset-0 opacity-[0.05] pattern-grid pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <img 
              src={logoUrl} 
              alt="Digitale Têxtil" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Portal de Marketing</h1>
            <p className="text-blue-200/60 text-sm font-medium">Plataforma Exclusiva Digitale Têxtil</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@digitaletextil.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 focus:ring-2 focus:ring-accent/20 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-200 focus:ring-2 focus:ring-accent/20 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
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

        <p className="text-center text-xs font-medium text-blue-200/40">
          Desenvolvido por Digitale Têxtil
        </p>
      </div>
    </div>
  );
}
