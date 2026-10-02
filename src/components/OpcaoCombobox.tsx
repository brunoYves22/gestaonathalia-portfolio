import { useEffect, useState } from "react";
import { Check, ChevronDown, Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Opcao = { id: string; nome: string };

// Tabelas suportadas pelo combobox de opções dinâmicas
type TabelaOpcao = "tipos_produto" | "cores" | "modelos";

interface Props {
  table: TabelaOpcao;
  value: string;
  onChange: (nome: string) => void;
  placeholder?: string;
}

export const OpcaoCombobox = ({
  table,
  value,
  onChange,
  placeholder = "Selecionar",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [adicionando, setAdicionando] = useState(false);

  const fetchOpcoes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("nome");
    if (error) toast.error("Erro ao carregar opções");
    setOpcoes((data as Opcao[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOpcoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const filtrados = opcoes.filter((t) =>
    t.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  const adicionarNovo = async () => {
    const nome = busca.trim();
    if (!nome) {
      toast.error("Digite um nome");
      return;
    }
    setAdicionando(true);
    const { error } = await supabase.from(table).insert({ nome });
    setAdicionando(false);
    if (error) {
      toast.error(
        error.code === "23505" ? "Esta opção já existe" : "Erro ao adicionar"
      );
      return;
    }
    toast.success("Adicionado");
    setBusca("");
    await fetchOpcoes();
    onChange(nome);
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "glass-input flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronDown className="w-4 h-4 opacity-60 shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="glass border-white/10 p-0 w-[--radix-popover-trigger-width] min-w-[240px]"
          align="start"
        >
          <div className="relative p-2 border-b border-white/10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar ou criar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtrados.length === 0) {
                  e.preventDefault();
                  adicionarNovo();
                }
              }}
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
                onClick={adicionarNovo}
                disabled={adicionando || !busca.trim()}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2 text-primary disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {busca.trim() ? `Adicionar "${busca.trim()}"` : "Digite para criar"}
              </button>
            ) : (
              filtrados.map((t) => {
                const selected = value === t.nome;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChange(t.nome);
                      setOpen(false);
                      setBusca("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">{t.nome}</span>
                    {selected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="icon"
        onClick={() => {
          setBusca("");
          setOpen(true);
        }}
        className="h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
        aria-label="Adicionar nova opção"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default OpcaoCombobox;
