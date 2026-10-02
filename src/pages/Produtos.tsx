import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Pencil, Trash2, Loader2, Package, PackagePlus, Truck, Store, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import OpcaoCombobox from "@/components/OpcaoCombobox";
import AppBackground from "@/components/ui/app-background";
import { toast } from "sonner";
import { z } from "zod";

type Aba = "Aparelho" | "Acessório" | "Peça";

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  categoria: string;
  preco: number;
  preco_custo: number;
  ultimo_custo: number;
  estoque: number;             // em loja
  estoque_transporte: number;  // a caminho
  aba: Aba;
  tipo: string | null;
  imei: string | null;
  imei2: string | null;
  modelo: string | null;
  serial_number: string | null;
  cor: string | null;
  marca: string | null;
  gb: string | null;
  memoria_ram: string | null;
  saude_bateria: string | null;
  ciclo_bateria: string | null;
  estado_aparelho: string | null;
  quantidade_minima: number | null;
};

const ABAS: Aba[] = ["Aparelho", "Acessório", "Peça"];

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">
      {required && <span className="text-destructive mr-0.5">*</span>}
      {label}
    </Label>
    {children}
  </div>
);

const formatBRL = (n: number) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(160),
  codigo: z.string().trim().max(80).optional().or(z.literal("")),
  preco_custo: z.number().min(0, "Custo não pode ser negativo"),
  estoque: z.number().int("Quantidade inteira").min(0, "Quantidade não pode ser negativa"),
  estoque_transporte: z.number().int("Quantidade inteira").min(0, "Quantidade não pode ser negativa"),
});

type FormState = {
  aba: Aba;
  nome: string;
  codigo: string;
  tipo: string;
  imei: string;
  imei2: string;
  modelo: string;
  serial_number: string;
  cor: string;
  categoria: string;
  marca: string;
  gb: string;
  memoria_ram: string;
  saude_bateria: string;
  ciclo_bateria: string;
  estado_aparelho: string;
  estoque: string;
  estoque_transporte: string;
  quantidade_minima: string;
  preco_custo: string;
};

const emptyForm: FormState = {
  aba: "Aparelho",
  nome: "",
  codigo: "",
  tipo: "",
  imei: "",
  imei2: "",
  modelo: "",
  serial_number: "",
  cor: "",
  categoria: "",
  marca: "",
  gb: "",
  memoria_ram: "",
  saude_bateria: "",
  ciclo_bateria: "",
  estado_aparelho: "",
  estoque: "1",
  estoque_transporte: "0",
  quantidade_minima: "",
  preco_custo: "",
};

const Produtos = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "loja" | "transporte">("todos");
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [removerId, setRemoverId] = useState<string | null>(null);

  // Entrada de estoque (compra) — média ponderada
  const [entradaProduto, setEntradaProduto] = useState<Produto | null>(null);
  const [entradaQtd, setEntradaQtd] = useState("1");
  const [entradaCusto, setEntradaCusto] = useState("");
  const [entradaDestino, setEntradaDestino] = useState<"loja" | "transporte">("loja");
  const [entradaSalvando, setEntradaSalvando] = useState(false);

  // Mover unidades entre loja ↔ transporte
  const [moverProduto, setMoverProduto] = useState<Produto | null>(null);
  const [moverDirecao, setMoverDirecao] = useState<"para_loja" | "para_transporte">("para_loja");
  const [moverQtd, setMoverQtd] = useState("1");
  const [moverSalvando, setMoverSalvando] = useState(false);

  useEffect(() => {
    document.title = "Produtos | Sistema de Gestão";
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome");
    if (error) toast.error("Erro ao carregar produtos");
    setProdutos((data as unknown as Produto[]) ?? []);
    setLoading(false);
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const emLoja = (p.estoque ?? 0) > 0;
      const emTransp = (p.estoque_transporte ?? 0) > 0;
      if (statusFiltro === "loja" && !emLoja) return false;
      if (statusFiltro === "transporte" && !emTransp) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.codigo ?? "").toLowerCase().includes(q) ||
        (p.imei ?? "").toLowerCase().includes(q)
      );
    });
  }, [produtos, busca, statusFiltro]);

  const abrirMover = (p: Produto, direcao: "para_loja" | "para_transporte") => {
    setMoverProduto(p);
    setMoverDirecao(direcao);
    setMoverQtd("1");
  };

  const salvarMover = async () => {
    if (!moverProduto) return;
    const qtd = parseInt(moverQtd, 10);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }
    const loja = moverProduto.estoque ?? 0;
    const transp = moverProduto.estoque_transporte ?? 0;
    let novoLoja = loja;
    let novoTransp = transp;
    if (moverDirecao === "para_loja") {
      if (qtd > transp) {
        toast.error(`Apenas ${transp} unidades em transporte`);
        return;
      }
      novoLoja = loja + qtd;
      novoTransp = transp - qtd;
    } else {
      if (qtd > loja) {
        toast.error(`Apenas ${loja} unidades em loja`);
        return;
      }
      novoLoja = loja - qtd;
      novoTransp = transp + qtd;
    }
    setMoverSalvando(true);
    const { error } = await supabase
      .from("produtos")
      .update({ estoque: novoLoja, estoque_transporte: novoTransp })
      .eq("id", moverProduto.id);
    setMoverSalvando(false);
    if (error) {
      toast.error("Não foi possível mover unidades");
      return;
    }
    toast.success(
      moverDirecao === "para_loja"
        ? `${qtd} unidade(s) marcada(s) como em loja`
        : `${qtd} unidade(s) marcada(s) como em transporte`
    );
    setMoverProduto(null);
    fetchProdutos();
  };

  const abrirNovo = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const abrirEdicao = (p: Produto) => {
    setEditId(p.id);
    setForm({
      aba: p.aba ?? "Aparelho",
      nome: p.nome,
      codigo: p.codigo ?? "",
      tipo: p.tipo ?? "",
      imei: p.imei ?? "",
      imei2: p.imei2 ?? "",
      modelo: p.modelo ?? "",
      serial_number: p.serial_number ?? "",
      cor: p.cor ?? "",
      categoria: p.categoria ?? "",
      marca: p.marca ?? "",
      gb: p.gb ?? "",
      memoria_ram: p.memoria_ram ?? "",
      saude_bateria: p.saude_bateria ?? "",
      ciclo_bateria: p.ciclo_bateria ?? "",
      estado_aparelho: p.estado_aparelho ?? "",
      estoque: String(p.estoque),
      estoque_transporte: String(p.estoque_transporte ?? 0),
      quantidade_minima: p.quantidade_minima != null ? String(p.quantidade_minima) : "",
      preco_custo: String(p.preco_custo ?? 0),
    });
    setOpen(true);
  };

  const salvar = async () => {
    const nomeFinal =
      form.nome.trim() ||
      [form.modelo, form.cor, form.gb].filter(Boolean).join(" ").trim();

    const parsed = produtoSchema.safeParse({
      nome: nomeFinal,
      codigo: form.codigo,
      preco_custo: Number(form.preco_custo || 0),
      estoque: Number(form.estoque || 0),
      estoque_transporte: Number(form.estoque_transporte || 0),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const codigo = form.codigo.trim() ? form.codigo.trim() : null;

    setSalvando(true);

    if (codigo) {
      const { data: existente } = await supabase
        .from("produtos")
        .select("id")
        .eq("codigo", codigo)
        .maybeSingle();
      if (existente && existente.id !== editId) {
        toast.error("Já existe um produto com este código");
        setSalvando(false);
        return;
      }
    }

    const orNull = (s: string) => (s.trim() ? s.trim() : null);
    const intOrNull = (s: string) => {
      const n = parseInt(s, 10);
      return isNaN(n) ? null : n;
    };

    const custoInformado = Number(form.preco_custo || 0);
    const qtdLoja = Number(form.estoque || 0);
    const qtdTransp = Number(form.estoque_transporte || 0);

    const baseCampos = {
      aba: form.aba,
      nome: nomeFinal,
      codigo,
      tipo: orNull(form.tipo),
      imei: orNull(form.imei),
      imei2: orNull(form.imei2),
      modelo: orNull(form.modelo),
      serial_number: orNull(form.serial_number),
      cor: orNull(form.cor),
      categoria: form.categoria.trim() || "Acessório",
      marca: orNull(form.marca),
      gb: orNull(form.gb),
      memoria_ram: orNull(form.memoria_ram),
      saude_bateria: orNull(form.saude_bateria),
      ciclo_bateria: orNull(form.ciclo_bateria),
      estado_aparelho: orNull(form.estado_aparelho),
      quantidade_minima: intOrNull(form.quantidade_minima),
    };

    let error;
    if (editId) {
      const payloadEdicao = {
        ...baseCampos,
        estoque: qtdLoja,
        estoque_transporte: qtdTransp,
        preco_custo: custoInformado,
        ultimo_custo: custoInformado,
      };
      ({ error } = await supabase
        .from("produtos")
        .update(payloadEdicao as never)
        .eq("id", editId));
    } else {
      const payload = {
        ...baseCampos,
        estoque: qtdLoja,
        estoque_transporte: qtdTransp,
        preco_custo: custoInformado,
        ultimo_custo: custoInformado,
      };
      ({ error } = await supabase.from("produtos").insert(payload as never));
    }

    if (error) {
      toast.error(error.message || "Erro ao salvar produto");
      setSalvando(false);
      return;
    }

    toast.success(editId ? "Produto atualizado" : "Produto cadastrado");
    setOpen(false);
    setSalvando(false);
    setForm(emptyForm);
    setEditId(null);
    fetchProdutos();
  };

  const abrirEntrada = (p: Produto) => {
    setEntradaProduto(p);
    setEntradaQtd("1");
    setEntradaCusto(String(p.ultimo_custo ?? p.preco_custo ?? ""));
    setEntradaDestino("loja");
  };

  const salvarEntrada = async () => {
    if (!entradaProduto) return;
    const qtdNova = parseInt(entradaQtd, 10);
    const custoNovo = Number(entradaCusto);
    if (!Number.isFinite(qtdNova) || qtdNova <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }
    if (!Number.isFinite(custoNovo) || custoNovo < 0) {
      toast.error("Informe um custo válido");
      return;
    }
    setEntradaSalvando(true);
    const lojaAtual = entradaProduto.estoque ?? 0;
    const transpAtual = entradaProduto.estoque_transporte ?? 0;
    const totalAtual = lojaAtual + transpAtual;
    const medioAtual = Number(entradaProduto.preco_custo ?? 0);
    const novoTotal = totalAtual + qtdNova;
    const novoMedio =
      novoTotal > 0
        ? (medioAtual * totalAtual + custoNovo * qtdNova) / novoTotal
        : custoNovo;

    const novoLoja = entradaDestino === "loja" ? lojaAtual + qtdNova : lojaAtual;
    const novoTransp = entradaDestino === "transporte" ? transpAtual + qtdNova : transpAtual;

    const { error } = await supabase
      .from("produtos")
      .update({
        estoque: novoLoja,
        estoque_transporte: novoTransp,
        preco_custo: Number(novoMedio.toFixed(4)),
        ultimo_custo: custoNovo,
      } as never)
      .eq("id", entradaProduto.id);

    if (error) {
      toast.error("Erro ao registrar entrada");
      setEntradaSalvando(false);
      return;
    }
    toast.success(
      `Entrada em ${entradaDestino === "loja" ? "loja" : "transporte"} · novo preço médio: ${formatBRL(novoMedio)}`,
    );
    setEntradaSalvando(false);
    setEntradaProduto(null);
    fetchProdutos();
  };

  const excluir = async () => {
    if (!removerId) return;
    const { error } = await supabase.from("produtos").delete().eq("id", removerId);
    if (error) {
      toast.error("Não foi possível excluir (talvez existam vendas vinculadas)");
    } else {
      toast.success("Produto excluído");
      fetchProdutos();
    }
    setRemoverId(null);
  };

  const isAparelho = form.aba === "Aparelho";

  return (
    <AppBackground>
      <main className="min-h-screen px-4 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-foreground px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">
                Produtos
              </h1>
              <Button
                size="sm"
                onClick={abrirNovo}
                className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground btn-glow shrink-0"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </header>

          <section className="glass rounded-2xl p-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código ou IMEI..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="glass-input pl-10 h-11"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { v: "todos", label: "Todos" },
                { v: "loja", label: "🏪 Em loja" },
                { v: "transporte", label: "🚚 Em transporte" },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setStatusFiltro(opt.v)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    statusFiltro === opt.v
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                        <th className="py-3 px-2">Nome</th>
                        <th className="py-3 px-2">Código</th>
                        <th className="py-3 px-2">Aba</th>
                        <th className="py-3 px-2 text-right">Custo atual</th>
                        <th className="py-3 px-2 text-right">Preço médio</th>
                        <th className="py-3 px-2 text-right">🏪 Loja</th>
                        <th className="py-3 px-2 text-right">🚚 Transp.</th>
                        <th className="py-3 px-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((p) => {
                        const loja = p.estoque ?? 0;
                        const transp = p.estoque_transporte ?? 0;
                        return (
                          <tr
                            key={p.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium">{p.nome}</td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {p.codigo || "—"}
                            </td>
                            <td className="py-3 px-2">
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                {p.aba ?? "Aparelho"}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right tabular-nums">
                              {formatBRL(Number(p.ultimo_custo ?? 0))}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold text-primary tabular-nums">
                              {formatBRL(Number(p.preco_custo))}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${loja > 0 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                                {loja}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${transp > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                                {transp}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="inline-flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirMover(p, "para_loja")}
                                  disabled={transp <= 0}
                                  aria-label="Mover transporte → loja"
                                  title="Marcar unidades como chegadas"
                                >
                                  <Store className="w-4 h-4 text-emerald-400" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirMover(p, "para_transporte")}
                                  disabled={loja <= 0}
                                  aria-label="Mover loja → transporte"
                                  title="Mover unidades para transporte"
                                >
                                  <Truck className="w-4 h-4 text-yellow-400" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirEntrada(p)}
                                  aria-label="Entrada de estoque"
                                  title="Entrada de estoque"
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirEdicao(p)}
                                  aria-label="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setRemoverId(p.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                  aria-label="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <ul className="md:hidden space-y-3">
                  {filtrados.map((p) => {
                    const loja = p.estoque ?? 0;
                    const transp = p.estoque_transporte ?? 0;
                    return (
                      <li
                        key={p.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.codigo ? `#${p.codigo}` : "Sem código"}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                            {p.aba ?? "Aparelho"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5">
                            <p className="text-emerald-400/80">🏪 Em loja</p>
                            <p className="font-semibold">{loja}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1.5">
                            <p className="text-yellow-400/80">🚚 Transporte</p>
                            <p className="font-semibold">{transp}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Custo</p>
                            <p className="tabular-nums">
                              {formatBRL(Number(p.ultimo_custo ?? 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Médio</p>
                            <p className="tabular-nums font-semibold text-primary">
                              {formatBRL(Number(p.preco_custo))}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={transp <= 0}
                            className="border border-white/10"
                            onClick={() => abrirMover(p, "para_loja")}
                          >
                            <Store className="w-4 h-4 mr-1 text-emerald-400" />
                            Chegou
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loja <= 0}
                            className="border border-white/10"
                            onClick={() => abrirMover(p, "para_transporte")}
                          >
                            <Truck className="w-4 h-4 mr-1 text-yellow-400" />
                            Transporte
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border border-white/10 px-2"
                            onClick={() => abrirEntrada(p)}
                          >
                            <PackagePlus className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Entrada</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border border-white/10 px-2"
                            onClick={() => abrirEdicao(p)}
                          >
                            <Pencil className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border border-white/10 px-2 text-muted-foreground hover:text-destructive"
                            onClick={() => setRemoverId(p.id)}
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>

      {/* MODAL CADASTRO/EDIÇÃO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? "Para reabastecer estoque, use 'Entrada de estoque' (mantém o preço médio ponderado)."
                : "Preencha as informações do produto e o lote inicial."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full rounded-lg overflow-hidden border border-white/10 bg-white/5 mt-2">
            {ABAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setForm({ ...form, aba: a })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.aba === a
                    ? "bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 mt-4">
            <Field label="Nome do produto" required>
              <Input
                className="glass-input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder={isAparelho ? "Ex.: iPhone 13 128GB Preto" : "Nome"}
              />
            </Field>

            <Field label="Código">
              <Input
                className="glass-input"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Opcional"
              />
            </Field>

            <Field label="Tipo" required={isAparelho}>
              <OpcaoCombobox
                table="tipos_produto"
                value={form.tipo}
                onChange={(nome) => setForm({ ...form, tipo: nome })}
              />
            </Field>

            <Field label="Categoria">
              <Input
                className="glass-input"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Selecionar"
              />
            </Field>

            {isAparelho && (
              <>
                <Field label="IMEI">
                  <Input
                    className="glass-input"
                    value={form.imei}
                    onChange={(e) => setForm({ ...form, imei: e.target.value })}
                  />
                </Field>

                <Field label="IMEI 2">
                  <Input
                    className="glass-input"
                    value={form.imei2}
                    onChange={(e) => setForm({ ...form, imei2: e.target.value })}
                  />
                </Field>

                <Field label="Modelo Aparelho" required>
                  <OpcaoCombobox
                    table="modelos"
                    value={form.modelo}
                    onChange={(nome) => setForm({ ...form, modelo: nome })}
                    placeholder="Buscar"
                  />
                </Field>

                <Field label="GB">
                  <Select
                    value={form.gb || undefined}
                    onValueChange={(v) => setForm({ ...form, gb: v })}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {["32", "64", "128", "256", "512", "1 TB"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Serial Number">
                  <Input
                    className="glass-input"
                    value={form.serial_number}
                    onChange={(e) =>
                      setForm({ ...form, serial_number: e.target.value })
                    }
                  />
                </Field>

                <Field label="Memória RAM">
                  <Select
                    value={form.memoria_ram || undefined}
                    onValueChange={(v) => setForm({ ...form, memoria_ram: v })}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {["4", "8", "16", "32", "64"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Cor">
                  <OpcaoCombobox
                    table="cores"
                    value={form.cor}
                    onChange={(nome) => setForm({ ...form, cor: nome })}
                  />
                </Field>

                <Field label="Saúde bateria">
                  <Input
                    className="glass-input"
                    value={form.saude_bateria}
                    onChange={(e) =>
                      setForm({ ...form, saude_bateria: e.target.value })
                    }
                  />
                </Field>

                <Field label="Ciclo bateria">
                  <Input
                    className="glass-input"
                    value={form.ciclo_bateria}
                    onChange={(e) =>
                      setForm({ ...form, ciclo_bateria: e.target.value })
                    }
                  />
                </Field>

                <Field label="Estado do Aparelho">
                  <Select
                    value={form.estado_aparelho || undefined}
                    onValueChange={(v) => setForm({ ...form, estado_aparelho: v })}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Lacrado", "Novo", "Seminovo"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="hidden md:block" />
              </>
            )}

            <Field label="Quantidade mínima">
              <Input
                type="number"
                min="0"
                step="1"
                className="glass-input"
                value={form.quantidade_minima}
                onChange={(e) =>
                  setForm({ ...form, quantidade_minima: e.target.value })
                }
              />
            </Field>

            <Field label="Custo unitário (R$)" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="glass-input"
                value={form.preco_custo}
                onChange={(e) =>
                  setForm({ ...form, preco_custo: e.target.value })
                }
                placeholder="0,00"
              />
            </Field>

            <Field label="🏪 Quantidade em loja" required>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className="glass-input"
                value={form.estoque}
                onChange={(e) => setForm({ ...form, estoque: e.target.value })}
              />
            </Field>

            <Field label="🚚 Quantidade em transporte" required>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className="glass-input"
                value={form.estoque_transporte}
                onChange={(e) => setForm({ ...form, estoque_transporte: e.target.value })}
              />
            </Field>

            <div className="md:col-span-2 text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              💡 Você pode dividir o lote entre <strong>loja</strong> (já chegou) e <strong>transporte</strong> (a caminho). Apenas unidades em loja podem ser vendidas no PDV. Você pode mover unidades depois com os botões 🏪 / 🚚.
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={salvando}
              className="border border-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground btn-glow"
            >
              {salvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ENTRADA DE ESTOQUE */}
      <Dialog
        open={!!entradaProduto}
        onOpenChange={(o) => !o && setEntradaProduto(null)}
      >
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Entrada de estoque</DialogTitle>
            <DialogDescription>
              {entradaProduto?.nome}
            </DialogDescription>
          </DialogHeader>

          {entradaProduto && (() => {
            const qtdNova = parseInt(entradaQtd, 10) || 0;
            const custoNovo = Number(entradaCusto) || 0;
            const lojaAtual = entradaProduto.estoque ?? 0;
            const transpAtual = entradaProduto.estoque_transporte ?? 0;
            const totalAtual = lojaAtual + transpAtual;
            const medioAtual = Number(entradaProduto.preco_custo ?? 0);
            const novoTotal = totalAtual + qtdNova;
            const previewMedio =
              novoTotal > 0
                ? (medioAtual * totalAtual + custoNovo * qtdNova) / novoTotal
                : 0;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-emerald-400/80">🏪 Em loja</p>
                    <p className="text-base font-semibold">{lojaAtual}</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-yellow-400/80">🚚 Em transporte</p>
                    <p className="text-base font-semibold">{transpAtual}</p>
                  </div>
                </div>

                <Field label="Destino do lote" required>
                  <div className="grid grid-cols-2 gap-2">
                    {(["loja", "transporte"] as const).map((d) => {
                      const ativo = entradaDestino === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setEntradaDestino(d)}
                          className={`py-2 rounded-lg border text-sm transition-colors ${
                            ativo
                              ? d === "loja"
                                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                                : "bg-yellow-500/15 border-yellow-500/50 text-yellow-300"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          {d === "loja" ? "🏪 Em loja" : "🚚 Em transporte"}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Quantidade comprada" required>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="glass-input"
                    value={entradaQtd}
                    onChange={(e) => setEntradaQtd(e.target.value)}
                  />
                </Field>

                <Field label="Custo unitário (R$)" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="glass-input"
                    value={entradaCusto}
                    onChange={(e) => setEntradaCusto(e.target.value)}
                    placeholder="0,00"
                  />
                </Field>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total no estoque</span>
                    <span className="font-semibold">{novoTotal}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Novo preço médio</span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatBRL(previewMedio)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => setEntradaProduto(null)}
              disabled={entradaSalvando}
              className="border border-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarEntrada}
              disabled={entradaSalvando}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground btn-glow"
            >
              {entradaSalvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirmar entrada"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL MOVER UNIDADES */}
      <Dialog
        open={!!moverProduto}
        onOpenChange={(o) => !o && setMoverProduto(null)}
      >
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              {moverDirecao === "para_loja"
                ? "Marcar como chegou na loja"
                : "Mover para transporte"}
            </DialogTitle>
            <DialogDescription>{moverProduto?.nome}</DialogDescription>
          </DialogHeader>
          {moverProduto && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400/80">🏪 Em loja</p>
                  <p className="text-base font-semibold">{moverProduto.estoque ?? 0}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400/80">🚚 Em transporte</p>
                  <p className="text-base font-semibold">{moverProduto.estoque_transporte ?? 0}</p>
                </div>
              </div>
              <Field
                label={
                  moverDirecao === "para_loja"
                    ? "Quantas unidades chegaram?"
                    : "Quantas unidades mover para transporte?"
                }
                required
              >
                <Input
                  type="number"
                  min="1"
                  step="1"
                  className="glass-input"
                  value={moverQtd}
                  onChange={(e) => setMoverQtd(e.target.value)}
                />
              </Field>
            </div>
          )}
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => setMoverProduto(null)}
              disabled={moverSalvando}
              className="border border-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarMover}
              disabled={moverSalvando}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground btn-glow"
            >
              {moverSalvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR EXCLUSÃO */}
      <AlertDialog
        open={!!removerId}
        onOpenChange={(o) => !o && setRemoverId(null)}
      >
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppBackground>
  );
};

export default Produtos;
