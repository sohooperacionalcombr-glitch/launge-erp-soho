"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calcStatusFinanceiro, STATUS_FINANCEIRO_CONFIG } from "@/lib/utils";
import type { Camarate, Evento, ReservaStatus } from "@/types";

// ─── Cores operacionais do Mapa ───────────────────────────────────────────────
// Verde = Livre · Amarelo = Pendente · Vermelho = Reservado · Cinza = Realizado
const MAPA_CORES: Record<string, {
  border: string; bg: string; text: string; dot: string; label: string;
}> = {
  livre:     { border: "border-emerald-500/40", bg: "bg-emerald-400/5",  text: "text-emerald-400", dot: "bg-emerald-400", label: "Livre"     },
  pendente:  { border: "border-amber-500/50",   bg: "bg-amber-400/8",    text: "text-amber-400",   dot: "bg-amber-400",   label: "Pendente"  },
  confirmado:{ border: "border-red-500/50",     bg: "bg-red-400/8",      text: "text-red-400",     dot: "bg-red-400",     label: "Reservado" },
  cancelado: { border: "border-night-600",      bg: "bg-night-800",      text: "text-night-500",   dot: "bg-night-600",   label: "Realizado" },
};

interface ReservaGridItem {
  id: string;
  camarote_id: string;
  evento_id: string;
  status: ReservaStatus;
  codigo: string;
  cliente: { nome: string; telefone?: string | null } | null;
  valor_total?: number | null;
  valor_sinal?: number | null;
  valor_recebido?: number | null;
  forma_pagamento?: string | null;
  status_financeiro?: string | null;
  socio_responsavel?: string | null;
  observacoes?: string | null;
}

interface Props {
  camarotes: Camarate[];
  eventos: Evento[];
}

// Inclui variantes de status usadas operacionalmente
const STATUS_PRIORITY: Record<string, number> = {
  confirmado: 3,
  confirmada: 3,
  reservado:  3,
  pendente:   2,
  cancelado:  0,
  livre:      0,
};

// Reservas com estes status bloqueiam o camarote para novas reservas
const BLOQUEIO_STATUSES = ["pendente", "confirmado", "confirmada", "reservado"];

export function MapaReservasClient({ camarotes, eventos }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return eventos[0]?.data_inicio?.slice(0, 10) ?? "";
  });
  const [selectedEventoId, setSelectedEventoId] = useState(() => {
    return eventos[0]?.id ?? "";
  });
  const [reservas, setReservas] = useState<ReservaGridItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // refreshKey força re-fetch sem resetar a seleção de evento/data
  const [refreshKey, setRefreshKey] = useState(0);

  const eventosDoDia = useMemo(
    () => eventos.filter((evento) => evento.data_inicio?.slice(0, 10) === selectedDate),
    [eventos, selectedDate]
  );

  useEffect(() => {
    if (!eventosDoDia.length) {
      setSelectedEventoId("");
      return;
    }

    if (!eventosDoDia.some((evento) => evento.id === selectedEventoId)) {
      setSelectedEventoId(eventosDoDia[0].id);
    }
  }, [eventosDoDia, selectedEventoId]);

  useEffect(() => {
    if (!selectedEventoId || !selectedDate) {
      setReservas([]);
      return;
    }

    const supabase = createClient();
    setLoading(true);
    setFetchError(null);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("reservas")
          .select(
            "id, camarote_id, evento_id, status, codigo, valor_total, valor_sinal, valor_recebido, forma_pagamento, status_financeiro, socio_responsavel, observacoes, cliente:clientes(nome, telefone), evento:eventos(data_inicio)"
          )
          .eq("evento_id", selectedEventoId);

        if (error) {
          setFetchError(error.message);
          setReservas([]);
        } else {
          const filtered = data?.filter((r: any) => {
            if (!r.evento?.data_inicio) return false;
            const dataInicio = r.evento.data_inicio.slice(0, 10);
            return dataInicio === selectedDate;
          }) ?? [];
          setReservas(filtered);
        }
      } catch (err) {
        setFetchError((err as Error).message || String(err));
        setReservas([]);
      } finally {
        setLoading(false);
      }
    })();
  // refreshKey incluído para re-disparar o fetch sem mudar evento/data
  }, [selectedEventoId, selectedDate, refreshKey]);

  const reservasPorCamarote = useMemo(() => {
    const map = new Map<string, ReservaGridItem[]>();
    for (const reserva of reservas) {
      const list = map.get(reserva.camarote_id) ?? [];
      list.push(reserva);
      map.set(reserva.camarote_id, list);
    }
    return map;
  }, [reservas]);

  function getReservaStatus(camaroteId: string): ReservaStatus {
    const lista = reservasPorCamarote.get(camaroteId) ?? [];
    // Apenas reservas ativas determinam o status do camarote; canceladas liberam o slot
    const ativas = lista.filter((r) => BLOQUEIO_STATUSES.includes(r.status as string));
    if (ativas.some((r) => ["confirmado", "confirmada", "reservado"].includes(r.status as string))) return "confirmado";
    if (ativas.some((r) => r.status === "pendente")) return "pendente";
    return "livre";
  }

  function getReserva(camaroteId: string) {
    const lista = reservasPorCamarote.get(camaroteId) ?? [];
    // Retorna a melhor reserva ativa; ignora canceladas para fins de exibição
    const ativas = lista.filter((r) => BLOQUEIO_STATUSES.includes(r.status as string));
    return ativas.reduce<ReservaGridItem | null>((best, current) => {
      const pCurrent = STATUS_PRIORITY[current.status as string] ?? 0;
      const pBest    = best ? (STATUS_PRIORITY[best.status as string] ?? 0) : -1;
      return pCurrent > pBest ? current : best;
    }, null);
  }

  const statusCounts = useMemo(() => {
    const counts: Record<ReservaStatus, number> = {
      livre: 0,
      pendente: 0,
      confirmado: 0,
      cancelado: 0,
    };

    for (const camarote of camarotes) {
      const status = getReservaStatus(camarote.id);
      counts[status] += 1;
    }

    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camarotes, reservasPorCamarote]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-night-400">Data do evento</span>
              <input
                type="date"
                className="input-base"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-night-400">Evento</span>
              <select
                className="input-base"
                value={selectedEventoId}
                onChange={(event) => setSelectedEventoId(event.target.value)}
              >
                <option value="" disabled>
                  Selecionar evento…
                </option>
                {eventosDoDia.map((evento) => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
            {(
              [
                { label: "Livre",     value: statusCounts.livre,      color: "text-emerald-400" },
                { label: "Pendente",  value: statusCounts.pendente,   color: "text-amber-400"   },
                { label: "Reservado", value: statusCounts.confirmado, color: "text-red-400"     },
                { label: "Realizado", value: statusCounts.cancelado,  color: "text-night-400"   },
              ] as const
            ).map(({ label, value, color }) => (
              <div key={label} className="card p-3 sm:p-4">
                <p className={`text-xs sm:text-sm font-medium ${color}`}>{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{value}</p>
              </div>
            ))}
          </div>

          <details className="rounded-2xl border border-night-700 bg-night-950 overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-white cursor-pointer select-none list-none flex items-center justify-between">
              Como funciona
              <span className="text-night-500 text-xs">▸</span>
            </summary>
            <ul className="px-4 pb-4 space-y-2 text-sm text-night-400 list-disc list-inside">
              <li>Escolha data e evento para filtrar o mapa.</li>
              <li>O status é calculado apenas pela reserva naquele evento + camarote.</li>
              <li>Camarote livre abre a tela de nova reserva já preenchida.</li>
              <li>Camarote reservado abre os detalhes da reserva.</li>
            </ul>
          </details>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-night-400 text-xs uppercase tracking-widest">Mapa</p>
              <h2 className="text-white text-lg sm:text-xl font-semibold">{camarotes.length} camarotes</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm text-night-400">
                <p>Data selecionada</p>
                <p className="text-white">{selectedDate || "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Atualizar mapa"
                disabled={loading}
                className="p-2 rounded-lg border border-night-700 text-night-400 hover:text-white hover:border-night-600 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="card p-6 text-center text-night-400">Carregando status...</div>
          ) : fetchError ? (
            <div className="card p-6 text-center text-red-400">Erro: {fetchError}</div>
          ) : !selectedEventoId || !selectedDate ? (
            <div className="card p-6 text-center text-night-400">
              Selecione data e evento para ver o mapa operacional.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {camarotes.map((camarote) => {
                const status   = getReservaStatus(camarote.id);
                const reserva  = getReserva(camarote.id);
                const isLivre  = status === "livre";
                const cfg      = MAPA_CORES[status] ?? MAPA_CORES.livre;

                // Clique: Livre/Realizado → Nova Reserva | Pendente/Reservado → Detalhes
                const actionHref = (isLivre || status === "cancelado")
                  ? `/dashboard/reservas/nova?evento_id=${selectedEventoId}&camarote_id=${camarote.id}`
                  : reserva
                  ? `/dashboard/reservas/${reserva.id}`
                  : `/dashboard/reservas/nova?evento_id=${selectedEventoId}&camarote_id=${camarote.id}`;

                return (
                  <Link
                    key={camarote.id}
                    href={actionHref}
                    className={`card p-4 text-left transition-all border-2 active:scale-[0.98] ${cfg.border} ${cfg.bg} hover:brightness-105`}
                  >
                    {/* ── Cabeçalho do card ─────────────────────────────────── */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        {camarote.localizacao && (
                          <p className="text-xs text-night-500 truncate">{camarote.localizacao}</p>
                        )}
                        <h3 className="text-white text-base sm:text-lg font-semibold leading-tight">
                          {camarote.nome}
                        </h3>
                      </div>
                      {/* Badge de status com cor local */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border ${cfg.border} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-night-400 text-xs mb-1">
                      {camarote.capacidade} pessoas · {camarote.preco_base.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>

                    {/* ── Detalhe financeiro da reserva ─────────────────────── */}
                    {reserva ? (
                      <div className="mt-3 rounded-xl bg-night-900/70 p-3 space-y-1.5 text-xs border border-night-700/50">
                        {/* Cliente */}
                        <p className="text-white font-semibold truncate">{reserva.cliente?.nome ?? "—"}</p>
                        {reserva.cliente?.telefone && (
                          <p className="text-night-400">{reserva.cliente.telefone}</p>
                        )}

                        {/* Valores */}
                        <div className="pt-1.5 border-t border-night-700/50 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-night-500">Valor total</span>
                            <span className="text-white font-medium">
                              {reserva.valor_total != null ? formatCurrency(reserva.valor_total) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-night-500">Recebido</span>
                            <span className="text-emerald-400 font-medium">
                              {reserva.valor_recebido != null ? formatCurrency(reserva.valor_recebido) : formatCurrency(0)}
                            </span>
                          </div>
                          {(() => {
                            const saldo = (reserva.valor_total ?? 0) - (reserva.valor_recebido ?? 0);
                            return saldo > 0 ? (
                              <div className="flex justify-between">
                                <span className="text-night-500">Saldo</span>
                                <span className="text-amber-400 font-medium">{formatCurrency(saldo)}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {/* Status financeiro */}
                        {(() => {
                          const sf = calcStatusFinanceiro(
                            reserva.forma_pagamento,
                            reserva.valor_total ?? 0,
                            reserva.valor_recebido ?? 0
                          );
                          const fCfg = STATUS_FINANCEIRO_CONFIG[sf];
                          return fCfg ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${fCfg.bg} ${fCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${fCfg.dot}`} />
                              {fCfg.label}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <p className="text-night-600 text-xs mt-2">Toque para reservar</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
