"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, calcStatusFinanceiro, STATUS_FINANCEIRO_CONFIG } from "@/lib/utils";
import type {
  Reserva,
  ReservaForm as IReservaForm,
  Cliente,
  Camarate,
  Evento,
  FormaPagamento,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  reserva?: Reserva;
  clientes: Pick<Cliente, "id" | "nome" | "telefone">[];
  camarotes: Pick<Camarate, "id" | "nome" | "capacidade" | "preco_base">[];
  eventos: Pick<Evento, "id" | "nome" | "data_inicio">[];
  initialValues?: {
    evento_id?: string;
    camarote_id?: string;
  };
  isAdmin?: boolean;
}

// Status que tornam uma reserva existente um bloqueio para novo camarote
const BLOQUEIO_STATUSES = ["pendente", "confirmado", "confirmada", "reservado"];

// ─── Opções fixas ─────────────────────────────────────────────────────────────

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: "pix",            label: "PIX"          },
  { value: "dinheiro",       label: "Dinheiro"      },
  { value: "cartao_credito", label: "Cartão"        },
  { value: "transferencia",  label: "Transferência" },
  { value: "network",        label: "Network"       },
  { value: "socio",          label: "Sócio"         },
  { value: "permuta",        label: "Permuta"       },
  { value: "cortesia",       label: "Cortesia"      },
];

const SOCIOS = [
  "Márcio",
  "Ronaldo Jr",
  "Tuka",
  "Lukka",
  "João Henrique",
  "Vitor Hugo",
  "Bruno Alex",
  "Leonardo Andrade",
  "Neto Bueno",
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReservaForm({
  reserva,
  clientes,
  camarotes,
  eventos,
  initialValues,
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient() as any;
  const isEdit = !!reserva;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockedCamaroteIds, setBlockedCamaroteIds] = useState<Set<string>>(new Set());
  const [loadingCamarotes, setLoadingCamarotes] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IReservaForm>({
    defaultValues: reserva
      ? {
          // Bug fix: coluna SQL é "camarote_id" (com o), TS interface diz "camarate_id" (sem o).
          // Supabase retorna o nome real da coluna; lemos ambos para garantir compatibilidade.
          camarate_id:           (reserva as any).camarote_id ?? reserva.camarate_id ?? "",
          evento_id:             reserva.evento_id,
          cliente_id:            reserva.cliente_id,
          promoter_responsavel:  reserva.promoter_responsavel ?? undefined,
          status:                reserva.status,
          num_pessoas:           reserva.num_pessoas,
          valor_total:           reserva.valor_total,
          valor_sinal:           reserva.valor_sinal,
          valor_recebido:        reserva.valor_recebido ?? undefined,
          desconto_pct:          reserva.desconto_pct,
          forma_pagamento:       reserva.forma_pagamento ?? undefined,
          status_financeiro:     reserva.status_financeiro ?? undefined,
          socio_responsavel:     reserva.socio_responsavel ?? undefined,
          cortesia_motivo:       reserva.cortesia_motivo ?? undefined,
          cortesia_aprovador:    reserva.cortesia_aprovador ?? undefined,
          observacoes:           reserva.observacoes ?? undefined,
        }
      : {
          camarate_id:  initialValues?.camarote_id ?? "",
          evento_id:    initialValues?.evento_id ?? "",
          cliente_id:   "",
          status:       "pendente",
          num_pessoas:  1,
          valor_total:  0,
          valor_sinal:  0,
          desconto_pct: 0,
        },
  });

  // ─── Campos observados ────────────────────────────────────────────────────────

  const watchedEventoId      = watch("evento_id");
  const watchedCamaroteId    = watch("camarate_id");
  // Bug fix: `??` não captura NaN (NaN !== null/undefined). Usar `|| 0` garante fallback correto.
  const watchedValorTotal    = Number(watch("valor_total")    || 0);
  const watchedValorRecebido = Number(watch("valor_recebido") || 0);
  const watchedFormaPag      = watch("forma_pagamento");

  const isSocioOuCortesia = watchedFormaPag === "socio" || watchedFormaPag === "cortesia";
  const saldoPendente = Math.max(0, watchedValorTotal - watchedValorRecebido);

  // Auto-calcular status_financeiro com base nos valores e forma de pagamento
  useEffect(() => {
    const auto = calcStatusFinanceiro(watchedFormaPag, watchedValorTotal, watchedValorRecebido);
    setValue("status_financeiro", auto);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFormaPag, watchedValorTotal, watchedValorRecebido]);

  // Auto-fill valor_total com preco_base do camarote selecionado (modo criação)
  useEffect(() => {
    if (!isEdit && watchedCamaroteId) {
      const cam = camarotes.find((c) => c.id === watchedCamaroteId);
      if (cam) setValue("valor_total", cam.preco_base);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCamaroteId]);

  // Busca camarotes já reservados para o evento selecionado
  useEffect(() => {
    if (!watchedEventoId) {
      setBlockedCamaroteIds(new Set());
      return;
    }

    setLoadingCamarotes(true);

    let query = (supabase as any)
      .from("reservas")
      .select("camarote_id")
      .eq("evento_id", watchedEventoId)
      .in("status", BLOQUEIO_STATUSES);

    // Em modo edição exclui a própria reserva para não bloquear o camarote atual
    if (isEdit && reserva) {
      query = query.neq("id", reserva.id);
    }

    query.then(({ data }: { data: { camarote_id: string }[] | null }) => {
      const ids = new Set<string>((data ?? []).map((r: { camarote_id: string }) => r.camarote_id));
      setBlockedCamaroteIds(ids);

      // Limpa camarote selecionado se ficou indisponível após troca de evento
      const currentCam = watch("camarate_id");
      if (currentCam && ids.has(currentCam)) {
        setValue("camarate_id", "");
      }

      setLoadingCamarotes(false);
    }).catch(() => setLoadingCamarotes(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEventoId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  async function onSubmit(data: IReservaForm) {
    const payload = {
      camarote_id:          data.camarate_id,  // tipo TS usa camarate_id; coluna SQL é camarote_id
      evento_id:            data.evento_id,
      cliente_id:           data.cliente_id,
      promoter_responsavel: data.promoter_responsavel || null,
      status:               data.status,
      num_pessoas:          Number(data.num_pessoas),
      valor_total:          Number(data.valor_total),
      valor_sinal:          isEdit ? (reserva?.valor_sinal ?? 0) : 0,  // oculto da UI, preserva dado existente
      desconto_pct:         Number(data.desconto_pct ?? 0),
      valor_recebido:       data.valor_recebido != null ? Number(data.valor_recebido) : null,
      forma_pagamento:      data.forma_pagamento || null,
      // Garante que o status financeiro salvo é sempre o calculado automaticamente
      status_financeiro:    calcStatusFinanceiro(
                              data.forma_pagamento,
                              Number(data.valor_total),
                              data.valor_recebido ? Number(data.valor_recebido) : 0
                            ),
      socio_responsavel:    data.socio_responsavel || null,
      cortesia_motivo:      data.cortesia_motivo || null,
      cortesia_aprovador:   data.cortesia_aprovador || null,
      observacoes:          data.observacoes || null,
    };

    // ── Trava de duplicidade: bloqueia se já existe reserva ativa para o mesmo camarote + evento
    const STATUS_ATIVOS = ["pendente", "confirmado", "confirmada", "reservado"];

    let conflitoQuery = supabase
      .from("reservas")
      .select("id")
      .eq("camarote_id", payload.camarote_id)
      .eq("evento_id", payload.evento_id)
      .in("status", STATUS_ATIVOS)
      .limit(1);

    if (isEdit) {
      conflitoQuery = conflitoQuery.neq("id", reserva.id);
    }

    const { data: conflito } = await conflitoQuery;
    if (conflito && conflito.length > 0) {
      toast.error("Este camarote já possui reserva ativa para este evento.");
      return;
    }

    if (isEdit) {
      const { error } = await supabase
        .from("reservas")
        .update(payload)
        .eq("id", reserva.id);
      if (error) { toast.error("Erro ao atualizar reserva."); return; }
      toast.success("Reserva atualizada!");
    } else {
      const { error } = await supabase.from("reservas").insert(payload);
      if (error) { toast.error("Erro ao criar reserva: " + error.message); return; }
      toast.success("Reserva criada com sucesso!");
    }

    router.push("/dashboard/reservas");
    router.refresh();
  }

  async function handleCancelarReserva() {
    if (!reserva) return;
    if (!confirm("Confirma o cancelamento desta reserva?")) return;
    const { error } = await supabase
      .from("reservas")
      .update({ status: "cancelado" })
      .eq("id", reserva.id);
    if (error) { toast.error("Erro ao cancelar reserva."); return; }
    toast.success("Reserva cancelada.");
    router.push("/dashboard/reservas");
    router.refresh();
  }

  async function handleExcluirReserva() {
    if (!reserva) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", reserva.id);
    setIsDeleting(false);
    if (error) {
      toast.error("Erro ao excluir reserva.");
      return;
    }
    setShowDeleteModal(false);
    toast.success("Reserva excluída com sucesso.");
    router.push("/dashboard/reservas");
    router.refresh();
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── 1. Identificação ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-widest text-night-400">
          Identificação
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Cliente */}
          <div className="sm:col-span-2">
            <label className="label-base">Cliente *</label>
            <select
              {...register("cliente_id", { required: "Selecione um cliente" })}
              className="input-base"
            >
              <option value="">Selecionar cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.telefone ? ` · ${c.telefone}` : ""}
                </option>
              ))}
            </select>
            {errors.cliente_id && (
              <p className="text-red-400 text-xs mt-1">{errors.cliente_id.message}</p>
            )}
            <p className="text-xs text-night-500 mt-1">
              Cliente não encontrado?{" "}
              <Link
                href={`/dashboard/clientes/novo?redirect=${encodeURIComponent(pathname)}`}
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                Cadastrar novo cliente →
              </Link>
            </p>
          </div>

          {/* Evento — exibe apenas eventos futuros e ativos */}
          <div>
            <label className="label-base">Evento *</label>
            <select
              {...register("evento_id", { required: "Selecione um evento" })}
              className="input-base"
            >
              <option value="">Selecionar evento…</option>
              {eventos
                .filter((e) => new Date(e.data_inicio) >= new Date())
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatDate(e.data_inicio)} · {e.nome}
                  </option>
                ))}
            </select>
            {errors.evento_id && (
              <p className="text-red-400 text-xs mt-1">{errors.evento_id.message}</p>
            )}
          </div>

          {/* Camarote — filtrado pelos disponíveis no evento selecionado */}
          <div>
            <label className="label-base">Camarote *</label>
            <select
              {...register("camarate_id", { required: "Selecione um camarote" })}
              className="input-base"
              disabled={loadingCamarotes}
            >
              <option value="">
                {loadingCamarotes ? "Verificando disponibilidade…" : "Selecionar camarote…"}
              </option>
              {camarotes
                .filter((c) => !blockedCamaroteIds.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {c.capacidade} pax · {formatCurrency(c.preco_base)}
                  </option>
                ))}
            </select>
            {errors.camarate_id && (
              <p className="text-red-400 text-xs mt-1">{errors.camarate_id.message}</p>
            )}
            {!loadingCamarotes && watchedEventoId && blockedCamaroteIds.size > 0 && (
              <p className="text-amber-400/70 text-xs mt-1">
                {blockedCamaroteIds.size} camarote{blockedCamaroteIds.size !== 1 ? "s" : ""} indisponível{blockedCamaroteIds.size !== 1 ? "s" : ""} para este evento
              </p>
            )}
          </div>

          {/* Promoter responsável */}
          <div>
            <label className="label-base">Promoter responsável</label>
            <input
              {...register("promoter_responsavel")}
              type="text"
              className="input-base"
              placeholder="Nome do promoter"
            />
          </div>

          {/* Sócio responsável */}
          <div>
            <label className="label-base">Sócio responsável</label>
            <select {...register("socio_responsavel")} className="input-base">
              <option value="">Selecionar sócio…</option>
              {SOCIOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* ── 2. Ocupação & Valores ─────────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-night-700 pt-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-night-400">
          Ocupação & Valores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Número de pessoas */}
          <div>
            <label className="label-base">Nº de pessoas *</label>
            <input
              {...register("num_pessoas", {
                required: "Informe o número de pessoas",
                min: { value: 1, message: "Mínimo 1 pessoa" },
                valueAsNumber: true,
              })}
              type="number"
              min={1}
              className="input-base"
            />
            {errors.num_pessoas && (
              <p className="text-red-400 text-xs mt-1">{errors.num_pessoas.message}</p>
            )}
          </div>

          {/* Valor negociado */}
          <div>
            <label className="label-base">Valor negociado *</label>
            <input
              {...register("valor_total", {
                required: "Informe o valor",
                min: { value: 0, message: "Valor inválido" },
                valueAsNumber: true,
              })}
              type="number"
              min={0}
              step="0.01"
              className="input-base"
            />
            {errors.valor_total && (
              <p className="text-red-400 text-xs mt-1">{errors.valor_total.message}</p>
            )}
          </div>

          {/* Valor recebido */}
          <div>
            <label className="label-base">Valor recebido</label>
            <input
              {...register("valor_recebido", { min: 0, valueAsNumber: true })}
              type="number"
              min={0}
              step="0.01"
              className="input-base"
              placeholder="0,00"
            />
          </div>

          {/* Saldo pendente — calculado, somente leitura */}
          <div className="sm:col-span-3">
            <label className="label-base">Saldo pendente</label>
            <div
              className={`input-base flex items-center font-mono text-sm select-none cursor-default ${
                saldoPendente > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {formatCurrency(saldoPendente)}
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. Status & Pagamento ─────────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-night-700 pt-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-night-400">
          Status & Pagamento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Status da reserva */}
          <div>
            <label className="label-base">Status da reserva *</label>
            <select
              {...register("status", { required: "Selecione o status" })}
              className="input-base"
            >
              <option value="livre">Livre</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="label-base">Forma de pagamento</label>
            <select {...register("forma_pagamento")} className="input-base">
              <option value="">Selecionar…</option>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status financeiro — calculado automaticamente */}
          <div>
            <label className="label-base">Status financeiro</label>
            {(() => {
              const sf = calcStatusFinanceiro(watchedFormaPag, watchedValorTotal, watchedValorRecebido);
              const cfg = STATUS_FINANCEIRO_CONFIG[sf] ?? STATUS_FINANCEIRO_CONFIG.aguardando_sinal;
              return (
                <div className={`input-base flex items-center gap-2 cursor-default select-none ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="font-medium">{cfg.label}</span>
                  <span className="text-night-600 text-xs ml-auto">automático</span>
                </div>
              );
            })()}
            {/* Campo hidden mantém o valor no formulário para envio */}
            <input type="hidden" {...register("status_financeiro")} />
          </div>

          {/* Responsável pelo pagamento */}
          <div>
            <label className="label-base">Responsável pelo pagamento</label>
            <input
              {...register("responsavel_pagamento")}
              type="text"
              className="input-base"
              placeholder="Nome do responsável"
            />
          </div>

        </div>
      </section>

      {/* ── 4. Detalhes do Sócio / Cortesia (condicional) ───────────────────── */}
      {isSocioOuCortesia && (
        <section className="space-y-4 border-t border-amber-500/20 pt-6">
          <h3 className="text-xs font-medium uppercase tracking-widest text-amber-400">
            Detalhes do Sócio
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-base">Motivo / Justificativa</label>
              <textarea
                {...register("cortesia_motivo")}
                rows={3}
                className="input-base resize-none"
                placeholder="Descreva o motivo da cortesia ao sócio…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-base">Aprovado por</label>
              <input
                {...register("cortesia_aprovador")}
                type="text"
                className="input-base"
                placeholder="Nome do responsável pela aprovação"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Observações ───────────────────────────────────────────────────── */}
      <section className="space-y-3 border-t border-night-700 pt-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-night-400">
          Observações
        </h3>
        <textarea
          {...register("observacoes")}
          rows={4}
          className="input-base resize-none w-full"
          placeholder="Pedidos especiais, preferências, notas internas…"
        />
      </section>

      {/* ── Ações ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-night-700">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3 sm:py-2.5">
          {isSubmitting
            ? "Salvando…"
            : isEdit
            ? "Salvar alterações"
            : "Criar reserva"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary w-full sm:w-auto"
        >
          Voltar
        </button>
        {/* "Cancelar reserva" só aparece quando a reserva ainda não está cancelada */}
        {isEdit && reserva?.status !== "cancelado" && (
          <button
            type="button"
            onClick={handleCancelarReserva}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-400/10 border border-amber-400/20 transition-colors"
          >
            Cancelar reserva
          </button>
        )}
      </div>

      {/* ── Excluir reserva — visível para admin quando cancelada ────────────── */}
      {isAdmin && isEdit && reserva?.status === "cancelado" && (
        <div className="border-t border-red-500/30 pt-5 space-y-3">
          <p className="text-xs text-night-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Reserva cancelada
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all"
          >
            Excluir Reserva Permanentemente
          </button>
        </div>
      )}

      {/* ── Zona de perigo — exclusão para reservas não-canceladas (somente admin) */}
      {isAdmin && isEdit && reserva?.status !== "cancelado" && (
        <div className="border-t border-red-500/20 pt-5">
          <p className="text-xs text-night-500 mb-3 uppercase tracking-widest">Zona de perigo</p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-colors"
          >
            Excluir Reserva
          </button>
        </div>
      )}

      {/* ── Modal de confirmação de exclusão ─────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-night-800 border border-night-700 rounded-xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                Excluir reserva
              </h2>
              <p className="text-night-300 text-sm leading-relaxed">
                Tem certeza que deseja excluir esta reserva permanentemente?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirReserva}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}
