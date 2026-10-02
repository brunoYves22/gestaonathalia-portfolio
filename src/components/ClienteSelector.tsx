import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, Loader2, X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ClienteLite = { id: string; nome: string; cpf: string | null; telefone: string | null };

interface Props {
  value: ClienteLite | null;
  onChange: (c: ClienteLite | null) => void;
}

export const ClienteSelector = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<ClienteLite[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);

  // Cadastro rápido
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);

  const fetched = useRef(false);

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clientes").select("id,nome,cpf,telefone").order("nome");
    if (error) toast.error("Erro ao carregar clientes");
    setClientes((data as ClienteLite[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && !fetched.current) {
      fetched.current = true;
      fetchClientes();
    }
  }, [open]);

  const filtrados = clientes.filter((c) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return c.nome.toLowerCase().includes(q) || (c.cpf ?? "").toLowerCase().includes(q);
  });

  const abrirCadastro = () => {
    setNome(busca.trim());
    setCpf("");
    setTelefone("");
    setOpen(false);
    setDialogOpen(true);
  };

  const salvarRapido = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: nome.trim(),
        cpf: cpf.trim() || null,
        telefone: telefone.trim() || null,
      })
      .select("id,nome,cpf,telefone")
      .single();
    setSalvando(false);
    if (error) {
      if (error.code === "23505") toast.error("CPF já cadastrado");
      else toast.error("Erro ao cadastrar");
      return;
    }
    toast.success("Cliente cadastrado");
    setClientes((p) => [...p, data as ClienteLite].sort((a, b) => a.nome.localeCompare(b.nome)));
    onChange(data as ClienteLite);
    setDialogOpen(false);
    setBusca("");
  };

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "glass-input flex h-10 flex-1 items-center justify-between rounded-md px-3 py-2 text-sm",
                !value && "text-muted-foreground",
              )}
            >
              <span className="truncate">{value ? value.nome : "Selecionar cliente (opcional)"}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0 ml-2" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="glass border-white/10 p-0 w-[--radix-popover-trigger-width] min-w-[280px]" align="start">
            <div className="relative p-2 border-b border-white/10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="glass-input pl-9 h-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : filtrados.length === 0 ? (
                <button
                  type="button"
                  onClick={abrirCadastro}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2 text-primary"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar {busca.trim() ? `"${busca.trim()}"` : "novo cliente"}
                </button>
              ) : (
                filtrados.map((c) => {
                  const selected = value?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                        setBusca("");
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                        selected ? "bg-primary text-primary-foreground" : "hover:bg-white/5",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate">{c.nome}</p>
                        {c.cpf && <p className="text-[10px] opacity-70 truncate">{c.cpf}</p>}
                      </div>
                      {selected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {value ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(null)}
            className="h-10 w-10 shrink-0 border border-white/10"
            aria-label="Limpar cliente"
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={abrirCadastro}
            className="h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
            aria-label="Cadastrar novo cliente"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Cadastro rápido de cliente</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={salvando}>Cancelar</Button>
            <Button
              onClick={salvarRapido}
              disabled={salvando}
              className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar e selecionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClienteSelector;
