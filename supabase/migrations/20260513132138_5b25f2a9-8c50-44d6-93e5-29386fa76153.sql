
-- Helper: check if current authenticated user's email is in allowlist
CREATE OR REPLACE FUNCTION public.is_current_user_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.emails_permitidos
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_current_user_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_allowed() TO authenticated;

-- Re-create policies enforcing allowlist on every table

-- clientes
DROP POLICY IF EXISTS "Autenticados leem clientes" ON public.clientes;
DROP POLICY IF EXISTS "Autenticados inserem clientes" ON public.clientes;
DROP POLICY IF EXISTS "Autenticados atualizam clientes" ON public.clientes;
DROP POLICY IF EXISTS "Autenticados excluem clientes" ON public.clientes;
CREATE POLICY "Allowlist leem clientes" ON public.clientes FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist atualizam clientes" ON public.clientes FOR UPDATE TO authenticated USING (public.is_current_user_allowed()) WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem clientes" ON public.clientes FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- produtos
DROP POLICY IF EXISTS "Autenticados podem ler produtos" ON public.produtos;
DROP POLICY IF EXISTS "Autenticados podem inserir produtos" ON public.produtos;
DROP POLICY IF EXISTS "Autenticados podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Autenticados podem excluir produtos" ON public.produtos;
CREATE POLICY "Allowlist leem produtos" ON public.produtos FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist atualizam produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.is_current_user_allowed()) WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem produtos" ON public.produtos FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- vendas
DROP POLICY IF EXISTS "Autenticados veem todas as vendas" ON public.vendas;
DROP POLICY IF EXISTS "Autenticados criam vendas" ON public.vendas;
DROP POLICY IF EXISTS "Autenticados atualizam vendas" ON public.vendas;
DROP POLICY IF EXISTS "Autenticados excluem vendas" ON public.vendas;
CREATE POLICY "Allowlist leem vendas" ON public.vendas FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist criam vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed() AND auth.uid() IS NOT NULL);
CREATE POLICY "Allowlist atualizam vendas" ON public.vendas FOR UPDATE TO authenticated USING (public.is_current_user_allowed()) WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem vendas" ON public.vendas FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- itens_venda
DROP POLICY IF EXISTS "Autenticados veem itens de venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Autenticados inserem itens de venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Autenticados atualizam itens de venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Autenticados excluem itens de venda" ON public.itens_venda;
CREATE POLICY "Allowlist leem itens de venda" ON public.itens_venda FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem itens de venda" ON public.itens_venda FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed() AND auth.uid() IS NOT NULL);
CREATE POLICY "Allowlist atualizam itens de venda" ON public.itens_venda FOR UPDATE TO authenticated USING (public.is_current_user_allowed()) WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem itens de venda" ON public.itens_venda FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- cores
DROP POLICY IF EXISTS "Autenticados leem cores" ON public.cores;
DROP POLICY IF EXISTS "Autenticados inserem cores" ON public.cores;
DROP POLICY IF EXISTS "Autenticados excluem cores" ON public.cores;
CREATE POLICY "Allowlist leem cores" ON public.cores FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem cores" ON public.cores FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem cores" ON public.cores FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- modelos
DROP POLICY IF EXISTS "Autenticados leem modelos" ON public.modelos;
DROP POLICY IF EXISTS "Autenticados inserem modelos" ON public.modelos;
DROP POLICY IF EXISTS "Autenticados excluem modelos" ON public.modelos;
CREATE POLICY "Allowlist leem modelos" ON public.modelos FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem modelos" ON public.modelos FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem modelos" ON public.modelos FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- tipos_produto
DROP POLICY IF EXISTS "Autenticados leem tipos" ON public.tipos_produto;
DROP POLICY IF EXISTS "Autenticados inserem tipos" ON public.tipos_produto;
DROP POLICY IF EXISTS "Autenticados excluem tipos" ON public.tipos_produto;
CREATE POLICY "Allowlist leem tipos" ON public.tipos_produto FOR SELECT TO authenticated USING (public.is_current_user_allowed());
CREATE POLICY "Allowlist inserem tipos" ON public.tipos_produto FOR INSERT TO authenticated WITH CHECK (public.is_current_user_allowed());
CREATE POLICY "Allowlist excluem tipos" ON public.tipos_produto FOR DELETE TO authenticated USING (public.is_current_user_allowed());

-- emails_permitidos: restrict reads to allowlisted users only (login uses anon RPC email_autorizado)
DROP POLICY IF EXISTS "Autenticados leem emails permitidos" ON public.emails_permitidos;
CREATE POLICY "Allowlist leem emails permitidos" ON public.emails_permitidos FOR SELECT TO authenticated USING (public.is_current_user_allowed());
