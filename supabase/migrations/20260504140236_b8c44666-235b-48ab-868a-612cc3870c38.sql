ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'loja';

ALTER TABLE public.produtos
DROP CONSTRAINT IF EXISTS produtos_status_check;

ALTER TABLE public.produtos
ADD CONSTRAINT produtos_status_check CHECK (status IN ('loja', 'transporte'));

UPDATE public.produtos SET status = 'loja' WHERE status IS NULL;