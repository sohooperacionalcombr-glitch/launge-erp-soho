import { ClienteForm } from "@/components/forms/ClienteForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/dashboard/clientes";

  return (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <Link
          href={redirectTo}
          className="btn-ghost flex items-center gap-2 w-fit mb-4 text-night-400"
        >
          <ArrowLeft size={15} />
          Voltar
        </Link>
        <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Clientes</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Novo cliente
        </h1>
      </div>

      <div className="card p-4 sm:p-6">
        <ClienteForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
