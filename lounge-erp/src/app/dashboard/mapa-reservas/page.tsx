import { createClient } from "@/lib/supabase/server";
import { MapaReservasClient } from "@/components/calendar/MapaReservasClient";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";

export default async function MapaReservasPage() {
  const supabase = await createClient();

  const [{ data: camarotes }, { data: eventos }] = await Promise.all([
    supabase
      .from("camarotes")
      .select("id, nome, capacidade, preco_base, localizacao, andar")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("eventos")
      .select("id, nome, data_inicio")
      .eq("ativo", true)
      .order("data_inicio"),
  ]);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Operacional</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Mapa de Reservas
          </h1>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/reservas/rapida"
            className="btn-primary flex items-center gap-1.5"
            title="Reserva Rápida — menos de 30 segundos"
          >
            <Zap size={15} />
            <span className="hidden sm:inline">Reserva Rápida</span>
            <span className="sm:hidden">Rápida</span>
          </Link>
          <Link
            href="/dashboard/eventos/novo"
            className="btn-secondary flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Novo evento</span>
          </Link>
        </div>
      </div>

      {/* ── Legenda de cores ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-night-400">
        {[
          { dot: "bg-emerald-400", label: "Livre"     },
          { dot: "bg-amber-400",   label: "Pendente"  },
          { dot: "bg-red-400",     label: "Reservado" },
          { dot: "bg-night-600",   label: "Realizado" },
        ].map(({ dot, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Mapa ──────────────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-6">
        <MapaReservasClient
          camarotes={camarotes ?? []}
          eventos={eventos ?? []}
        />
      </div>
    </div>
  );
}
