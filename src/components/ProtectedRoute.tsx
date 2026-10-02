import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthorization = async (s: Session | null) => {
    if (!s?.user.email) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("email_autorizado", {
      _email: s.user.email,
    });
    setAuthorized(!error && !!data);
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      checkAuthorization(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkAuthorization(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session || !authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
