import { createClient } from "@/lib/supabase/server";
import { ReservaForm } from "@/components/forms/ReservaForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NovaReservaPage({
  searchParams,
}: {
  searchParams?: { evento_id?: string; camarote_id?: string };
}) {
  const supabase = await createClient();
  const agora = new Date().toISOString();

  const [{ data: clientes }, { data: camarotes }, { data: eventos }] =
    await Promise.all([
      supabase.from("clientes").select("id, nome, telefone").eq("ativo", true).order("nome"),
      supabase.from("camarotes").select("id, nome, capacidade, preco_base").eq("ativo", true).order("nome"),
      supabase
        .from("eventos")
        .select("id, nome, data_inicio")
        .eq("ativo", true)
        .gte("data_inicio", agora)
        .order("data_inicio", { ascending: true }),
    ]);

  return (
    <div className="space-y-5 w-full lg:max-w-2xl">
      <div>
        <Link href="/dashboard/reservas" className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400">
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Reservas</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Nova reserva</h1>
      </div>

      <div className="card p-4 sm:p-6">
        <ReservaForm
          clientes={clientes ?? []}
          camarotes={camarotes ?? []}
          eventos={eventos ?? []}
          initialValues={{
            evento_id: searchParams?.evento_id,
            camarote_id: searchParams?.camarote_id,
          }}
        />
      </div>
    </div>
  );
}
