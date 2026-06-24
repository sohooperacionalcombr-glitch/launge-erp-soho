"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatCurrency, formatDate, STATUS_CONFIG } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ReservaStatus } from "@/types";

interface Camarate { id: string; nome: string; capacidade: number; preco_base: number }
interface Evento   { id: string; nome: string; data_inicio: string; data_fim: string | null }
interface Reserva  {
  id: string; camarate_id: string; evento_id: string; cliente_id: string;
  status: string; num_pessoas: number; valor_total: number; codigo: string;
  cliente?: { nome: string } | null;
  camarate?: { nome: string } | null;
}

interface Props {
  camarotes: Camarate[];
  eventos: Evento[];
  reservas: Reserva[];
}

export function CalendarioClient({ camarotes, eventos, reservas }: Props) {
  const [selectedEvento, setSelectedEvento] = useState<string>(eventos[0]?.id ?? "");
  const [selectedCell, setSelectedCell] = useState<{ camarateId: string; eventoId: string } | null>(null);

  const eventoAtual = eventos.find((e) => e.id === selectedEvento);

  // Map: eventoId + camarateId → reserva
  const reservaMap = useMemo(() => {
    const map = new Map<string, Reserva>();
    for (const r of reservas) {
      map.set(`${r.evento_id}:${r.camarate_id}`, r);
    }
    return map;
  }, [reservas]);

  // Stats for the selected event
  const eventStats = useMemo(() => {
    if (!selectedEvento) return { total: 0, confirmados: 0, pendentes: 0, livres: 0 };
    const eventReservas = reservas.filter((r) => r.evento_id === selectedEvento);
    return {
      total: camarotes.length,
      confirmados: eventReservas.filter((r) => r.status === "confirmado").length,
      pendentes: eventReservas.filter((r) => r.status === "pendente").length,
      livres: camarotes.length - eventReservas.length,
    };
  }, [selectedEvento, reservas, camarotes]);

  const selectedReserva = selectedCell
    ? reservaMap.get(`${selectedCell.eventoId}:${selectedCell.camarateId}`)
    : null;

  const selectedCamarate = selectedCell
    ? camarotes.find((c) => c.id === selectedCell.camarateId)
    : null;

  // Navigate events
  const eventoIdx = eventos.findIndex((e) => e.id === selectedEvento);
  const prevEvento = eventos[eventoIdx - 1];
  const nextEvento = eventos[eventoIdx + 1];

  const grupos = {
    Gold: camarotes.filter((c) => c.nome.startsWith("Gold")),
    "Dom Julio": camarotes.filter((c) => c.nome.startsWith("Dom Julio")),
    Lounge: camarotes.filter((c) => c.nome.startsWith("Lounge")),
  };

  function getCellStatus(camarateId: string, eventoId: string): ReservaStatus {
    const r = reservaMap.get(`${eventoId}:${camarateId}`);
    return (r?.status as ReservaStatus) ?? "livre";
  }

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => prevEvento && setSelectedEvento(prevEvento.id)}
            disabled={!prevEvento}
            className="p-1.5 rounded-lg hover:bg-night-700 text-night-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {eventos.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setSelectedEvento(e.id); setSelectedCell(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedEvento === e.id
                      ? "bg-brand-500 text-white"
                      : "text-night-400 hover:text-white hover:bg-night-700"
                  }`}
                >
                  <span>{e.nome}</span>
                  <span className="block text-xs opacity-70">{formatDate(e.data_inicio)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => nextEvento && setSelectedEvento(nextEvento.id)}
            disabled={!nextEvento}
            className="p-1.5 rounded-lg hover:bg-night-700 text-night-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Event stats */}
      {eventoAtual && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",       value: eventStats.total,       color: "text-white" },
            { label: "Livres",      value: eventStats.livres,      color: "text-emerald-400" },
            { label: "Pendentes",   value: eventStats.pendentes,   color: "text-amber-400" },
            { label: "Confirmados", value: eventStats.confirmados, color: "text-brand-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-night-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main grid + detail panel */}
      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 space-y-6">
          {Object.entries(grupos).map(([grupo, items]) =>
            items.length === 0 ? null : (
              <div key={grupo}>
                <h3 className="text-night-400 text-xs uppercase tracking-widest mb-3">{grupo}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((cam) => {
                    const status = getCellStatus(cam.id, selectedEvento);
                    const config = STATUS_CONFIG[status];
                    const reserva = reservaMap.get(`${selectedEvento}:${cam.id}`);
                    const isSelected =
                      selectedCell?.camarateId === cam.id &&
                      selectedCell?.eventoId === selectedEvento;

                    return (
                      <button
                        key={cam.id}
                        onClick={() =>
                          setSelectedCell(
                            isSelected ? null : { camarateId: cam.id, eventoId: selectedEvento }
                          )
                        }
                        className={`
                          card p-4 text-left transition-all cursor-pointer
                          ${isSelected ? "border-brand-500 ring-1 ring-brand-500/50" : "hover:border-night-600"}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          <span className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="font-medium text-white text-sm">{cam.nome}</p>
                        {reserva && (
                          <p className="text-night-400 text-xs mt-1 truncate">
                            {reserva.cliente?.nome ?? "—"}
                          </p>
                        )}
                        <p className="text-night-500 text-xs mt-2">
                          {formatCurrency(cam.preco_base)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        {/* Detail panel */}
        {selectedCell && (
          <div className="w-72 shrink-0">
            <div className="card p-5 sticky top-6">
              <h3 className="font-display font-semibold text-white text-lg mb-1">
                {selectedCamarate?.nome}
              </h3>
              <p className="text-night-400 text-xs mb-4">
                {eventoAtual?.nome} · {eventoAtual && formatDate(eventoAtual.data_inicio)}
              </p>

              {selectedReserva ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={selectedReserva.status as ReservaStatus} />
                    <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      {selectedReserva.codigo}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-night-400">Cliente</span>
                      <span className="text-white font-medium">{selectedReserva.cliente?.nome ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-night-400">Pessoas</span>
                      <span className="text-white">{selectedReserva.num_pessoas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-night-400">Valor</span>
                      <span className="text-brand-400 font-semibold">{formatCurrency(selectedReserva.valor_total)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/reservas/${selectedReserva.id}`}
                    className="btn-primary w-full text-center block text-sm"
                  >
                    Ver / Editar reserva
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                    <p className="text-emerald-400 text-xs font-medium">Livre</p>
                    <p className="text-night-300 text-xs mt-0.5">
                      Capacidade: {selectedCamarate?.capacidade} pessoas
                    </p>
                    <p className="text-night-300 text-xs">
                      Preço base: {formatCurrency(selectedCamarate?.preco_base ?? 0)}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/reservas/nova?camarate=${selectedCell.camarateId}&evento=${selectedCell.eventoId}`}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    Reservar agora
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-night-400">
        <span className="font-medium uppercase tracking-wide">Legenda:</span>
        {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
            {conf.label}
          </span>
        ))}
      </div>
    </div>
  );
}
