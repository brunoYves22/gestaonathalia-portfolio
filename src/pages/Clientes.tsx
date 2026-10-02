import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import AppBackground from "@/components/ui/app-background";
import { toast } from "sonner";

type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
  created_at: string;
};

const Clientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);

  // form
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    document.title = "Clientes | Sistema de Gestão";
    fetch();
  }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clientes").select("*").order("nome");
    if (error) toast.error("Erro ao carregar clientes");
    setClientes((data as Cliente[]) ?? []);
    setLoading(false);
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.cpf ?? "").toLowerCase().includes(q),
    );
  }, [clientes, busca]);

  const abrirNovo = () => {
    setEditando(null);
    setNome(""); setCpf(""); setTelefone(""); setEmail(""); setObservacoes("");
    setOpen(true);
  };

  const abrirEditar = (c: Cliente) => {
    setEditando(c);
    setNome(c.nome);
    setCpf(c.cpf ?? "");
    setTelefone(c.telefone ?? "");
    setEmail(c.email ?? "");
    setObservacoes(c.observacoes ?? "");
    setOpen(true);
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    const payload = {
      nome: nome.trim(),
      cpf: cpf.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      observacoes: observacoes.trim() || null,
    };
    const op = editando
      ? supabase.from("clientes").update(payload).eq("id", editando.id)
      : supabase.from("clientes").insert(payload);
    const { error } = await op;
    setSalvando(false);
    if (error) {
      if (error.code === "23505") toast.error("CPF já cadastrado");
      else toast.error("Erro ao salvar");
      return;
    }
    toast.success(editando ? "Cliente atualizado" : "Cliente cadastrado");
    setOpen(false);
    fetch();
  };

  const excluir = async (c: Cliente) => {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", c.id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Cliente excluído");
      fetch();
    }
  };

  return (
    <AppBackground>
      <main className="min-h-screen px-4 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto">
          <header className="flex items-center justify-between mb-6 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground px-2 sm:px-3"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Clientes</h1>
            <Button
              size="sm"
              onClick={abrirNovo}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground shrink-0"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </header>

          <div className="glass rounded-2xl p-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="glass-input pl-10 h-11"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {filtrados.map((c) => (
                  <li key={c.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.cpf, c.telefone, c.email].filter(Boolean).join(" • ") || "Sem dados adicionais"}
                      </p>
                    </div>
                    <button
                      onClick={() => abrirEditar(c)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluir(c)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="glass-input mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">CPF</label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} className="glass-input mt-1" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Telefone</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="glass-input mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input mt-1" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Observações</label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="glass-input mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={salvando}>Cancelar</Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppBackground>
  );
};

export default Clientes;
