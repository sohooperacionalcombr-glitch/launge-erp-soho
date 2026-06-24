import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = (await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single()) as any;

  if (!cliente) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/clientes" className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400">
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Clientes</p>
        <h1 className="font-display text-3xl font-bold text-white">
          {cliente.nome}
        </h1>
      </div>

      <div className="card p-6">
        <ClienteForm cliente={cliente} />
      </div>
    </div>
  );
}
