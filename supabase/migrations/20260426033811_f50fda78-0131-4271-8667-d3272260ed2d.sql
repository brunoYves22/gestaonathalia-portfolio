
-- Add new columns to produtos
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Acessório',
  ADD COLUMN IF NOT EXISTS preco_custo NUMERIC NOT NULL DEFAULT 0;

-- Unique constraint on codigo (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_codigo_unique_idx
  ON public.produtos (codigo) WHERE codigo IS NOT NULL;

-- Allow authenticated users to delete products
CREATE POLICY "Autenticados podem excluir produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (true);
