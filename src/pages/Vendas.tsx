import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2, Banknote, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import AppBackground from "@/components/ui/app-background";
import { toast } from "sonner";
import { ClienteSelector, type ClienteLite } from "@/components/ClienteSelector";

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  preco: number;
  preco_custo: number;
  estoque: number;             // unidades em loja (vendáveis)
  estoque_transporte: number;  // unidades a caminho
};

type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
  precoVenda: string; // string para input controlado
};

type FormaPagamento = "Dinheiro" | "Pix" | "Cartão";

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Vendas = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState<FormaPagamento>("Dinheiro");
  const [cliente, setCliente] = useState<ClienteLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    document.title = "Vendas | Sistema de Gestão";
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome");
    if (error) toast.error("Erro ao buscar produtos");
    setProdutos((data as Produto[]) ?? []);
    setLoading(false);
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.codigo ?? "").toLowerCase().includes(q)
    );
  }, [produtos, busca]);

  const adicionar = (p: Produto) => {
    if ((p.estoque ?? 0) <= 0) {
      if ((p.estoque_transporte ?? 0) > 0) {
        toast.error("Produto ainda em transporte — não chegou à loja");
      } else {
        toast.error("Produto sem estoque");
      }
      return;
    }
    const existente = carrinho.find((i) => i.produto.id === p.id);
    const qtdAtual = existente?.quantidade ?? 0;
    if (qtdAtual + 1 > p.estoque) {
      toast.error(`Estoque insuficiente para ${p.nome}`);
      return;
    }
    if (existente) {
      setCarrinho(carrinho.map((i) =>
        i.produto.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i
      ));
    } else {
      const precoInicial = Number(p.preco) > 0 ? String(p.preco) : "";
      setCarrinho([...carrinho, { produto: p, quantidade: 1, precoVenda: precoInicial }]);
    }
    toast.success(`${p.nome} adicionado`, { duration: 1200 });
  };

  const alterarQtd = (id: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((i) => {
          if (i.produto.id !== id) return i;
          const nova = i.quantidade + delta;
          if (nova > i.produto.estoque) {
            toast.error("Estoque insuficiente");
            return i;
          }
          return { ...i, quantidade: nova };
        })
        .filter((i) => i.quantidade > 0)
    );
  };

  const alterarPreco = (id: string, valor: string) => {
    setCarrinho((prev) =>
      prev.map((i) =>
        i.produto.id === id ? { ...i, precoVenda: valor } : i
      )
    );
  };

  const remover = (id: string) =>
    setCarrinho(carrinho.filter((i) => i.produto.id !== id));

  const total = carrinho.reduce(
    (acc, i) => acc + i.quantidade * Number(i.precoVenda || 0),
    0
  );

  const cancelar = () => {
    setCarrinho([]);
    toast("Carrinho cancelado");
  };

  const finalizar = async () => {
    if (carrinho.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    // Valida preços de venda
    const semPreco = carrinho.find((i) => !(Number(i.precoVenda) > 0));
    if (semPreco) {
      toast.error(`Informe o preço de venda de "${semPreco.produto.nome}"`);
      return;
    }
    setFinalizando(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sessão expirada");
      setFinalizando(false);
      return;
    }
    const { data: venda, error: errVenda } = await supabase
      .from("vendas")
      .insert({
        user_id: userData.user.id,
        total,
        forma_pagamento: pagamento,
        cliente_id: cliente?.id ?? null,
      })
      .select()
      .single();
    if (errVenda || !venda) {
      toast.error("Erro ao registrar venda");
      setFinalizando(false);
      return;
    }
    const itens = carrinho.map((i) => {
      const precoMedio = Number(i.produto.preco_custo) || 0;
      const precoVenda = Number(i.precoVenda);
      return {
        venda_id: venda.id,
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_unitario: precoVenda,
        custo_na_venda: precoMedio,
        preco_medio_na_venda: precoMedio,
        lucro_na_venda: (precoVenda - precoMedio) * i.quantidade,
      };
    });
    const { error: errItens } = await supabase.from("itens_venda").insert(itens);
    if (errItens) {
      toast.error(errItens.message || "Erro nos itens da venda");
      setFinalizando(false);
      return;
    }
    toast.success("Venda realizada com sucesso");
    setCarrinho([]);
    setCliente(null);
    await fetchProdutos();
    setFinalizando(false);
  };

  const formas: { value: FormaPagamento; icon: typeof Banknote }[] = [
    { value: "Dinheiro", icon: Banknote },
    { value: "Pix", icon: Smartphone },
    { value: "Cartão", icon: CreditCard },
  ];

  return (
    <AppBackground>
      <main className="min-h-screen px-4 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground px-2 sm:px-3 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate text-center flex-1">
              Caixa de Vendas
            </h1>
            <div className="w-9 sm:w-20 shrink-0" />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* PRODUTOS */}
            <section className="glass rounded-2xl p-5 lg:col-span-3 flex flex-col min-h-[60vh]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="glass-input pl-10 h-11"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : filtrados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">Nenhum produto</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtrados.map((p) => {
                      const emLoja = (p.estoque ?? 0) > 0;
                      const emTransp = (p.estoque_transporte ?? 0) > 0;
                      const bloqueado = !emLoja;
                      return (
                        <div
                          key={p.id}
                          className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium leading-tight">{p.nome}</h3>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {emLoja && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    🏪 {p.estoque} em loja
                                  </span>
                                )}
                                {emTransp && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                                    🚚 {p.estoque_transporte} a caminho
                                  </span>
                                )}
                              </div>
                            </div>
                            {p.codigo && (
                              <p className="text-xs text-muted-foreground mt-0.5">#{p.codigo}</p>
                            )}
                            <div className="flex items-baseline gap-3 mt-2">
                              <span className="text-sm text-muted-foreground">
                                Custo: {formatBRL(Number(p.preco_custo))}
                              </span>
                              {bloqueado && (
                                <span className="text-xs text-destructive">
                                  {emTransp ? "Apenas em transporte" : "Sem estoque"}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            disabled={bloqueado}
                            onClick={() => adicionar(p)}
                            className="mt-3 h-10 bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* CARRINHO */}
            <section className="glass rounded-2xl p-5 lg:col-span-2 flex flex-col min-h-[60vh]">
              <h2 className="text-lg font-semibold mb-3">Carrinho</h2>

              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cliente</p>
                <ClienteSelector value={cliente} onChange={setCliente} />
              </div>

              <div className="flex-1 overflow-y-auto -mx-1 px-1">
                {carrinho.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    Nenhum item adicionado
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {carrinho.map((i) => {
                      const subtotal = i.quantidade * Number(i.precoVenda || 0);
                      return (
                        <li
                          key={i.produto.id}
                          className="bg-white/5 border border-white/10 rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{i.produto.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                Custo: {formatBRL(Number(i.produto.preco_custo))}
                              </p>
                            </div>
                            <button
                              onClick={() => remover(i.produto.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Preço de venda editável */}
                          <div className="mt-3">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Preço de venda (R$)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={i.precoVenda}
                              onChange={(e) => alterarPreco(i.produto.id, e.target.value)}
                              placeholder="0,00"
                              className="glass-input h-9 mt-1"
                            />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-lg">
                              <button
                                className="px-3 py-1 text-lg leading-none hover:text-primary"
                                onClick={() => alterarQtd(i.produto.id, -1)}
                              >−</button>
                              <span className="px-3 min-w-8 text-center">{i.quantidade}</span>
                              <button
                                className="px-3 py-1 text-lg leading-none hover:text-primary"
                                onClick={() => alterarQtd(i.produto.id, +1)}
                              >+</button>
                            </div>
                            <span className="font-semibold">
                              {formatBRL(subtotal)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Pagamento */}
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Forma de pagamento
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {formas.map(({ value, icon: Icon }) => {
                    const ativo = pagamento === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setPagamento(value)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${
                          ativo
                            ? "bg-primary/15 border-primary/60 text-foreground btn-glow"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] bg-clip-text text-transparent">
                    {formatBRL(total)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    onClick={cancelar}
                    disabled={finalizando || carrinho.length === 0}
                    className="border border-white/10 hover:bg-white/5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={finalizar}
                    disabled={finalizando || carrinho.length === 0}
                    className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground btn-glow"
                  >
                    {finalizando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar Venda"}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppBackground>
  );
};

export default Vendas;
