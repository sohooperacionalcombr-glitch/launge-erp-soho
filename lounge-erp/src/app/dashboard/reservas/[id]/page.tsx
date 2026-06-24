import { createClient } from "@/lib/supabase/server";
import { ReservaForm } from "@/components/forms/ReservaForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: reserva },
    { data: clientes },
    { data: camarotes },
    { data: eventos },
    { data: { user } },
  ] = (await Promise.all([
    supabase
      .from("reservas")
      .select("*, cliente:clientes(*), camarate:camarotes(*), evento:eventos(*)")
      .eq("id", id)
      .single(),
    supabase.from("clientes").select("id, nome, telefone").eq("ativo", true).order("nome"),
    supabase.from("camarotes").select("id, nome, capacidade, preco_base").eq("ativo", true).order("nome"),
    supabase.from("eventos").select("id, nome, data_inicio").eq("ativo", true).order("data_inicio"),
    supabase.auth.getUser(),
  ])) as any;

  if (!reserva) notFound();

  // Verificar se o usuário logado é admin
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user?.id)
    .maybeSingle() as any;

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-5 w-full lg:max-w-2xl">
      <div>
        <Link href="/dashboard/reservas" className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400">
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-night-400 text-xs uppercase tracking-widest">Reserva</p>
          <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
            {reserva.codigo}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {(reserva as any).cliente?.nome}
          </h1>
          <StatusBadge status={reserva.status as any} />
        </div>
        <p className="text-night-400 text-xs sm:text-sm mt-1">
          Criada em {formatDateTime(reserva.created_at)} · {formatCurrency(reserva.valor_total)}
        </p>
      </div>

      <div className="card p-4 sm:p-6">
        <ReservaForm
          reserva={reserva as any}
          clientes={clientes ?? []}
          camarotes={camarotes ?? []}
          eventos={eventos ?? []}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
