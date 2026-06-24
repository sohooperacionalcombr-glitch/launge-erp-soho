import { createClient } from "@/lib/supabase/server";
import { ReservaRapida } from "@/components/forms/ReservaRapida";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default async function ReservaRapidaPage() {
  const supabase = await createClient();
  const agora = new Date().toISOString();

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, nome, data_inicio")
    .eq("ativo", true)
    .gte("data_inicio", agora)
    .order("data_inicio", { ascending: true });

  return (
    <div className="w-full sm:max-w-lg">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <Link
          href="/dashboard/reservas"
          className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400"
        >
          <ArrowLeft size={15} />
          Voltar
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-brand-400" />
          <p className="text-night-400 text-xs uppercase tracking-widest">Modo rápido</p>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Reserva Rápida
        </h1>
        <p className="text-night-400 text-sm mt-1">
          Reserve um camarote em menos de 30 segundos.
        </p>
      </div>

      {/* ── Formulário ────────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-6">
        <ReservaRapida eventos={eventos ?? []} />
      </div>
    </div>
  );
}
