import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import EtherealBeamsHero from "@/components/ui/ethereal-beams-hero";

async function isEmailAuthorized(email: string) {
  const { data, error } = await supabase.rpc("email_autorizado", {
    _email: email.trim().toLowerCase(),
  });
  if (error) return false;
  return !!data;
}

const SignInForm = memo(function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allowed = await isEmailAuthorized(email);
    if (!allowed) {
      setLoading(false);
      toast.error("Este email não está autorizado a acessar o sistema");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Falha ao entrar");
      return;
    }
    toast.success("Bem-vinda!");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signin-email" className="text-foreground/80">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input pl-10 h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password" className="text-foreground/80">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input pl-10 h-11"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] hover:opacity-90 text-primary-foreground font-medium btn-glow"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
});

const SignUpForm = memo(function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);

    const allowed = await isEmailAuthorized(email);
    if (!allowed) {
      setLoading(false);
      toast.error("Este email não está na lista de emails autorizados");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else {
        toast.error(error.message || "Falha ao cadastrar");
      }
      return;
    }

    toast.success("Cadastro realizado! Verifique seu email para confirmar.");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-foreground/80">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input pl-10 h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-foreground/80">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input pl-10 h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm" className="text-foreground/80">Confirmar senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="glass-input pl-10 h-11"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] hover:opacity-90 text-primary-foreground font-medium btn-glow"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Você receberá um email de confirmação para ativar a conta.
      </p>
    </form>
  );
});

const AuthCard = memo(function AuthCard({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="w-full max-w-md glass rounded-2xl p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] btn-glow">
          <Lock className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Sistema de Gestão
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Controle de estoque e vendas
        </p>
      </div>

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin" className="gap-2">
            <LogIn className="w-4 h-4" /> Entrar
          </TabsTrigger>
          <TabsTrigger value="signup" className="gap-2">
            <UserPlus className="w-4 h-4" /> Cadastrar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm onSuccess={onSuccess} />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground mt-6">
        Acesso restrito a emails autorizados
      </p>
    </div>
  );
});

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Entrar | Sistema de Gestão";
    supabase.auth.getSession().then(async ({ data }) => {
      const email = data.session?.user.email;
      if (!email) return;
      const allowed = await isEmailAuthorized(email);
      if (allowed) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  return (
    <EtherealBeamsHero>
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <AuthCard onSuccess={() => navigate("/dashboard", { replace: true })} />
      </main>
    </EtherealBeamsHero>
  );
};

export default Login;
