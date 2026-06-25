import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReservaStatus, EventoStatus, StatusFinanceiro, FormaPagamento } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Timezone helpers ─────────────────────────────────────────────────────────
// Strings "YYYY-MM-DD" (sem hora) são interpretadas como UTC midnight pelo JS.
// Em UTC-3 (América/São Paulo) isso descola o dia para o dia anterior.
// Solução: datas sem hora recebem T12:00:00-03:00 (meio-dia SP) antes de parsear.
const TZ = "America/Sao_Paulo";

function parseDateSP(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00-03:00");
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
    timeZone: TZ,
  }).format(parseDateSP(dateStr));
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(parseDateSP(dateStr));
}

/** Retorna o dia da semana em pt-BR, ex: "Sexta-feira" */
export function formatDiaSemana(dateStr: string): string {
  const dia = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: TZ,
  }).format(parseDateSP(dateStr));
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

/** Retorna data com dia da semana, ex: "Sexta-feira, 26/06/2026" */
export function formatDateComDia(dateStr: string): string {
  const d  = parseDateSP(dateStr);
  const fmtDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long",    timeZone: TZ }).format(d);
  const fmtDt  = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(d);
  return fmtDia.charAt(0).toUpperCase() + fmtDia.slice(1) + ", " + fmtDt;
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export const STATUS_CONFIG: Record<
  ReservaStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  livre: {
    label: "Livre",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  pendente: {
    label: "Pendente",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  confirmado: {
    label: "Reservado",
    color: "text-brand-400",
    bg: "bg-brand-400/10",
    dot: "bg-brand-400",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-400",
    bg: "bg-red-400/10",
    dot: "bg-red-400",
  },
};

export function normalizeReservaStatus(status: string | null | undefined): ReservaStatus {
  if (status === "confirmado") return "confirmado";
  if (status === "pendente") return "pendente";
  if (status === "cancelado") return "cancelado";
  return "livre";
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export function calcStatusFinanceiro(
  formaPagamento: FormaPagamento | string | null | undefined,
  valorTotal: number,
  valorRecebido: number
): StatusFinanceiro {
  if (formaPagamento === "cortesia")                      return "cortesia";
  if (formaPagamento === "permuta")                       return "permuta";
  if (formaPagamento === "network" || formaPagamento === "socio") return "network";
  if (valorRecebido >= valorTotal && valorTotal > 0)      return "pago_integralmente";
  if (valorRecebido > 0)                                  return "pago_parcialmente";
  return "aguardando_sinal";
}

export const STATUS_FINANCEIRO_CONFIG: Record<
  StatusFinanceiro,
  { label: string; color: string; bg: string; dot: string }
> = {
  aguardando_sinal:   { label: "Pendente",       color: "text-amber-400",   bg: "bg-amber-400/10",   dot: "bg-amber-400"   },
  sinal_pago:         { label: "Sinal pago",     color: "text-sky-400",     bg: "bg-sky-400/10",     dot: "bg-sky-400"     },
  pago_parcialmente:  { label: "Parcial",        color: "text-orange-400",  bg: "bg-orange-400/10",  dot: "bg-orange-400"  },
  pago_integralmente: { label: "Quitado",        color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  network:            { label: "Network / Sócio",color: "text-purple-400",  bg: "bg-purple-400/10",  dot: "bg-purple-400"  },
  cortesia:           { label: "Cortesia",       color: "text-sky-400",     bg: "bg-sky-400/10",     dot: "bg-sky-400"     },
  permuta:            { label: "Permuta",        color: "text-brand-400",   bg: "bg-brand-400/10",   dot: "bg-brand-400"   },
};

// ─── Eventos ──────────────────────────────────────────────────────────────────

export function getEventoStatus(
  evento: { ativo: boolean; data_fim: string | null },
  now: Date = new Date()
): EventoStatus {
  if (!evento.ativo) return "cancelado";
  if (evento.data_fim && parseDateSP(evento.data_fim) < now) return "realizado";
  return "ativo";
}

export const EVENTO_STATUS_CONFIG: Record<
  EventoStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  ativo:     { label: "Ativo",     color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  realizado: { label: "Realizado", color: "text-sky-400",     bg: "bg-sky-400/10",     dot: "bg-sky-400"     },
  cancelado: { label: "Cancelado", color: "text-red-400",     bg: "bg-red-400/10",     dot: "bg-red-400"     },
};

export const CAMAROTES_SEED = [
  { nome: "Gold 1",     descricao: "Camarote Gold linha superior",  capacidade: 10, preco_base: 3500, localizacao: "Setor Gold",   andar: "1º Andar" },
  { nome: "Gold 2",     descricao: "Camarote Gold linha superior",  capacidade: 10, preco_base: 3500, localizacao: "Setor Gold",   andar: "1º Andar" },
  { nome: "Dom Julio 1",descricao: "Camarote premium Dom Julio",    capacidade: 8,  preco_base: 5000, localizacao: "Setor Premium", andar: "Mezanino" },
  { nome: "Dom Julio 2",descricao: "Camarote premium Dom Julio",    capacidade: 8,  preco_base: 5000, localizacao: "Setor Premium", andar: "Mezanino" },
  { nome: "Lounge 3",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 4",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 5",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 6",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 7",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 8",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2000, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 9",   descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 10",  descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 11",  descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 12",  descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 13",  descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
  { nome: "Lounge 14",  descricao: "Lounge VIP",                    capacidade: 6,  preco_base: 2200, localizacao: "Área Lounge",  andar: "Térreo" },
];
