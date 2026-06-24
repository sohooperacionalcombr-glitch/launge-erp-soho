import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "@/components/calendar/CalendarioClient";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: camarotes }, { data: eventos }, { data: reservas }] =
    await Promise.all([
      supabase.from("camarotes").select("id, nome, capacidade, preco_base").eq("ativo", true).order("nome"),
      supabase.from("eventos").select("id, nome, data_inicio, data_fim").eq("ativo", true).order("data_inicio"),
      supabase
        .from("reservas")
        .select("id, camarate_id, evento_id, cliente_id, status, num_pessoas, valor_total, codigo, cliente:clientes(nome), camarate:camarotes(nome)")
        .not("status", "eq", "cancelado"),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-3xl font-bold text-white">Calendário</h1>
          <p className="text-night-400 text-sm mt-1">
            Disponibilidade de camarotes por evento
          </p>
        </div>
        <Link href="/dashboard/eventos/novo" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} />
          Novo evento
        </Link>
      </div>

      <CalendarioClient
        camarotes={camarotes ?? []}
        eventos={eventos ?? []}
        reservas={reservas ?? []}
      />
    </div>
  );
}
