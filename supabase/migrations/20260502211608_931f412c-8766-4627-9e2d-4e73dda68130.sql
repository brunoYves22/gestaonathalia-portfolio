
DROP POLICY IF EXISTS "Usuarios veem suas vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuarios criam suas vendas" ON public.vendas;

CREATE POLICY "Autenticados veem todas as vendas"
ON public.vendas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados criam vendas"
ON public.vendas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados atualizam vendas"
ON public.vendas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados excluem vendas"
ON public.vendas FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios veem itens de suas vendas" ON public.itens_venda;
DROP POLICY IF EXISTS "Usuarios inserem itens de suas vendas" ON public.itens_venda;

CREATE POLICY "Autenticados veem itens de venda"
ON public.itens_venda FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados inserem itens de venda"
ON public.itens_venda FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados atualizam itens de venda"
ON public.itens_venda FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados excluem itens de venda"
ON public.itens_venda FOR DELETE TO authenticated USING (true);
