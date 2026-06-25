import { createClient } from "@/lib/supabase/server";
import { PortariaClient } from "@/components/portaria/PortariaClient";
import { ShieldCheck } from "lucide-react";

export default async function PortariaPage() {
  const supabase = await createClient();

  // ── Usuário logado para registrar como responsável do check-in ─────────────
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = (await supabase
    .from("users")
    .select("nome, email")
    .eq("auth_id", user?.id ?? "")
    .maybeSingle()) as any;

  const userName: string =
    userRecord?.nome || userRecord?.email || user?.email || "Portaria";

  // ── Eventos dos últimos 30 dias + futuros (evita poluição de 2025) ────────────
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: eventos } = (await supabase
    .from("eventos")
    .select("id, nome, data_inicio")
    .eq("ativo", true)
    .gte("data_inicio", trintaDiasAtras)
    .order("data_inicio", { ascending: true })
    .limit(20)) as any;

  return (
    <div className="space-y-5 w-full max-w-2xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest">Operacional</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Portaria
          </h1>
        </div>
        <span className="ml-auto text-xs text-night-500 hidden sm:block">
          Operador: {userName}
        </span>
      </div>

      {/* ── Cliente ───────────────────────────────────────────────────────── */}
      <PortariaClient eventos={eventos ?? []} userName={userName} />

    </div>
  );
}
