"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, calcStatusFinanceiro } from "@/lib/utils";
import { Search, UserCheck, UserPlus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evento } from "@/types";

// ─── Types locais ─────────────────────────────────────────────────────────────

interface CamaroteOption {
  id: string;
  nome: string;
  capacidade: number;
  preco_base: number;
  localizacao: string | null;
}

interface ClienteFound {
  id: string;
  nome: string;
  telefone: string | null;
}

interface Props {
  eventos: Pick<Evento, "id" | "nome" | "data_inicio">[];
}

const BLOQUEIO = ["pendente", "confirmado", "confirmada", "reservado"];

const FORMAS_PAG = [
  { value: "pix",            label: "PIX"          },
  { value: "dinheiro",       label: "Dinheiro"      },
  { value: "cartao_credito", label: "Cartão"        },
  { value: "transferencia",  label: "Transferência" },
  { value: "network",        label: "Network"       },
  { value: "socio",          label: "Sócio"         },
  { value: "permuta",        label: "Permuta"       },
  { value: "cortesia",       label: "Cortesia"      },
];

const SOCIOS = [
  "Márcio", "Ronaldo Jr", "Tuka", "Lukka", "João Henrique",
  "Vitor Hugo", "Bruno Alex", "Leonardo Andrade", "Neto Bueno",
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReservaRapida({ eventos }: Props) {
  const router = useRouter();
  const supabase = createClient() as any;

  // ── State ──────────────────────────────────────────────────────────────────

  const [eventoId,       setEventoId]       = useState(eventos[0]?.id ?? "");
  const [camarotes,      setCamarotes]       = useState<CamaroteOption[]>([]);
  const [blockedIds,     setBlockedIds]      = useState<Set<string>>(new Set());
  const [loadingCams,    setLoadingCams]     = useState(false);
  const [camaroteId,     setCamaroteId]      = useState("");
  const [telefone,       setTelefone]        = useState("");
  const [buscando,       setBuscando]        = useState(false);
  const [cliente,        setCliente]         = useState<ClienteFound | null>(null);
  const [isNovo,         setIsNovo]          = useState(false);
  const [nomeNovo,       setNomeNovo]        = useState("");
  const [valorTotal,     setValorTotal]      = useState(0);
  const [formaPag,       setFormaPag]        = useState("");
  const [socioResp,      setSocioResp]       = useState("");
  const [salvando,       setSalvando]        = useState(false);

  // ── Carregar camarotes e bloqueados quando evento muda ─────────────────────

  useEffect(() => {
    if (!eventoId) return;
    setLoadingCams(true);
    setCamaroteId("");
    setBlockedIds(new Set());

    Promise.all([
      supabase
        .from("camarotes")
        .select("id, nome, capacidade, preco_base, localizacao")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("reservas")
        .select("camarote_id")
        .eq("evento_id", eventoId)
        .in("status", BLOQUEIO),
    ]).then(([camRes, resRes]: any[]) => {
      if (camRes.data)  setCamarotes(camRes.data);
      if (resRes.data)  setBlockedIds(new Set(resRes.data.map((r: any) => r.camarote_id)));
      setLoadingCams(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // ── Auto-fill valor ao selecionar camarote ─────────────────────────────────

  useEffect(() => {
    if (!camaroteId) return;
    const cam = camarotes.find((c) => c.id === camaroteId);
    if (cam) setValorTotal(cam.preco_base);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camaroteId]);

  // ── Busca de cliente por telefone ──────────────────────────────────────────

  async function buscarCliente() {
    const digits = telefone.replace(/\D/g, "");
    if (digits.length < 10) return;

    setBuscando(true);
    setCliente(null);
    setIsNovo(false);

    // Tenta busca pelo valor digitado e pelos dígitos puros
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, telefone")
      .or(`telefone.eq.${telefone.trim()},telefone.eq.${digits}`)
      .limit(1)
      .maybeSingle();

    setBuscando(false);

    if (data) {
      setCliente(data);
      setIsNovo(false);
      setNomeNovo("");
    } else {
      setCliente(null);
      setIsNovo(true);
    }
  }

  // ── Salvar reserva ─────────────────────────────────────────────────────────

  async function salvar() {
    if (!eventoId || !camaroteId) {
      toast.error("Selecione evento e camarote.");
      return;
    }
    if (!telefone.trim()) {
      toast.error("Informe o telefone do cliente.");
      return;
    }
    if (isNovo && !nomeNovo.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (!valorTotal || valorTotal <= 0) {
      toast.error("Informe o valor da reserva.");
      return;
    }

    setSalvando(true);
    try {
      let clienteId = cliente?.id;

      // Cadastrar novo cliente se necessário
      if (isNovo) {
        const { data: novo, error: errCli } = await supabase
          .from("clientes")
          .insert({ nome: nomeNovo.trim(), telefone: telefone.trim() || null, ativo: true })
          .select("id")
          .single();
        if (errCli || !novo) {
          toast.error("Erro ao cadastrar cliente.");
          setSalvando(false);
          return;
        }
        clienteId = novo.id;
      }

      // Verificar conflito
      const { data: conflito } = await supabase
        .from("reservas")
        .select("id")
        .eq("camarote_id", camaroteId)
        .eq("evento_id", eventoId)
        .in("status", BLOQUEIO)
        .limit(1);

      if (conflito && conflito.length > 0) {
        toast.error("Este camarote já possui reserva ativa para este evento.");
        setSalvando(false);
        return;
      }

      // Criar reserva
      const { data: nova, error: errRes } = await supabase
        .from("reservas")
        .insert({
          evento_id:        eventoId,
          camarote_id:      camaroteId,
          cliente_id:       clienteId,
          valor_total:      valorTotal,
          valor_sinal:      0,
          desconto_pct:     0,
          num_pessoas:      1,
          status:           "pendente",
          forma_pagamento:  formaPag || null,
          socio_responsavel: (formaPag === "socio" && socioResp) ? socioResp : null,
          status_financeiro: calcStatusFinanceiro(formaPag, valorTotal, 0),
        })
        .select("id")
        .single();

      if (errRes || !nova) {
        toast.error("Erro ao criar reserva.");
        setSalvando(false);
        return;
      }

      toast.success("Reserva criada com sucesso!");
      router.push(`/dashboard/reservas/${nova.id}`);
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setSalvando(false);
    }
  }

  const podeSalvar =
    eventoId &&
    camaroteId &&
    telefone.trim() &&
    (cliente || (isNovo && nomeNovo.trim())) &&
    valorTotal > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7">

      {/* ── 1. Evento ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-night-400">
          1 · Evento
        </h2>
        {eventos.length === 0 ? (
          <p className="text-night-500 text-sm py-2">Nenhum evento futuro disponível.</p>
        ) : (
          <select
            value={eventoId}
            onChange={(e) => { setEventoId(e.target.value); setCamaroteId(""); }}
            className="input-base text-base py-3"
          >
            <option value="">Selecionar evento…</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {formatDate(e.data_inicio)} · {e.nome}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* ── 2. Camarote ────────────────────────────────────────────────────── */}
      {eventoId && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-night-400 flex items-center gap-2">
            2 · Camarote
            {blockedIds.size > 0 && (
              <span className="text-amber-400/70 normal-case font-normal">
                · {blockedIds.size} ocupado{blockedIds.size !== 1 ? "s" : ""}
              </span>
            )}
          </h2>

          {loadingCams ? (
            <p className="text-night-500 text-sm py-4 text-center">Verificando disponibilidade…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {camarotes.map((cam) => {
                const bloqueado = blockedIds.has(cam.id);
                const selecionado = camaroteId === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    disabled={bloqueado}
                    onClick={() => setCamaroteId(cam.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      bloqueado
                        ? "border-night-700 bg-night-800/40 opacity-40 cursor-not-allowed"
                        : selecionado
                        ? "border-brand-500 bg-brand-500/15"
                        : "border-night-700 bg-night-800 hover:border-night-600 active:scale-95"
                    )}
                  >
                    {cam.localizacao && (
                      <p className="text-[10px] text-night-500 leading-none mb-1 truncate">
                        {cam.localizacao}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-white leading-tight">{cam.nome}</p>
                    <p className={`text-[11px] mt-1 ${bloqueado ? "text-red-400" : "text-brand-400"}`}>
                      {bloqueado ? "Ocupado" : formatCurrency(cam.preco_base)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 3. Cliente ─────────────────────────────────────────────────────── */}
      {camaroteId && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-night-400">
            3 · Cliente
          </h2>

          <div className="flex gap-2">
            <input
              type="tel"
              value={telefone}
              onChange={(e) => {
                setTelefone(e.target.value);
                setCliente(null);
                setIsNovo(false);
              }}
              onBlur={buscarCliente}
              placeholder="(11) 99999-9999"
              className="input-base flex-1 text-base py-3"
            />
            <button
              type="button"
              onClick={buscarCliente}
              disabled={buscando}
              className="btn-secondary px-4 shrink-0 min-h-[46px]"
            >
              {buscando ? (
                <span className="text-xs text-night-400">…</span>
              ) : (
                <Search size={17} />
              )}
            </button>
          </div>

          {/* Cliente encontrado */}
          {cliente && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
              <UserCheck size={20} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{cliente.nome}</p>
                <p className="text-night-400 text-xs mt-0.5">Cliente encontrado</p>
              </div>
            </div>
          )}

          {/* Novo cliente */}
          {isNovo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                <UserPlus size={14} className="shrink-0" />
                <span>Novo cliente · será cadastrado automaticamente</span>
              </div>
              <input
                type="text"
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                placeholder="Nome completo"
                className="input-base text-base py-3"
                autoFocus
              />
            </div>
          )}
        </section>
      )}

      {/* ── 4. Valor ───────────────────────────────────────────────────────── */}
      {(cliente || (isNovo && nomeNovo.trim())) && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-night-400">
            4 · Valor negociado
          </h2>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-night-400 text-sm font-medium">
              R$
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={valorTotal || ""}
              onChange={(e) => setValorTotal(Number(e.target.value))}
              placeholder="0,00"
              className="input-base pl-10 text-base text-lg font-semibold py-3"
            />
          </div>
        </section>
      )}

      {/* ── 5. Pagamento ───────────────────────────────────────────────────── */}
      {(cliente || (isNovo && nomeNovo.trim())) && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-night-400">
            5 · Forma de pagamento
          </h2>

          <select
            value={formaPag}
            onChange={(e) => { setFormaPag(e.target.value); setSocioResp(""); }}
            className="input-base text-base py-3"
          >
            <option value="">Selecionar…</option>
            {FORMAS_PAG.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Sócio responsável — aparece apenas quando forma = sócio */}
          {formaPag === "socio" && (
            <select
              value={socioResp}
              onChange={(e) => setSocioResp(e.target.value)}
              className="input-base text-base py-3"
            >
              <option value="">Selecionar sócio responsável…</option>
              {SOCIOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </section>
      )}

      {/* ── Salvar ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={salvar}
        disabled={!podeSalvar || salvando}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold transition-all",
          podeSalvar && !salvando
            ? "bg-brand-500 hover:bg-brand-600 text-white active:scale-[0.98]"
            : "bg-night-700 text-night-500 cursor-not-allowed"
        )}
      >
        <Zap size={18} />
        {salvando ? "Salvando…" : "Salvar Reserva"}
      </button>

    </div>
  );
}
