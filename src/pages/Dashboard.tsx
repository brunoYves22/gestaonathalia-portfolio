import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
  TrendingUp,
  DollarSign,
  Receipt,
  Trophy,
  Wallet,
  Activity,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AppBackground from "@/components/ui/app-background";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { toast } from "sonner";

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Metrics = {
  faturamento: number;
  lucro: number;
  custo: number;
  totalVendas: number;
  ticketMedio: number;
  margem: number;
  faturamentoMes: number;
  topProduto: string;
  topQtd: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard | Sistema de Gestão";
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [vendasRes, itensRes, produtosRes] = await Promise.all([
        supabase.from("vendas").select("id, total, created_at"),
        supabase.from("itens_venda").select("produto_id, quantidade, preco_unitario"),
        supabase.from("produtos").select("id, nome, preco_custo"),
      ]);

      const vendas = vendasRes.data ?? [];
      const itens = itensRes.data ?? [];
      const produtos = produtosRes.data ?? [];

      const produtosMap = new Map(produtos.map((p) => [p.id, p]));

      const faturamento = vendas.reduce((s, v) => s + Number(v.total ?? 0), 0);
      const totalVendas = vendas.length;
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

      let custo = 0;
      const vendidoPorProduto = new Map<string, number>();
      for (const it of itens) {
        const p = produtosMap.get(it.produto_id);
        const qtd = Number(it.quantidade ?? 0);
        custo += Number(p?.preco_custo ?? 0) * qtd;
        vendidoPorProduto.set(
          it.produto_id,
          (vendidoPorProduto.get(it.produto_id) ?? 0) + qtd,
        );
      }

      const lucro = faturamento - custo;
      const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const faturamentoMes = vendas
        .filter((v) => new Date(v.created_at) >= inicioMes)
        .reduce((s, v) => s + Number(v.total ?? 0), 0);

      let topId = "";
      let topQtd = 0;
      vendidoPorProduto.forEach((qtd, id) => {
        if (qtd > topQtd) {
          topQtd = qtd;
          topId = id;
        }
      });
      const topProduto = topId ? produtosMap.get(topId)?.nome ?? "—" : "—";

      setMetrics({
        faturamento,
        lucro,
        custo,
        totalVendas,
        ticketMedio,
        margem,
        faturamentoMes,
        topProduto,
        topQtd,
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/login", { replace: true });
  };

  const items: BentoItem[] = useMemo(
    () => metrics
      ? [
        {
          title: "Faturamento Total",
          meta: formatBRL(metrics.faturamento),
          description: `Soma de todas as vendas registradas no sistema. ${metrics.totalVendas} venda(s) no histórico.`,
          icon: <DollarSign className="w-5 h-5 text-foreground" />,
          status: "Live",
          tags: ["Receita", "Total"],
          colSpan: 2,
          hasPersistentHover: true,
        },
        {
          title: "Lucro Líquido",
          meta: `${metrics.margem.toFixed(1)}%`,
          description: `${formatBRL(metrics.lucro)} de lucro após custos.`,
          icon: <TrendingUp className="w-5 h-5 text-foreground" />,
          status: metrics.lucro >= 0 ? "Positivo" : "Negativo",
          tags: ["Lucro", "Margem"],
        },
        {
          title: "Vendas Realizadas",
          meta: `${metrics.totalVendas}`,
          description: "Quantidade total de vendas concluídas no caixa.",
          icon: <Receipt className="w-5 h-5 text-foreground" />,
          status: "Total",
          tags: ["Pedidos"],
        },
        {
          title: "Ticket Médio",
          meta: formatBRL(metrics.ticketMedio),
          description: "Valor médio por venda. Indicador de performance do caixa.",
          icon: <Wallet className="w-5 h-5 text-foreground" />,
          tags: ["Média"],
          colSpan: 2,
        },
        {
          title: "Faturamento do Mês",
          meta: formatBRL(metrics.faturamentoMes),
          description: "Receita acumulada no mês atual.",
          icon: <Activity className="w-5 h-5 text-foreground" />,
          status: "Mensal",
          tags: ["Mês"],
        },
        {
          title: "Produto Mais Vendido",
          meta: metrics.topQtd ? `${metrics.topQtd} un.` : "—",
          description: metrics.topProduto,
          icon: <Trophy className="w-5 h-5 text-foreground" />,
          status: "Top",
          tags: ["Destaque"],
          colSpan: 2,
        },
        ]
      : [],
    [metrics],
  );

  const actions = [
    { title: "Nova Venda", icon: ShoppingCart, to: "/vendas", desc: "Abrir o caixa" },
    { title: "Produtos", icon: Package, to: "/produtos", desc: "Gerenciar estoque" },
    { title: "Clientes", icon: Users, to: "/clientes", desc: "Cadastro de clientes" },
    { title: "Relatórios", icon: BarChart3, to: "/relatorios", desc: "Vendas e métricas" },
  ];

  return (
    <AppBackground>
      <main className="min-h-screen px-4 py-6 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-start justify-between gap-3 mb-8 sm:mb-10">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Painel</p>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
                Visão geral do negócio
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground shrink-0 px-2 sm:px-3"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </header>

          <section className="mb-10">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <BentoGrid items={items} />
            )}
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {actions.map(({ title, icon: Icon, to, desc }) => (
              <button
                key={title}
                onClick={() => navigate(to)}
                className="glass rounded-2xl p-6 text-left transition-colors hover:border-primary/40 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] flex items-center justify-center mb-4 group-hover:btn-glow transition-shadow">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </button>
            ))}
          </section>
        </div>
      </main>
    </AppBackground>
  );
};

export default Dashboard;
