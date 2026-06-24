"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrency,
  calcStatusFinanceiro,
  STATUS_FINANCEIRO_CONFIG,
} from "@/lib/utils";
import {
  Search, CheckCircle2, Clock, Users, Percent,
  ShieldCheck, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventoOption {
  id: string;
  nome: string;
  data_inicio: string;
}

interface ReservaPortaria {
  id: string;
  codigo: string;
  status: string;
  num_pessoas: number;
  promoter_responsavel: string | null;
  socio_responsavel: string | null;
  forma_pagamento: string | null;
  valor_total: number | null;
  valor_recebido: number | null;
  checkin_realizado: boolean | null;
  checkin_horario: string | null;
  checkin_responsavel: string | null;
  cliente: { nome: string; telefone: string | null } | null;
  camarate: { nome: string; localizacao: string | null } | null;
  evento: { nome: string; data_inicio: string } | null;
}

interface Props {
  eventos: EventoOption[];
  userName: string;
}

const STATUS_ATIVOS = ["pendente", "confirmado", "confirmada", "reservado"];

function formatHora(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PortariaClient({ eventos, userName }: Props) {
  const supabase = createClient() as any;

  const [eventoId,    setEventoId]    = useState(eventos[0]?.id ?? "");
  const [reservas,    setReservas]    = useState<ReservaPortaria[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [checkingIn,  setCheckingIn]  = useState<string | null>(null);

  // ── Carregar reservas ao trocar evento ────────────────────────────────────

  function loadReservas(eId: string) {
    if (!eId) { setReservas([]); return; }
    setLoading(true);

    supabase
      .from("reservas")
      .select(
        "id, codigo, status, num_pessoas, promoter_responsavel, socio_responsavel, " +
        "forma_pagamento, valor_total, valor_recebido, " +
        "checkin_realizado, checkin_horario, checkin_responsavel, " +
        "cliente:clientes(nome, telefone), " +
        "camarate:camarotes(nome, localizacao), " +
        "evento:eventos(nome, data_inicio)"
      )
      .eq("evento_id", eId)
      .in("status", STATUS_ATIVOS)
      .order("checkin_realizado", { ascending: true })
      .then(({ data, error }: any) => {
        if (!error && data) setReservas(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadReservas(eventoId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // ── Filtro por busca ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reservas;
    return reservas.filter((r) =>
      r.cliente?.nome?.toLowerCase().includes(q) ||
      r.cliente?.telefone?.includes(q) ||
      r.camarate?.nome?.toLowerCase().includes(q) ||
      r.codigo?.toLowerCase().includes(q) ||
      r.promoter_responsavel?.toLowerCase().includes(q) ||
      r.socio_responsavel?.toLowerCase().includes(q)
    );
  }, [reservas, search]);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const total          = reservas.length;
  const checkinsFeitos = reservas.filter((r) => r.checkin_realizado).length;
  const pendentes      = total - checkinsFeitos;
  const ocupacao       = total > 0 ? Math.round((checkinsFeitos / total) * 100) : 0;

  // ── Check-in ──────────────────────────────────────────────────────────────

  async function handleCheckin(reservaId: string) {
    setCheckingIn(reservaId);
    const horario = new Date().toISOString();
    const { error } = await supabase
      .from("reservas")
      .update({
        checkin_realizado:   true,
        checkin_horario:     horario,
        checkin_responsavel: userName,
      })
      .eq("id", reservaId);

    if (error) {
      toast.error("Erro ao realizar check-in.");
    } else {
      toast.success("Check-in realizado com sucesso!");
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaId
            ? { ...r, checkin_realizado: true, checkin_horario: horario, checkin_responsavel: userName }
            : r
        )
      );
    }
    setCheckingIn(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Seletor de evento ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <select
          value={eventoId}
          onChange={(e) => setEventoId(e.target.value)}
          className="input-base flex-1 text-base py-3"
        >
          <option value="">Selecionar evento…</option>
          {eventos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => loadReservas(eventoId)}
          className="btn-secondary px-4"
          title="Recarregar"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={15} className="text-night-400" />
            <p className="text-night-400 text-xs uppercase tracking-wider">Reservas</p>
          </div>
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-night-500 text-xs mt-0.5">do evento</p>
        </div>

        <div className="card p-4 border-emerald-500/20 bg-emerald-400/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <p className="text-emerald-400 text-xs uppercase tracking-wider">Check-ins</p>
          </div>
          <p className="text-3xl font-bold text-white">{checkinsFeitos}</p>
          <p className="text-night-500 text-xs mt-0.5">realizados</p>
        </div>

        <div className="card p-4 border-amber-500/20 bg-amber-400/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-amber-400" />
            <p className="text-amber-400 text-xs uppercase tracking-wider">Pendentes</p>
          </div>
          <p className="text-3xl font-bold text-white">{pendentes}</p>
          <p className="text-night-500 text-xs mt-0.5">aguardando</p>
        </div>

        <div className="card p-4 border-brand-500/20 bg-brand-400/5">
          <div className="flex items-center gap-2 mb-2">
            <Percent size={15} className="text-brand-400" />
            <p className="text-brand-400 text-xs uppercase tracking-wider">Ocupação</p>
          </div>
          <p className="text-3xl font-bold text-white">{ocupacao}%</p>
          {/* Barra de progresso */}
          <div className="mt-2 h-1.5 bg-night-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${ocupacao}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Busca ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-night-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou camarote…"
          className="input-base pl-10 py-3 text-base"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-night-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Lista de reservas ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-8 text-center text-night-400 text-sm">
          Carregando reservas…
        </div>
      ) : !eventoId ? (
        <div className="card p-8 text-center text-night-500 text-sm">
          Selecione um evento para ver as reservas.
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-night-500 text-sm">
          {search ? "Nenhuma reserva encontrada para esta busca." : "Nenhuma reserva ativa neste evento."}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pendentes primeiro, já realizados depois */}
          {filtered.map((r) => {
            const feito  = !!r.checkin_realizado;
            const sf     = calcStatusFinanceiro(r.forma_pagamento, r.valor_total ?? 0, r.valor_recebido ?? 0);
            const sfCfg  = STATUS_FINANCEIRO_CONFIG[sf];
            const saldo  = Math.max(0, (r.valor_total ?? 0) - (r.valor_recebido ?? 0));
            const isThis = checkingIn === r.id;

            return (
              <div
                key={r.id}
                className={cn(
                  "card p-4 space-y-3 border-2 transition-all",
                  feito
                    ? "border-emerald-500/20 bg-emerald-400/5 opacity-75"
                    : "border-night-700 hover:border-night-600"
                )}
              >
                {/* ── Linha 1: indicador + código ─────────────────────────── */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      feito
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", feito ? "bg-emerald-400" : "bg-amber-400")} />
                    {feito
                      ? `Check-in realizado · ${formatHora(r.checkin_horario)}`
                      : "Aguardando chegada"}
                  </span>
                  <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                    {r.codigo}
                  </span>
                </div>

                {/* ── Linha 2: cliente ──────────────────────────────────── */}
                <div>
                  <p className="text-white font-semibold text-base leading-tight">
                    {r.cliente?.nome ?? "—"}
                  </p>
                  {r.cliente?.telefone && (
                    <a
                      href={`tel:${r.cliente.telefone}`}
                      className="text-brand-400 text-sm hover:text-brand-300"
                    >
                      {r.cliente.telefone}
                    </a>
                  )}
                </div>

                {/* ── Linha 3: camarote · pessoas ───────────────────────── */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-night-300">
                  <span className="font-medium text-white">{r.camarate?.nome ?? "—"}</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-night-500" />
                    {r.num_pessoas} {r.num_pessoas === 1 ? "pessoa" : "pessoas"}
                  </span>
                </div>

                {/* ── Linha 4: financeiro ───────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-white font-medium">{formatCurrency(r.valor_total ?? 0)}</span>
                  {saldo > 0 && (
                    <span className="text-amber-400">saldo {formatCurrency(saldo)}</span>
                  )}
                  {sfCfg && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sfCfg.bg} ${sfCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sfCfg.dot}`} />
                      {sfCfg.label}
                    </span>
                  )}
                </div>

                {/* ── Linha 5: promoter · sócio ─────────────────────────── */}
                {(r.promoter_responsavel || r.socio_responsavel) && (
                  <div className="flex flex-wrap gap-3 text-xs text-night-400">
                    {r.promoter_responsavel && (
                      <span>Promoter: <span className="text-night-300">{r.promoter_responsavel}</span></span>
                    )}
                    {r.socio_responsavel && (
                      <span>Sócio: <span className="text-night-300">{r.socio_responsavel}</span></span>
                    )}
                  </div>
                )}

                {/* ── Check-in realizado por ────────────────────────────── */}
                {feito && r.checkin_responsavel && (
                  <p className="text-[11px] text-night-600">
                    Realizado por: {r.checkin_responsavel}
                  </p>
                )}

                {/* ── Botão de check-in ─────────────────────────────────── */}
                {!feito && (
                  <button
                    type="button"
                    onClick={() => handleCheckin(r.id)}
                    disabled={isThis}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold transition-all",
                      isThis
                        ? "bg-night-700 text-night-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white"
                    )}
                  >
                    <ShieldCheck size={18} />
                    {isThis ? "Registrando…" : "Realizar Check-in"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
