"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, ClienteForm as IClienteForm } from "@/types";

// ─── Seletor de data de nascimento ────────────────────────────────────────────
// Ano → Mês → Dia em dropdowns + campo de texto DD/MM/AAAA
// Abre com ~30 anos atrás no topo da lista de anos

const MESES_LABEL = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

interface NascimentoPickerProps {
  value: string;          // formato YYYY-MM-DD ou ""
  onChange: (v: string) => void;
}

function NascimentoPicker({ value, onChange }: NascimentoPickerProps) {
  // Extrair partes do valor atual
  const [anoStr, mesStr, diaStr] = value ? value.split("-") : ["", "", ""];

  // Campo de texto para entrada manual
  const [texto, setTexto] = useState(() => {
    if (anoStr && mesStr && diaStr)
      return `${diaStr.padStart(2,"0")}/${mesStr.padStart(2,"0")}/${anoStr}`;
    return "";
  });

  // Lista de anos: da ~30 anos atrás até 5 anos atrás (mais novo), depois mais antigos
  // Ordem: anos próximos a 30 anos atrás ficam no topo da lista
  const anos = useMemo(() => {
    const atual       = new Date().getFullYear();
    const anoMaisNovo = atual - 5;    // mínimo 5 anos
    const anoMaisVelho = atual - 90;  // máximo 90 anos
    return Array.from(
      { length: anoMaisNovo - anoMaisVelho + 1 },
      (_, i) => anoMaisNovo - i        // decrescente: mais jovem primeiro
    );
  }, []);

  // Quantidade de dias no mês selecionado
  const diasNoMes = useMemo(() => {
    if (anoStr && mesStr)
      return new Date(Number(anoStr), Number(mesStr), 0).getDate();
    return 31;
  }, [anoStr, mesStr]);

  function emitir(a: string, m: string, d: string) {
    if (a && m && d) {
      const padM = m.padStart(2, "0");
      const padD = d.padStart(2, "0");
      onChange(`${a}-${padM}-${padD}`);
      setTexto(`${padD}/${padM}/${a}`);
    } else {
      onChange("");
    }
  }

  // Auto-formatação DD/MM/AAAA ao digitar no campo de texto
  function handleTexto(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let fmt = digits;
    if (digits.length > 2) fmt = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) fmt = fmt.slice(0, 5) + "/" + digits.slice(4);
    setTexto(fmt);

    const match = fmt.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, d, m, a] = match;
      const numA = Number(a), numM = Number(m), numD = Number(d);
      const anoAtual = new Date().getFullYear();
      if (numA >= 1920 && numA <= anoAtual - 5 &&
          numM >= 1   && numM <= 12 &&
          numD >= 1   && numD <= 31) {
        onChange(`${a}-${m}-${d}`);
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* Dropdowns: Ano → Mês → Dia */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <select
            value={anoStr}
            onChange={e => emitir(e.target.value, mesStr, diaStr)}
            className="input-base text-sm"
          >
            <option value="">Ano</option>
            {anos.map(a => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={mesStr}
            onChange={e => emitir(anoStr, e.target.value, diaStr)}
            className="input-base text-sm"
          >
            <option value="">Mês</option>
            {MESES_LABEL.map((nome, i) => {
              const v = String(i + 1).padStart(2, "0");
              return <option key={v} value={v}>{nome}</option>;
            })}
          </select>
        </div>
        <div>
          <select
            value={diaStr ? diaStr.padStart(2, "0") : ""}
            onChange={e => emitir(anoStr, mesStr, e.target.value)}
            className="input-base text-sm"
          >
            <option value="">Dia</option>
            {Array.from({ length: diasNoMes }, (_, i) =>
              String(i + 1).padStart(2, "0")
            ).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campo de texto para digitar manualmente */}
      <input
        type="text"
        value={texto}
        onChange={e => handleTexto(e.target.value)}
        placeholder="DD/MM/AAAA — ou use os campos acima"
        maxLength={10}
        inputMode="numeric"
        className="input-base text-sm text-night-300 placeholder-night-600"
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cliente?: Cliente;
  redirectTo?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ClienteForm({ cliente, redirectTo }: Props) {
  const router  = useRouter();
  const supabase = createClient() as any;
  const isEdit  = !!cliente;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IClienteForm>({
    defaultValues: cliente
      ? {
          nome:            cliente.nome,
          cpf:             cliente.cpf             ?? "",
          telefone:        cliente.telefone         ?? "",
          email:           cliente.email            ?? "",
          data_nascimento: cliente.data_nascimento  ?? "",
          genero:          cliente.genero           ?? undefined,
          observacoes:     cliente.observacoes      ?? "",
        }
      : {},
  });

  const dataNascimentoValue = watch("data_nascimento") ?? "";

  async function onSubmit(data: IClienteForm) {
    const payload = {
      nome:            data.nome,
      cpf:             data.cpf             || null,
      telefone:        data.telefone        || null,
      email:           data.email           || null,
      data_nascimento: data.data_nascimento || null,
      genero:          data.genero          || null,
      observacoes:     data.observacoes     || null,
    };

    if (isEdit) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", cliente.id);
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
          <input {...register("cpf")} className="input-base" placeholder="000.000.000-00" />
        </div>

        {/* Telefone */}
        <div>
          <label className="label-base">WhatsApp / Telefone</label>
          <input {...register("telefone")} className="input-base" placeholder="(11) 99999-9999" />
        </div>

        {/* Email */}
        <div>
          <label className="label-base">E-mail</label>
          <input {...register("email")} type="email" className="input-base" placeholder="email@exemplo.com" />
        </div>

        {/* Data de nascimento — picker Ano / Mês / Dia */}
        <div>
          <label className="label-base">Data de nascimento</label>
          {/* Campo hidden mantém o valor no react-hook-form */}
          <input type="hidden" {...register("data_nascimento")} />
          <NascimentoPicker
            value={dataNascimentoValue}
            onChange={(val) => setValue("data_nascimento", val, { shouldValidate: false })}
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
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
