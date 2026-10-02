import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Boxes,
  Wallet,
  CalendarIcon,
  Filter,
  Users,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClienteSelector, type ClienteLite } from "@/components/ClienteSelector";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import AppBackground from "@/components/ui/app-background";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Periodo = "hoje" | "7d" | "30d" | "custom";
type Pagamento = "todos" | "Dinheiro" | "Pix" | "Cartão";

type Venda = {
  id: string;
  total: number;
  forma_pagamento: string;
  created_at: string;
  cliente_id: string | null;
};

type Cliente = { id: string; nome: string; cpf: string | null; telefone: string | null };

type Item = {
  venda_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  custo_na_venda: number;
  preco_medio_na_venda: number;
  lucro_na_venda: number;
};

type Produto = {
  id: string;
  nome: string;
  preco_custo: number;
  estoque: number;
};

const formatBRL = (n: number) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

function getRange(periodo: Periodo, ini?: Date, fim?: Date) {
  const now = new Date();
  if (periodo === "hoje") return { from: startOfDay(now), to: endOfDay(now) };
  if (periodo === "7d") {
    const f = new Date(now);
    f.setDate(f.getDate() - 6);
    return { from: startOfDay(f), to: endOfDay(now) };
  }
  if (periodo === "30d") {
    const f = new Date(now);
    f.setDate(f.getDate() - 29);
    return { from: startOfDay(f), to: endOfDay(now) };
  }
  return {
    from: ini ? startOfDay(ini) : startOfDay(now),
    to: fim ? endOfDay(fim) : endOfDay(now),
  };
}

const Relatorios = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // dados brutos
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // filtros
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [pagamento, setPagamento] = useState<Pagamento>("todos");
  const [dataIni, setDataIni] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Edição de venda
  type EditItem = {
    id?: string;
    produto_id: string;
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    quantidadeOriginal: number;
    estoqueDisponivel: number;
    precoMedioNaVenda: number;
    removido?: boolean;
  };
  const [editVendaId, setEditVendaId] = useState<string | null>(null);
  const [editPagamento, setEditPagamento] = useState<string>("Dinheiro");
  const [editCliente, setEditCliente] = useState<ClienteLite | null>(null);
  const [editItens, setEditItens] = useState<EditItem[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => {
    document.title = "Relatórios | Sistema de Gestão";
    fetchAll();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, iRes, pRes, cRes] = await Promise.all([
        supabase
          .from("vendas")
          .select("id,total,forma_pagamento,created_at,cliente_id")
          .order("created_at", { ascending: false }),
        supabase
          .from("itens_venda")
          .select("venda_id,produto_id,quantidade,preco_unitario,custo_na_venda,preco_medio_na_venda,lucro_na_venda"),
        supabase.from("produtos").select("id,nome,preco_custo,estoque"),
        supabase.from("clientes").select("id,nome,cpf,telefone"),
      ]);
      if (vRes.error) throw vRes.error;
      if (iRes.error) throw iRes.error;
      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;

      setVendas(
        (vRes.data ?? []).map((v) => ({
          ...v,
          total: Number(v.total ?? 0),
        })) as Venda[],
      );
      setItens(
        (iRes.data ?? []).map((it) => ({
          ...it,
          quantidade: Number(it.quantidade ?? 0),
          preco_unitario: Number(it.preco_unitario ?? 0),
          custo_na_venda: Number(it.custo_na_venda ?? 0),
          preco_medio_na_venda: Number(it.preco_medio_na_venda ?? 0),
          lucro_na_venda: Number(it.lucro_na_venda ?? 0),
        })) as Item[],
      );
      setProdutos(
        (pRes.data ?? []).map((p) => ({
          ...p,
          preco_custo: Number(p.preco_custo ?? 0),
          estoque: Number(p.estoque ?? 0),
        })) as Produto[],
      );
      setClientes((cRes.data ?? []) as Cliente[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirEdicao = (vendaId: string) => {
    const v = vendas.find((x) => x.id === vendaId);
    if (!v) return;
    const itensV = itens.filter((i) => i.venda_id === vendaId);
    setEditVendaId(vendaId);
    setEditPagamento(v.forma_pagamento);
    const cli = v.cliente_id ? clientes.find((c) => c.id === v.cliente_id) : null;
    setEditCliente(cli ? { id: cli.id, nome: cli.nome, cpf: cli.cpf, telefone: cli.telefone } : null);
    setEditItens(
      itensV.map((it) => {
        const p = produtos.find((x) => x.id === it.produto_id);
        return {
          produto_id: it.produto_id,
          produto_nome: p?.nome ?? "Produto removido",
          quantidade: it.quantidade,
          preco_unitario: it.preco_unitario,
          quantidadeOriginal: it.quantidade,
          estoqueDisponivel: p?.estoque ?? 0,
          precoMedioNaVenda: it.preco_medio_na_venda,
        };
      }),
    );
  };

  const fecharEdicao = () => {
    setEditVendaId(null);
    setEditItens([]);
    setEditCliente(null);
  };

  const salvarEdicao = async () => {
    if (!editVendaId) return;
    const ativos = editItens.filter((i) => !i.removido);
    if (ativos.length === 0) {
      toast.error("A venda precisa ter ao menos 1 item. Para excluir a venda inteira, use outra ação.");
      return;
    }
    // valida quantidades vs estoque (delta positivo)
    for (const it of editItens) {
      if (it.removido) continue;
      const delta = it.quantidade - it.quantidadeOriginal;
      if (delta > 0 && delta > it.estoqueDisponivel) {
        toast.error(`Estoque insuficiente para ${it.produto_nome}`);
        return;
      }
      if (it.quantidade <= 0) {
        toast.error(`Quantidade inválida para ${it.produto_nome}`);
        return;
      }
      if (it.preco_unitario < 0) {
        toast.error(`Preço inválido para ${it.produto_nome}`);
        return;
      }
    }
    setSalvandoEdicao(true);
    try {
      // 1) Atualiza/exclui itens e ajusta estoque
      for (const it of editItens) {
        if (it.removido) {
          // restaura estoque e exclui linha (se tiver id) — como não temos id aqui, deletamos por venda+produto
          const { error: delErr } = await supabase
            .from("itens_venda")
            .delete()
            .eq("venda_id", editVendaId)
            .eq("produto_id", it.produto_id);
          if (delErr) throw delErr;
          await supabase
            .from("produtos")
            .update({ estoque: it.estoqueDisponivel + it.quantidadeOriginal })
            .eq("id", it.produto_id);
        } else {
          const delta = it.quantidade - it.quantidadeOriginal;
          // atualiza item
          const { error: upErr } = await supabase
            .from("itens_venda")
            .update({
              quantidade: it.quantidade,
              preco_unitario: it.preco_unitario,
              lucro_na_venda: (it.preco_unitario - it.precoMedioNaVenda) * it.quantidade,
            })
            .eq("venda_id", editVendaId)
            .eq("produto_id", it.produto_id);
          if (upErr) throw upErr;
          if (delta !== 0) {
            await supabase
              .from("produtos")
              .update({ estoque: it.estoqueDisponivel - delta })
              .eq("id", it.produto_id);
          }
        }
      }

      // 2) Atualiza venda (total, pagamento, cliente)
      const novoTotal = ativos.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
      const { error: vErr } = await supabase
        .from("vendas")
        .update({
          total: novoTotal,
          forma_pagamento: editPagamento,
          cliente_id: editCliente?.id ?? null,
        })
        .eq("id", editVendaId);
      if (vErr) throw vErr;

      toast.success("Venda atualizada");
      fecharEdicao();
      await fetchAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Erro ao salvar edição");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // ===== Dados derivados (memoizados) =====
  const range = useMemo(
    () => getRange(periodo, dataIni, dataFim),
    [periodo, dataIni, dataFim],
  );

  const produtosMap = useMemo(
    () => new Map(produtos.map((p) => [p.id, p])),
    [produtos],
  );

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((v) => {
      const d = new Date(v.created_at);
      if (d < range.from || d > range.to) return false;
      if (pagamento !== "todos" && v.forma_pagamento !== pagamento) return false;
      return true;
    });
  }, [vendas, range, pagamento]);

  const vendaIds = useMemo(
    () => new Set(vendasFiltradas.map((v) => v.id)),
    [vendasFiltradas],
  );

  const itensFiltrados = useMemo(
    () => itens.filter((it) => vendaIds.has(it.venda_id)),
    [itens, vendaIds],
  );

  const resumo = useMemo(() => {
    const faturamento = vendasFiltradas.reduce((s, v) => s + v.total, 0);
    const qtdVendas = vendasFiltradas.length;
    const totalItens = itensFiltrados.reduce((s, it) => s + it.quantidade, 0);
    const ticketMedio = qtdVendas > 0 ? faturamento / qtdVendas : 0;

    let custo = 0;
    let receita = 0;
    let lucro = 0;
    for (const it of itensFiltrados) {
      receita += it.preco_unitario * it.quantidade;
      custo += it.preco_medio_na_venda * it.quantidade;
      lucro += it.lucro_na_venda;
    }
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    return { faturamento, qtdVendas, totalItens, ticketMedio, lucro, margem };
  }, [vendasFiltradas, itensFiltrados, produtosMap]);

  const itensPorVenda = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of itensFiltrados) {
      m.set(it.venda_id, (m.get(it.venda_id) ?? 0) + it.quantidade);
    }
    return m;
  }, [itensFiltrados]);

  const topProdutos = useMemo(() => {
    const agrup = new Map<string, { quantidade: number; total: number }>();
    for (const it of itensFiltrados) {
      const cur = agrup.get(it.produto_id) ?? { quantidade: 0, total: 0 };
      cur.quantidade += it.quantidade;
      cur.total += it.quantidade * it.preco_unitario;
      agrup.set(it.produto_id, cur);
    }
    return Array.from(agrup.entries())
      .map(([id, v]) => ({
        id,
        nome: produtosMap.get(id)?.nome ?? "Produto removido",
        ...v,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [itensFiltrados, produtosMap]);

  const clientesMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  const itensDetalhados = useMemo(() => {
    const vMap = new Map(vendasFiltradas.map((v) => [v.id, v]));
    return itensFiltrados
      .map((it) => {
        const v = vMap.get(it.venda_id);
        if (!v) return null;
        const p = produtosMap.get(it.produto_id);
        const cli = v.cliente_id ? clientesMap.get(v.cliente_id) : null;
        const custo = it.preco_medio_na_venda * it.quantidade;
        const receita = it.preco_unitario * it.quantidade;
        return {
          key: `${it.venda_id}-${it.produto_id}`,
          data: v.created_at,
          produto: p?.nome ?? "Produto removido",
          quantidade: it.quantidade,
          precoCustoUnit: it.preco_medio_na_venda,
          precoVendaUnit: it.preco_unitario,
          custoTotal: custo,
          receitaTotal: receita,
          lucro: it.lucro_na_venda,
          cliente: cli,
          formaPagamento: v.forma_pagamento,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.data).getTime() - new Date(a!.data).getTime()) as Array<{
        key: string; data: string; produto: string; quantidade: number;
        precoCustoUnit: number; precoVendaUnit: number; custoTotal: number;
        receitaTotal: number; lucro: number;
        cliente: Cliente | null | undefined; formaPagamento: string;
      }>;
  }, [itensFiltrados, vendasFiltradas, produtosMap, clientesMap]);

  

  const topClientes = useMemo(() => {
    const agrup = new Map<string, { qtdVendas: number; total: number }>();
    for (const v of vendasFiltradas) {
      if (!v.cliente_id) continue;
      const cur = agrup.get(v.cliente_id) ?? { qtdVendas: 0, total: 0 };
      cur.qtdVendas += 1;
      cur.total += v.total;
      agrup.set(v.cliente_id, cur);
    }
    return Array.from(agrup.entries())
      .map(([id, v]) => ({
        id,
        nome: clientesMap.get(id)?.nome ?? "Cliente removido",
        ...v,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [vendasFiltradas, clientesMap]);

  const vendasPorDia = useMemo(() => {
    const m = new Map<string, number>();
    // popula dias do range (até 60 buckets máximo p/ não pesar)
    const cur = new Date(range.from);
    let guard = 0;
    while (cur <= range.to && guard < 120) {
      m.set(format(cur, "yyyy-MM-dd"), 0);
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
    for (const v of vendasFiltradas) {
      const k = format(new Date(v.created_at), "yyyy-MM-dd");
      if (m.has(k)) m.set(k, (m.get(k) ?? 0) + v.total);
    }
    return Array.from(m.entries()).map(([k, total]) => ({
      dia: format(new Date(k), "dd/MM", { locale: ptBR }),
      total: Number(total.toFixed(2)),
    }));
  }, [vendasFiltradas, range]);

  const maxQtd = topProdutos[0]?.quantidade ?? 0;
  const maxDiaTotal = Math.max(1, ...vendasPorDia.map((d) => d.total));

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
              Relatórios
            </h1>
            <div className="w-9 sm:w-[88px] shrink-0" />
          </header>

          {/* Filtros */}
          <section className="glass rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Filtros</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={periodo}
                onValueChange={(v) => setPeriodo(v as Periodo)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pagamento}
                onValueChange={(v) => setPagamento(v as Pagamento)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as formas</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={periodo !== "custom"}
                    className={cn(
                      "justify-start font-normal",
                      !dataIni && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dataIni ? format(dataIni, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataIni}
                    onSelect={setDataIni}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={periodo !== "custom"}
                    className={cn(
                      "justify-start font-normal",
                      !dataFim && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </section>

          {loading ? (
            <div className="glass rounded-2xl flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Cards principais */}
              <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                <Card
                  label="Faturamento"
                  value={formatBRL(resumo.faturamento)}
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <Card
                  label="Vendas"
                  value={String(resumo.qtdVendas)}
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <Card
                  label="Itens vendidos"
                  value={String(resumo.totalItens)}
                  icon={<Boxes className="w-4 h-4" />}
                />
                <Card
                  label="Ticket médio"
                  value={formatBRL(resumo.ticketMedio)}
                  icon={<Wallet className="w-4 h-4" />}
                />
                <Card
                  label="Lucro"
                  value={formatBRL(resumo.lucro)}
                  hint={`${resumo.margem.toFixed(1)}% margem`}
                  icon={<TrendingUp className="w-4 h-4" />}
                  highlight
                />
              </section>

              {/* Gráfico */}
              <section className="glass rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Vendas por dia</h2>
                  <span className="text-xs text-muted-foreground">
                    {format(range.from, "dd/MM/yyyy")} —{" "}
                    {format(range.to, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="h-64 w-full overflow-x-auto">
                  <div className="flex h-full min-w-[560px] items-end gap-2 border-b border-white/10 pb-6 pt-4">
                    {vendasPorDia.map((d) => {
                      const height = Math.max(4, (d.total / maxDiaTotal) * 100);
                      return (
                        <div key={d.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                          <div
                            className="w-full rounded-t-md bg-primary/80"
                            title={`${d.dia}: ${formatBRL(d.total)}`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {d.dia}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Top clientes */}
              <section className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Clientes que mais compram</h2>
                </div>
                {topClientes.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma venda vinculada a cliente no período</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {topClientes.map((c, idx) => (
                      <li
                        key={c.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium truncate">{c.nome}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums text-primary">
                            {formatBRL(c.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.qtdVendas} venda{c.qtdVendas > 1 ? "s" : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Top produtos + Tabela vendas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <section className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                      Produtos mais vendidos
                    </h2>
                  </div>
                  {topProdutos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma venda no período</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {topProdutos.map((p, idx) => {
                        const pct = maxQtd > 0 ? (p.quantidade / maxQtd) * 100 : 0;
                        return (
                          <li
                            key={p.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-medium truncate">
                                  {p.nome}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold tabular-nums text-primary">
                                  {formatBRL(p.total)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.quantidade} un.
                                </p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                      Vendas no período
                    </h2>
                  </div>
                  {vendasFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma venda no período</p>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card/90 backdrop-blur z-10">
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead className="text-right">Itens</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendasFiltradas.slice(0, 200).map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="text-sm">
                                {format(new Date(v.created_at), "dd/MM/yy HH:mm")}
                              </TableCell>
                              <TableCell className="text-sm">
                                {v.forma_pagamento}
                              </TableCell>
                              <TableCell className="text-right text-sm tabular-nums">
                                {itensPorVenda.get(v.id) ?? 0}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold tabular-nums text-primary">
                                {formatBRL(v.total)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => abrirEdicao(v.id)}
                                  title="Editar venda"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {vendasFiltradas.length > 200 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Mostrando 200 de {vendasFiltradas.length} vendas
                        </p>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Detalhamento de itens vendidos */}
              <section className="glass rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <Boxes className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Itens vendidos — detalhado</h2>
                </div>
                {itensDetalhados.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Boxes className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum item vendido no período</p>
                  </div>
                ) : (
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-white/10">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card/90 backdrop-blur z-10">
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Custo un.</TableHead>
                          <TableHead className="text-right">Venda un.</TableHead>
                          <TableHead className="text-right">Total venda</TableHead>
                          <TableHead className="text-right">Lucro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itensDetalhados.slice(0, 300).map((it) => (
                          <TableRow key={it.key}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(it.data), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell className="text-sm">{it.produto}</TableCell>
                            <TableCell className="text-xs">
                              {it.cliente ? (
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{it.cliente.nome}</p>
                                  {(it.cliente.telefone || it.cliente.cpf) && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {it.cliente.telefone ?? it.cliente.cpf}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Sem cliente</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{it.quantidade}</TableCell>
                            <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                              {formatBRL(it.precoCustoUnit)}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {formatBRL(it.precoVendaUnit)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums text-primary">
                              {formatBRL(it.receitaTotal)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right text-sm font-semibold tabular-nums",
                                it.lucro >= 0 ? "text-emerald-400" : "text-red-400",
                              )}
                            >
                              {formatBRL(it.lucro)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {itensDetalhados.length > 300 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Mostrando 300 de {itensDetalhados.length} itens
                      </p>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Dialog de edição de venda */}
      <Dialog open={!!editVendaId} onOpenChange={(o) => !o && fecharEdicao()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</Label>
              <div className="mt-1">
                <ClienteSelector value={editCliente} onChange={setEditCliente} />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Forma de pagamento</Label>
              <Select value={editPagamento} onValueChange={setEditPagamento}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Itens</Label>
              <ul className="space-y-2">
                {editItens.map((it, idx) => (
                  <li
                    key={`${it.produto_id}-${idx}`}
                    className={cn(
                      "border border-white/10 rounded-xl p-3 bg-white/5",
                      it.removido && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm">{it.produto_nome}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditItens((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, removido: !x.removido } : x)),
                          )
                        }
                        className="text-muted-foreground hover:text-destructive"
                        title={it.removido ? "Restaurar item" : "Remover item"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Qtd</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          disabled={it.removido}
                          value={it.quantidade}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setEditItens((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, quantidade: v } : x)),
                            );
                          }}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço un. (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          disabled={it.removido}
                          value={it.preco_unitario}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setEditItens((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, preco_unitario: v } : x)),
                            );
                          }}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right tabular-nums">
                      Subtotal: {formatBRL(it.quantidade * it.preco_unitario)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline justify-between pt-3 border-t border-white/10">
              <span className="text-sm text-muted-foreground">Novo total</span>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {formatBRL(
                  editItens
                    .filter((i) => !i.removido)
                    .reduce((s, i) => s + i.quantidade * i.preco_unitario, 0),
                )}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={fecharEdicao} disabled={salvandoEdicao}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={salvandoEdicao}>
              {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppBackground>
  );
};

function Card({
  label,
  value,
  icon,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={cn(
        "glass rounded-2xl p-4 sm:p-5",
        highlight && "ring-1 ring-primary/40 shadow-[0_0_40px_-15px_hsl(var(--primary)/0.6)]",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center",
            highlight
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-white/5 border-white/10 text-foreground/80",
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          "text-xl sm:text-2xl font-semibold tabular-nums",
          highlight && "text-primary",
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      )}
    </article>
  );
}

export default Relatorios;
