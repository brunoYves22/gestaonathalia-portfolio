CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados inserem clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados atualizam clientes" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados excluem clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

ALTER TABLE public.vendas ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;
CREATE INDEX idx_vendas_cliente_id ON public.vendas(cliente_id);