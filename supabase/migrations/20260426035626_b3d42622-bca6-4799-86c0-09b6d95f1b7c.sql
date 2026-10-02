CREATE TABLE IF NOT EXISTS public.cores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.cores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem cores" ON public.cores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados inserem cores" ON public.cores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados excluem cores" ON public.cores FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem modelos" ON public.modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados inserem modelos" ON public.modelos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados excluem modelos" ON public.modelos FOR DELETE TO authenticated USING (true);