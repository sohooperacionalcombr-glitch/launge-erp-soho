"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Evento } from "@/types";

interface EventoFormValues {
  nome: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
}

interface Props {
  evento?: Evento;
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function EventoForm({ evento }: Props) {
  const router = useRouter();
  const supabase = createClient() as any;
  const isEdit = Boolean(evento);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventoFormValues>({
    defaultValues: {
      nome: evento?.nome ?? "",
      descricao: evento?.descricao ?? "",
      data_inicio: toDateInputValue(evento?.data_inicio),
      data_fim: toDateInputValue(evento?.data_fim),
      ativo: evento?.ativo ?? true,
    },
  });

  const dataInicio = watch("data_inicio");
  const dataFim = watch("data_fim");

  useEffect(() => {
    if (evento) {
      setValue("data_inicio", toDateInputValue(evento.data_inicio));
      setValue("data_fim", toDateInputValue(evento.data_fim));
    }
  }, [evento, setValue]);

  async function onSubmit(data: EventoFormValues) {
    const payload = {
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      ativo: data.ativo,
    };

    if (isEdit && evento) {
      const { error } = await supabase.from("eventos").update(payload).eq("id", evento.id);
      if (error) {
        toast.error("Erro ao atualizar evento.");
        return;
      }
      toast.success("Evento atualizado com sucesso.");
    } else {
      const { error } = await supabase.from("eventos").insert(payload);
      if (error) {
        toast.error("Erro ao criar evento: " + error.message);
        return;
      }
      toast.success("Evento criado com sucesso.");
    }

    router.push("/dashboard/eventos");
    router.refresh();
  }

  async function handleDelete() {
    if (!evento) return;
    const confirmed = confirm("Deseja realmente excluir este evento?");
    if (!confirmed) return;

    const { error } = await supabase.from("eventos").update({ ativo: false }).eq("id", evento.id);
    if (error) {
      toast.error("Erro ao excluir evento.");
      return;
    }

    toast.success("Evento excluído com sucesso.");
    router.push("/dashboard/eventos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-base">Nome *</label>
          <input
            {...register("nome", { required: "Informe o nome do evento" })}
            type="text"
            className="input-base"
            placeholder="Nome do evento"
          />
          {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label-base">Descrição</label>
          <textarea
            {...register("descricao")}
            rows={4}
            className="input-base resize-none"
            placeholder="Descrição breve do evento"
          />
        </div>

        <div>
          <label className="label-base">Data de início *</label>
          <input
            {...register("data_inicio", { required: "Informe a data de início" })}
            type="date"
            className="input-base"
          />
          {errors.data_inicio && <p className="text-red-400 text-xs mt-1">{errors.data_inicio.message}</p>}
        </div>

        <div>
          <label className="label-base">Data de fim</label>
          <input
            {...register("data_fim")}
            type="date"
            className="input-base"
            min={dataInicio}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-base">Status do evento</label>
          <label className="flex items-center gap-3 bg-night-900 border border-night-700 rounded-lg px-4 py-3 cursor-pointer">
            <input
              {...register("ativo")}
              type="checkbox"
              className="h-4 w-4 rounded border-night-600 bg-night-900 text-brand-400 focus:ring-brand-400"
            />
            <div>
              <span className="text-sm text-white block">Evento ativo</span>
              <span className="text-xs text-night-500">Desmarcar define o status como Cancelado</span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar evento"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 border border-red-400/20 transition-colors"
          >
            Excluir evento
          </button>
        )}
      </div>
    </form>
  );
}
