-- PRODUTOS
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler produtos"
  ON public.produtos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir produtos"
  ON public.produtos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar produtos"
  ON public.produtos FOR UPDATE
  TO authenticated USING (true);

-- VENDAS
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem suas vendas"
  ON public.vendas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuarios criam suas vendas"
  ON public.vendas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ITENS_VENDA
CREATE TABLE public.itens_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem itens de suas vendas"
  ON public.itens_venda FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.user_id = auth.uid())
  );

CREATE POLICY "Usuarios inserem itens de suas vendas"
  ON public.itens_venda FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.user_id = auth.uid())
  );

-- Trigger: diminui estoque e valida
CREATE OR REPLACE FUNCTION public.atualizar_estoque_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  estoque_atual INTEGER;
BEGIN
  SELECT estoque INTO estoque_atual FROM public.produtos WHERE id = NEW.produto_id FOR UPDATE;
  IF estoque_atual IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  IF estoque_atual < NEW.quantidade THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto %', NEW.produto_id;
  END IF;
  UPDATE public.produtos SET estoque = estoque - NEW.quantidade WHERE id = NEW.produto_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_atualizar_estoque
AFTER INSERT ON public.itens_venda
FOR EACH ROW EXECUTE FUNCTION public.atualizar_estoque_venda();

-- Produtos exemplo
INSERT INTO public.produtos (nome, codigo, preco, estoque) VALUES
  ('Coca-Cola 350ml', '7891', 5.50, 100),
  ('Pão Francês', '0001', 0.75, 200),
  ('Leite Integral 1L', '7892', 6.90, 50),
  ('Arroz 5kg', '7893', 28.90, 30),
  ('Feijão 1kg', '7894', 9.50, 40),
  ('Açúcar 1kg', '7895', 5.20, 60),
  ('Café 500g', '7896', 18.00, 25),
  ('Sabonete', '7897', 2.50, 80);