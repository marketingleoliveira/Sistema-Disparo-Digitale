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
import logoAsset from "@/assets/digitale-logo-white.png.asset.json";

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
      
      <div className="w-full max-w-md space-y-8 relative z-10 text-center text-white">
        <h1 className="text-3xl font-bold">No menu contato, desenvolva os módulos de Listas e Segmentos</h1>
      </div>
    </div>
  );
}
