import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatDate,
  calcStatusFinanceiro,
  STATUS_FINANCEIRO_CONFIG,
} from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Filter, X } from "lucide-react";
import Link from "next/link";
import type { ReservaStatus, StatusFinanceiro } from "@/types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_ATIVOS = ["pendente", "confirmado", "confirmada", "reservado"];

const SOCIOS = [
  "Márcio", "Ronaldo Jr", "Tuka", "Lukka", "João Henrique",
  "Vitor Hugo", "Bruno Alex", "Leonardo Andrade", "Neto Bueno",
];

const FORMAS_OPTIONS = [
  { value: "pix",            label: "PIX"          },
  { value: "dinheiro",       label: "Dinheiro"      },
  { value: "cartao_credito", label: "Cartão"        },
  { value: "transferencia",  label: "Transferência" },
  { value: "network",        label: "Network"       },
  { value: "socio",          label: "Sócio"         },
  { value: "permuta",        label: "Permuta"       },
  { value: "cortesia",       label: "Cortesia"      },
];

const SF_OPTIONS: { value: string; label: string }[] = [
  { value: "aguardando_sinal",   label: "Pendente"      },
  { value: "pago_parcialmente",  label: "Parcial"       },
  { value: "pago_integralmente", label: "Quitado"       },
  { value: "network",            label: "Network/Sócio" },
  { value: "cortesia",           label: "Cortesia"      },
  { value: "permuta",            label: "Permuta"       },
];

const FORMAS_LABEL: Record<string, string> = {
  pix: "PIX", dinheiro: "Dinheiro", cartao_credito: "Cartão",
  cartao_debito: "Cartão Déb.", transferencia: "Transf.",
  network: "Network", socio: "Sócio", permuta: "Permuta", cortesia: "Cortesia",
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    evento?: string;
    sf?: string;
    forma?: string;
    socio?: string;
    promoter?: string;
  }>;
}) {
  const params  = await searchParams;
  const supabase = await createClient();

  // ── Busca de eventos para o filtro ─────────────────────────────────────────
  const { data: eventosAll } = (await supabase
    .from("eventos")
    .select("id, nome, data_inicio")
    .order("data_inicio", { ascending: false })) as any;

  // ── Query principal com filtros ────────────────────────────────────────────
  let q = (supabase as any)
    .from("reservas")
    .select(
      "id, codigo, status, valor_total, valor_recebido, forma_pagamento, " +
      "status_financeiro, promoter_responsavel, socio_responsavel, " +
      "cliente:clientes(nome, telefone), " +
      "camarate:camarotes(nome), " +
      "evento:eventos(id, nome, data_inicio)"
    )
    .in("status", STATUS_ATIVOS)
    .order("created_at", { ascending: false });

  if (params.evento)   q = q.eq("evento_id",        params.evento);
  if (params.forma)    q = q.eq("forma_pagamento",   params.forma);
  if (params.socio)    q = q.eq("socio_responsavel", params.socio);
  if (params.promoter) q = q.ilike("promoter_responsavel", `%${params.promoter}%`);
  // sf é calculado — aplicar pós-fetch (ver abaixo)

  const { data: reservas } = (await q) as any;
  const lista: any[] = reservas ?? [];

  // ── Calcular status_financeiro para cada linha ─────────────────────────────
  const withSF = lista.map((r) => ({
    ...r,
    sf: calcStatusFinanceiro(r.forma_pagamento, r.valor_total ?? 0, r.valor_recebido ?? 0),
  }));

  // Aplicar filtro de sf (calculado, não direto no banco)
  const filtered = params.sf ? withSF.filter((r) => r.sf === params.sf) : withSF;

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalReservado = filtered.reduce((s: number, r: any) => s + (r.valor_total    ?? 0), 0);
  const totalRecebido  = filtered.reduce((s: number, r: any) => s + (r.valor_recebido ?? 0), 0);
  const saldoPendente  = Math.max(0, totalReservado - totalRecebido);
  const qtdReservas    = filtered.length;
  const qtdCortesias   = filtered.filter((r: any) => r.sf === "cortesia").length;
  const qtdPermutas    = filtered.filter((r: any) => r.sf === "permuta").length;

  const temFiltro = !!(params.evento || params.sf || params.forma || params.socio || params.promoter);

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Financeiro</h1>
          <p className="text-night-400 text-sm mt-1">Reservas ativas · sem canceladas</p>
        </div>
        {temFiltro && (
          <Link
            href="/dashboard/financeiro"
            className="flex items-center gap-1.5 text-xs text-night-400 hover:text-white border border-night-700 rounded-lg px-3 py-2 transition-colors shrink-0"
          >
            <X size={13} />
            Limpar filtros
          </Link>
        )}
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4 border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent sm:col-span-1">
          <p className="text-[10px] text-night-400 uppercase tracking-wider mb-1">Negociado</p>
          <p className="font-display text-lg sm:text-xl font-bold text-brand-400 leading-tight">{formatCurrency(totalReservado)}</p>
        </div>
        <div className="card p-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <p className="text-[10px] text-night-400 uppercase tracking-wider mb-1">Recebido</p>
          <p className="font-display text-lg sm:text-xl font-bold text-emerald-400 leading-tight">{formatCurrency(totalRecebido)}</p>
        </div>
        <div className="card p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
          <p className="text-[10px] text-night-400 uppercase tracking-wider mb-1">Saldo</p>
          <p className="font-display text-lg sm:text-xl font-bold text-amber-400 leading-tight">{formatCurrency(saldoPendente)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-night-400 uppercase tracking-wider mb-1">Reservas</p>
          <p className="text-2xl font-bold text-white">{qtdReservas}</p>
        </div>
        <div className={`card p-4 ${STATUS_FINANCEIRO_CONFIG.cortesia.bg}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${STATUS_FINANCEIRO_CONFIG.cortesia.color}`}>Cortesias</p>
          <p className="text-2xl font-bold text-white">{qtdCortesias}</p>
        </div>
        <div className={`card p-4 ${STATUS_FINANCEIRO_CONFIG.permuta.bg}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${STATUS_FINANCEIRO_CONFIG.permuta.color}`}>Permutas</p>
          <p className="text-2xl font-bold text-white">{qtdPermutas}</p>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <form method="GET" className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-night-400 text-xs uppercase tracking-widest mb-1">
          <Filter size={12} />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Evento */}
          <select
            name="evento"
            defaultValue={params.evento ?? ""}
            className="input-base text-sm"
          >
            <option value="">Todos os eventos</option>
            {(eventosAll ?? []).map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.nome} {e.data_inicio ? `· ${formatDate(e.data_inicio)}` : ""}
              </option>
            ))}
          </select>

          {/* Status financeiro */}
          <select
            name="sf"
            defaultValue={params.sf ?? ""}
            className="input-base text-sm"
          >
            <option value="">Todos os status</option>
            {SF_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Forma de pagamento */}
          <select
            name="forma"
            defaultValue={params.forma ?? ""}
            className="input-base text-sm"
          >
            <option value="">Todas as formas</option>
            {FORMAS_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Sócio responsável */}
          <select
            name="socio"
            defaultValue={params.socio ?? ""}
            className="input-base text-sm"
          >
            <option value="">Todos os sócios</option>
            {SOCIOS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Promoter responsável */}
          <input
            type="text"
            name="promoter"
            defaultValue={params.promoter ?? ""}
            placeholder="Promoter responsável"
            className="input-base text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1 sm:flex-none sm:px-6 text-sm">
            Filtrar
          </button>
          {temFiltro && (
            <Link href="/dashboard/financeiro" className="btn-secondary text-sm">
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* ── Listagem ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-night-400 text-sm">
            {filtered.length} reserva{filtered.length !== 1 ? "s" : ""}
            {temFiltro && <span className="text-brand-400 ml-1">· filtrado</span>}
          </p>
        </div>

        {/* ── Cards mobile (< lg) ────────────────────────────────────────── */}
        <div className="card overflow-hidden divide-y divide-night-700/50 lg:hidden">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-night-500 text-sm">Nenhuma reserva encontrada.</p>
          )}
          {filtered.map((r: any) => {
            const fCfg = STATUS_FINANCEIRO_CONFIG[r.sf as StatusFinanceiro];
            const saldo = Math.max(0, (r.valor_total ?? 0) - (r.valor_recebido ?? 0));
            return (
              <Link
                key={r.id}
                href={`/dashboard/reservas/${r.id}`}
                className="block p-4 active:bg-night-700/30"
              >
                {/* Linha 1: código + status */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                    {r.codigo}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {fCfg && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${fCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${fCfg.dot}`} />
                        {fCfg.label}
                      </span>
                    )}
                    <StatusBadge status={r.status as ReservaStatus} />
                  </div>
                </div>

                {/* Linha 2: cliente */}
                <p className="text-white text-sm font-semibold truncate">{r.cliente?.nome ?? "—"}</p>
                {r.cliente?.telefone && (
                  <p className="text-night-500 text-xs">{r.cliente.telefone}</p>
                )}

                {/* Linha 3: camarote · evento */}
                <p className="text-night-400 text-xs mt-0.5 truncate">
                  {r.camarate?.nome ?? "—"} · {r.evento?.nome ?? "—"}
                </p>

                {/* Linha 4: valores */}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-night-400">
                    Negociado: <span className="text-white font-medium">{formatCurrency(r.valor_total ?? 0)}</span>
                  </span>
                  <span className="text-night-400">
                    Recebido: <span className="text-emerald-400 font-medium">{formatCurrency(r.valor_recebido ?? 0)}</span>
                  </span>
                  {saldo > 0 && (
                    <span className="text-amber-400 font-medium">Saldo: {formatCurrency(saldo)}</span>
                  )}
                </div>

                {/* Linha 5: forma · promoter · sócio */}
                <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-night-500">
                  {r.forma_pagamento && (
                    <span>{FORMAS_LABEL[r.forma_pagamento] ?? r.forma_pagamento}</span>
                  )}
                  {r.promoter_responsavel && (
                    <span>· Promoter: {r.promoter_responsavel}</span>
                  )}
                  {r.socio_responsavel && (
                    <span>· Sócio: {r.socio_responsavel}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Tabela desktop (≥ lg) ──────────────────────────────────────── */}
        <div className="card overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="text-night-400 text-xs uppercase tracking-wide border-b border-night-700">
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Evento</th>
                  <th className="text-left px-4 py-3 font-medium">Camarote</th>
                  <th className="text-right px-4 py-3 font-medium">Negociado</th>
                  <th className="text-right px-4 py-3 font-medium">Recebido</th>
                  <th className="text-right px-4 py-3 font-medium">Saldo</th>
                  <th className="text-left px-4 py-3 font-medium">Pagamento</th>
                  <th className="text-left px-4 py-3 font-medium">Financeiro</th>
                  <th className="text-left px-4 py-3 font-medium">Promoter</th>
                  <th className="text-left px-4 py-3 font-medium">Sócio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-700/50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-night-500 text-sm">
                      Nenhuma reserva encontrada.
                    </td>
                  </tr>
                )}
                {filtered.map((r: any) => {
                  const fCfg  = STATUS_FINANCEIRO_CONFIG[r.sf as StatusFinanceiro];
                  const saldo = Math.max(0, (r.valor_total ?? 0) - (r.valor_recebido ?? 0));
                  return (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-3.5">
                        <Link href={`/dashboard/reservas/${r.id}`} className="block">
                          <p className="text-sm text-white font-medium hover:text-brand-400 transition-colors">
                            {r.cliente?.nome ?? "—"}
                          </p>
                          {r.cliente?.telefone && (
                            <p className="text-xs text-night-500">{r.cliente.telefone}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-night-300">{r.evento?.nome ?? "—"}</p>
                        {r.evento?.data_inicio && (
                          <p className="text-xs text-night-500">{formatDate(r.evento.data_inicio)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-night-300">
                        {r.camarate?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-white font-medium">
                        {formatCurrency(r.valor_total ?? 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-emerald-400 font-medium">
                        {formatCurrency(r.valor_recebido ?? 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <span className={saldo > 0 ? "text-amber-400 font-medium" : "text-night-700"}>
                          {formatCurrency(saldo)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-night-300">
                        {r.forma_pagamento ? (FORMAS_LABEL[r.forma_pagamento] ?? r.forma_pagamento) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {fCfg ? (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${fCfg.bg} ${fCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${fCfg.dot}`} />
                            {fCfg.label}
                          </span>
                        ) : (
                          <span className="text-night-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-night-300">
                        {r.promoter_responsavel ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-night-300">
                        {r.socio_responsavel ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
