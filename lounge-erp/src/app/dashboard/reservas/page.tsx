import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, STATUS_CONFIG } from "@/lib/utils";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import type { ReservaStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

const STATUS_TABS: { value: ReservaStatus | ""; label: string }[] = [
  { value: "",           label: "Todas"      },
  { value: "livre",      label: "Livre"      },
  { value: "pendente",   label: "Pendente"   },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado",  label: "Cancelado"  },
];

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status ?? "") as ReservaStatus | "";
  const supabase = await createClient();

  let q = supabase
    .from("reservas")
    .select(
      "*, cliente:clientes(nome, telefone), camarate:camarotes(nome), evento:eventos(nome, data_inicio)"
    )
    .order("created_at", { ascending: false });

  if (statusFilter) {
    q = q.eq("status", statusFilter);
  }

  const { data: reservas } = await q.limit(200);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Reservas</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/reservas/rapida"
            className="btn-secondary flex items-center gap-1.5"
            title="Reserva Rápida — menos de 30 segundos"
          >
            <Zap size={15} />
            <span>Rápida</span>
          </Link>
          <Link href="/dashboard/reservas/nova" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Nova reserva</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </div>
      </div>

      {/* ── Filtros (scrollável no mobile) ────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1 bg-night-800 border border-night-700 rounded-xl p-1 w-max sm:w-fit">
          {STATUS_TABS.map(({ value, label }) => (
            <Link
              key={value}
              href={value ? `/dashboard/reservas?status=${value}` : "/dashboard/reservas"}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* ── Listagem ──────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-night-700">
          <span className="text-night-400 text-sm">
            {reservas?.length ?? 0} reserva{(reservas?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {reservas && reservas.length > 0 ? (
          <>
            {/* ── Cards mobile (< lg) ──────────────────────────────────────── */}
            <div className="divide-y divide-night-700/50 lg:hidden">
              {reservas.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/dashboard/reservas/${r.id}`}
                  className="flex items-start justify-between gap-3 p-4 active:bg-night-700/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded shrink-0">
                        {r.codigo}
                      </span>
                      <StatusBadge status={r.status as ReservaStatus} />
                    </div>
                    <p className="text-white text-sm font-medium truncate">{r.cliente?.nome ?? "—"}</p>
                    <p className="text-night-400 text-xs mt-0.5 truncate">
                      {r.camarate?.nome ?? "—"}
                      {r.evento?.nome ? ` · ${r.evento.nome}` : ""}
                    </p>
                    {r.evento?.data_inicio && (
                      <p className="text-night-500 text-xs mt-0.5">{formatDate(r.evento.data_inicio)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">{formatCurrency(r.valor_total)}</p>
                    <p className="text-night-500 text-xs mt-0.5">{r.num_pessoas} pax</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Tabela desktop (≥ lg) ─────────────────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="text-night-400 text-xs uppercase tracking-wide border-b border-night-700">
                    <th className="text-left px-6 py-3 font-medium">Cód.</th>
                    <th className="text-left px-6 py-3 font-medium">Cliente</th>
                    <th className="text-left px-6 py-3 font-medium">Camarote</th>
                    <th className="text-left px-6 py-3 font-medium">Evento</th>
                    <th className="text-left px-6 py-3 font-medium">Pessoas</th>
                    <th className="text-left px-6 py-3 font-medium">Valor</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-right px-6 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-700/50">
                  {reservas.map((r: any) => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                          {r.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-white font-medium">{r.cliente?.nome ?? "—"}</p>
                        {r.cliente?.telefone && (
                          <p className="text-xs text-night-500">{r.cliente.telefone}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300">{r.camarate?.nome ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-night-300">{r.evento?.nome ?? "—"}</p>
                        {r.evento?.data_inicio && (
                          <p className="text-xs text-night-500">{formatDate(r.evento.data_inicio)}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300 text-center">{r.num_pessoas}</td>
                      <td className="px-6 py-3.5 text-sm text-white font-medium">{formatCurrency(r.valor_total)}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={r.status as ReservaStatus} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/dashboard/reservas/${r.id}`}
                          className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-4 sm:px-6 py-16 text-center">
            <p className="text-night-500 text-sm">
              {statusFilter
                ? `Nenhuma reserva com status "${STATUS_CONFIG[statusFilter]?.label}".`
                : "Nenhuma reserva ainda."}
            </p>
            {!statusFilter && (
              <Link href="/dashboard/reservas/nova" className="btn-primary inline-flex mt-4 text-xs">
                Criar primeira reserva
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
