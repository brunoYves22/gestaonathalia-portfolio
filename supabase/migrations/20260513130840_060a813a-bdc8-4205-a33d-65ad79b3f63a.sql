-- Lock down emails_permitidos: keep SELECT for login validation, block all client writes
DROP POLICY IF EXISTS "Autenticados inserem emails permitidos" ON public.emails_permitidos;
DROP POLICY IF EXISTS "Autenticados excluem emails permitidos" ON public.emails_permitidos;

-- Revoke direct execute on the stock-adjustment trigger function (it still runs as trigger)
REVOKE EXECUTE ON FUNCTION public.atualizar_estoque_venda() FROM PUBLIC, anon, authenticated;
