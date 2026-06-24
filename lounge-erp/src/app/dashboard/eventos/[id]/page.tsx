import { createClient } from "@/lib/supabase/server";
import { EventoForm } from "@/components/forms/EventoForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: evento } = (await supabase
    .from("eventos")
    .select("*")
    .eq("id", id)
    .single()) as any;

  if (!evento) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/eventos" className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400">
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Eventos</p>
        <h1 className="font-display text-3xl font-bold text-white">{evento.nome}</h1>
      </div>

      <div className="card p-6">
        <EventoForm evento={evento} />
      </div>
    </div>
  );
}
