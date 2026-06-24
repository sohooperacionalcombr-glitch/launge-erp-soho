import { createClient } from "@/lib/supabase/server";
import { formatDate, getEventoStatus, EVENTO_STATUS_CONFIG } from "@/lib/utils";
import { Plus, Edit3, CalendarCheck, CalendarClock, CalendarX } from "lucide-react";
import Link from "next/link";
import type { EventoStatus } from "@/types";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type FilterValue = EventoStatus | "";

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "",          label: "Todos"      },
  { value: "ativo",     label: "Ativos"     },
  { value: "realizado", label: "Realizados" },
  { value: "cancelado", label: "Cancelados" },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status ?? "") as FilterValue;

  const supabase = await createClient();
  const { data: raw } = (await supabase
    .from("eventos")
    .select("*")
    .order("data_inicio", { ascending: false })) as any;

  const now = new Date();

  // Computar status de cada evento
  const todos: any[] = (raw ?? []).map((e: any) => ({
    ...e,
    computedStatus: getEventoStatus(e, now),
  }));

  // Contadores por status
  const countAtivo     = todos.filter((e) => e.computedStatus === "ativo").length;
  const countRealizado = todos.filter((e) => e.computedStatus === "realizado").length;
  const countCancelado = todos.filter((e) => e.computedStatus === "cancelado").length;

  // Aplicar filtro
  const eventos = statusFilter
    ? todos.filter((e) => e.computedStatus === statusFilter)
    : todos;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Eventos</h1>
        </div>
        <Link href="/dashboard/eventos/novo" className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Novo evento</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* ── Contadores ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0">
            <CalendarCheck size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{countAtivo}</p>
            <p className="text-night-400 text-xs mt-0.5">Eventos Ativos</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-400/10 flex items-center justify-center shrink-0">
            <CalendarClock size={18} className="text-sky-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{countRealizado}</p>
            <p className="text-night-400 text-xs mt-0.5">Eventos Realizados</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center shrink-0">
            <CalendarX size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{countCancelado}</p>
            <p className="text-night-400 text-xs mt-0.5">Eventos Cancelados</p>
          </div>
        </div>
      </div>

      {/* ── Filtros (scrollável no mobile) ──────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1 bg-night-800 border border-night-700 rounded-xl p-1 w-max sm:w-fit">
        {FILTER_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/dashboard/eventos?status=${value}` : "/dashboard/eventos"}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === value
                ? "bg-brand-500 text-white"
                : "text-night-400 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-night-700">
          <span className="text-night-400 text-sm">
            {eventos.length} evento{eventos.length !== 1 ? "s" : ""}
            {statusFilter && (
              <span className={`ml-2 text-xs font-medium ${EVENTO_STATUS_CONFIG[statusFilter as EventoStatus].color}`}>
                · {EVENTO_STATUS_CONFIG[statusFilter as EventoStatus].label}
              </span>
            )}
          </span>
        </div>

        {eventos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-night-400 text-xs uppercase tracking-wide border-b border-night-700">
                  <th className="text-left px-6 py-3 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 font-medium">Descrição</th>
                  <th className="text-left px-6 py-3 font-medium">Início</th>
                  <th className="text-left px-6 py-3 font-medium">Fim</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-700/50">
                {eventos.map((evento: any) => {
                  const cfg = EVENTO_STATUS_CONFIG[evento.computedStatus as EventoStatus];
                  return (
                    <tr key={evento.id} className="table-row-hover">
                      <td className="px-6 py-3.5 text-sm text-white font-medium">
                        {evento.nome}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300 truncate max-w-xs">
                        {evento.descricao ?? "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300">
                        {formatDate(evento.data_inicio)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300">
                        {evento.data_fim ? formatDate(evento.data_fim) : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/dashboard/eventos/${evento.id}`}
                          className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                        >
                          <Edit3 size={14} />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-night-500 text-sm">
              {statusFilter
                ? `Nenhum evento com status "${EVENTO_STATUS_CONFIG[statusFilter as EventoStatus]?.label}".`
                : "Nenhum evento cadastrado ainda."}
            </p>
            {!statusFilter && (
              <Link href="/dashboard/eventos/novo" className="btn-primary inline-flex mt-4 text-xs">
                Criar primeiro evento
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
