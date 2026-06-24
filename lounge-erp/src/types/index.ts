// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "operador" | "promoter" | "portaria";

export type ReservaStatus = "livre" | "pendente" | "confirmado" | "cancelado";

export type FormaPagamento =
  | "pix"
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "transferencia"
  | "network"
  | "socio"
  | "cortesia"
  | "permuta";

export type StatusFinanceiro =
  | "aguardando_sinal"
  | "sinal_pago"
  | "pago_parcialmente"
  | "pago_integralmente"
  | "network"
  | "cortesia"
  | "permuta";

export type Genero =
  | "masculino"
  | "feminino"
  | "nao_binario"
  | "prefiro_nao_informar";

export type EventoStatus = "ativo" | "realizado" | "cancelado";

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  nome: string;
  telefone: string | null;
  role: UserRole;
  avatar_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  genero: Genero | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Camarate {
  id: string;
  nome: string;
  descricao: string | null;
  capacidade: number;
  preco_base: number;
  localizacao: string | null;
  andar: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  capacidade_max: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reserva {
  id: string;
  camarate_id: string;
  evento_id: string;
  cliente_id: string;
  promoter_id: string | null;
  promoter_responsavel?: string | null;
  status: ReservaStatus;
  num_pessoas: number;
  valor_total: number;
  valor_sinal: number;
  valor_recebido?: number | null;
  responsavel_pagamento?: string | null;
  forma_pagamento?: FormaPagamento | null;
  status_financeiro?: StatusFinanceiro | null;
  socio_responsavel?: string | null;
  cortesia_motivo?: string | null;
  cortesia_aprovador?: string | null;
  permuta_descricao?: string | null;
  permuta_valor_estimado?: number | null;
  desconto_pct: number;
  codigo: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // portaria
  checkin_realizado?: boolean;
  checkin_horario?: string | null;
  checkin_responsavel?: string | null;
  // joins
  camarate?: Camarate;
  cliente?: Cliente;
  evento?: Evento;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface ClienteForm {
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  genero?: Genero;
  observacoes?: string;
}

export interface ReservaForm {
  camarate_id: string;
  evento_id: string;
  cliente_id: string;
  promoter_responsavel?: string;
  status: ReservaStatus;
  num_pessoas: number;
  valor_total: number;
  valor_sinal?: number;
  valor_recebido?: number;
  forma_pagamento?: FormaPagamento;
  responsavel_pagamento?: string;
  status_financeiro?: StatusFinanceiro;
  socio_responsavel?: string;
  cortesia_motivo?: string;
  cortesia_aprovador?: string;
  permuta_descricao?: string;
  permuta_valor_estimado?: number;
  desconto_pct?: number;
  observacoes?: string;
}

// ─── Supabase Database ────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: any; Update: any };
      clientes: { Row: Cliente; Insert: any; Update: any };
      camarotes: { Row: Camarate; Insert: any; Update: any };
      eventos: { Row: Evento; Insert: any; Update: any };
      reservas: { Row: Reserva; Insert: any; Update: any };
    };
  };
};
