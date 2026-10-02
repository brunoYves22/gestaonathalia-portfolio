CREATE TABLE IF NOT EXISTS public.tipos_produto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem tipos"
ON public.tipos_produto FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados inserem tipos"
ON public.tipos_produto FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados excluem tipos"
ON public.tipos_produto FOR DELETE TO authenticated USING (true);

INSERT INTO public.tipos_produto (nome) VALUES
  ('Acessorios'), ('Celular'), ('IPAD'), ('JBL'), ('MACBOOK'), ('TV SAMSUNG'), ('APPLE WATCH')
ON CONFLICT (nome) DO NOTHING;