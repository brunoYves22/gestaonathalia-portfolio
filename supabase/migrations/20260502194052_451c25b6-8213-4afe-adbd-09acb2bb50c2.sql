-- Tabela de emails autorizados a acessar o sistema
CREATE TABLE public.emails_permitidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emails_permitidos ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar se um email está autorizado
-- (sem exigir login — usada na tela de cadastro/login)
CREATE OR REPLACE FUNCTION public.email_autorizado(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.emails_permitidos
    WHERE lower(email) = lower(_email)
  );
$$;

-- Apenas usuários autenticados (admin do sistema) podem gerenciar a lista
CREATE POLICY "Autenticados leem emails permitidos"
ON public.emails_permitidos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados inserem emails permitidos"
ON public.emails_permitidos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados excluem emails permitidos"
ON public.emails_permitidos FOR DELETE TO authenticated USING (true);

-- Para executar a demonstração, um administrador deve cadastrar o próprio
-- email em emails_permitidos usando o SQL Editor do seu projeto Supabase.
