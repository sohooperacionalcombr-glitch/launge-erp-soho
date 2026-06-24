import { ClienteForm } from "@/components/forms/ClienteForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NovoClientePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/clientes" className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400">
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Clientes</p>
        <h1 className="font-display text-3xl font-bold text-white">Novo cliente</h1>
      </div>

      <div className="card p-6">
        <ClienteForm />
      </div>
    </div>
  );
}
