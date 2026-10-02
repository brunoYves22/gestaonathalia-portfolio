
ALTER TABLE public.itens_venda
  ADD COLUMN IF NOT EXISTS custo_na_venda numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_medio_na_venda numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lucro_na_venda numeric NOT NULL DEFAULT 0;

-- Backfill: usa preco_custo atual do produto como melhor aproximação para vendas antigas
UPDATE public.itens_venda iv
SET
  custo_na_venda = COALESCE(p.ultimo_custo, p.preco_custo, 0),
  preco_medio_na_venda = COALESCE(p.preco_custo, 0),
  lucro_na_venda = (iv.preco_unitario - COALESCE(p.preco_custo, 0)) * iv.quantidade
FROM public.produtos p
WHERE iv.produto_id = p.id
  AND iv.preco_medio_na_venda = 0
  AND iv.custo_na_venda = 0;
