import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPhone } from "@/lib/utils";
import { UserPlus, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const supabase = await createClient();

  let q = supabase
    .from("clientes")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  if (query) {
    q = q.or(`nome.ilike.%${query}%,email.ilike.%${query}%,cpf.ilike.%${query}%,telefone.ilike.%${query}%`);
  }

  const { data: clientes } = (await q.limit(100)) as any;

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Clientes</h1>
        </div>
        <Link href="/dashboard/clientes/novo" className="btn-primary flex items-center gap-2 shrink-0">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Novo cliente</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* ── Busca ─────────────────────────────────────────────────────────── */}
      <form method="GET" className="relative w-full sm:max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-night-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome, CPF, telefone…"
          className="input-base pl-9"
        />
      </form>

      {/* ── Listagem ──────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-night-700">
          <span className="text-night-400 text-sm">
            {clientes?.length ?? 0} cliente{(clientes?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {clientes && clientes.length > 0 ? (
          <>
            {/* ── Cards mobile (< lg) ──────────────────────────────────────── */}
            <div className="divide-y divide-night-700/50 lg:hidden">
              {clientes.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/dashboard/clientes/${c.id}`}
                  className="flex items-center justify-between gap-3 p-4 active:bg-night-700/30"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.nome}</p>
                    {c.telefone && (
                      <p className="text-night-400 text-xs mt-0.5">{formatPhone(c.telefone)}</p>
                    )}
                    {c.email && (
                      <p className="text-night-500 text-xs truncate">{c.email}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-night-600 shrink-0" />
                </Link>
              ))}
            </div>

            {/* ── Tabela desktop (≥ lg) ─────────────────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-night-400 text-xs uppercase tracking-wide border-b border-night-700">
                    <th className="text-left px-6 py-3 font-medium">Nome</th>
                    <th className="text-left px-6 py-3 font-medium">Telefone</th>
                    <th className="text-left px-6 py-3 font-medium">E-mail</th>
                    <th className="text-left px-6 py-3 font-medium">Cadastro</th>
                    <th className="text-right px-6 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-700/50">
                  {clientes.map((c: any) => (
                    <tr key={c.id} className="table-row-hover">
                      <td className="px-6 py-3.5">
                        <div>
                          <p className="text-sm text-white font-medium">{c.nome}</p>
                          {c.cpf && <p className="text-xs text-night-500 mt-0.5">{c.cpf}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300">
                        {c.telefone ? formatPhone(c.telefone) : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-night-300">{c.email ?? "—"}</td>
                      <td className="px-6 py-3.5 text-sm text-night-400">{formatDate(c.created_at)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/dashboard/clientes/${c.id}`}
                          className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-4 sm:px-6 py-16 text-center">
            <p className="text-night-500 text-sm">
              {query ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
            </p>
            {!query && (
              <Link href="/dashboard/clientes/novo" className="btn-primary inline-flex mt-4 text-xs">
                Cadastrar primeiro cliente
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
