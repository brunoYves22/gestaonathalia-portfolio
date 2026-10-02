ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS ultimo_custo numeric NOT NULL DEFAULT 0;

UPDATE public.produtos SET ultimo_custo = preco_custo WHERE ultimo_custo = 0;