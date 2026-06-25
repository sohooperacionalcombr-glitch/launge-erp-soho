"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, ClienteForm as IClienteForm } from "@/types";

interface Props {
  cliente?: Cliente;
  redirectTo?: string;
}

export function ClienteForm({ cliente, redirectTo }: Props) {
  const router = useRouter();
  const supabase = createClient() as any;
  const isEdit = !!cliente;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IClienteForm>({
    defaultValues: cliente
      ? {
          nome: cliente.nome,
          cpf: cliente.cpf ?? "",
          telefone: cliente.telefone ?? "",
          email: cliente.email ?? "",
          data_nascimento: cliente.data_nascimento ?? "",
          genero: cliente.genero ?? undefined,
          observacoes: cliente.observacoes ?? "",
        }
      : {},
  });

  async function onSubmit(data: IClienteForm) {
    const payload = {
      nome: data.nome,
      cpf: data.cpf || null,
      telefone: data.telefone || null,
      email: data.email || null,
      data_nascimento: data.data_nascimento || null,
      genero: data.genero || null,
      observacoes: data.observacoes || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", cliente.id);

      if (error) { toast.error("Erro ao atualizar cliente."); return; }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("clientes").insert(payload);
      if (error) { toast.error("Erro ao cadastrar cliente."); return; }
      toast.success("Cliente cadastrado!");
    }

    router.push(redirectTo ?? "/dashboard/clientes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="sm:col-span-2">
          <label className="label-base">Nome completo *</label>
          <input
            {...register("nome", { required: "Nome é obrigatório" })}
            className="input-base"
            placeholder="Nome do cliente"
          />
          {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        {/* CPF */}
        <div>
          <label className="label-base">CPF</label>
          <input
            {...register("cpf")}
            className="input-base"
            placeholder="000.000.000-00"
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="label-base">WhatsApp / Telefone</label>
          <input
            {...register("telefone")}
            className="input-base"
            placeholder="(11) 99999-9999"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label-base">E-mail</label>
          <input
            {...register("email")}
            type="email"
            className="input-base"
            placeholder="email@exemplo.com"
          />
        </div>

        {/* Data nascimento */}
        <div>
          <label className="label-base">Data de nascimento</label>
          <input
            {...register("data_nascimento")}
            type="date"
            className="input-base"
          />
        </div>

        {/* Gênero */}
        <div>
          <label className="label-base">Gênero</label>
          <select {...register("genero")} className="input-base">
            <option value="">Selecionar</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="nao_binario">Não-binário</option>
            <option value="prefiro_nao_informar">Prefiro não informar</option>
          </select>
        </div>

        {/* Observações */}
        <div className="sm:col-span-2">
          <label className="label-base">Observações</label>
          <textarea
            {...register("observacoes")}
            className="input-base resize-none"
            rows={3}
            placeholder="Preferências, alergias, notas internas…"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar cliente"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
