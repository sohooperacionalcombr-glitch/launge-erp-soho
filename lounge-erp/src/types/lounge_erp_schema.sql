create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid,
  email text unique not null,
  nome text not null default '',
  telefone text,
  role text not null default 'operador',
  avatar_url text,
  ativo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  telefone text,
  email text,
  data_nascimento date,
  genero text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists camarotes (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  descricao text,
  capacidade integer not null default 0,
  preco_base numeric(10,2) not null default 0,
  localizacao text,
  andar text,
  ativo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  descricao text,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  capacidade_max integer,
  ativo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  camarote_id uuid not null references camarotes(id),
  evento_id uuid not null references eventos(id),
  cliente_id uuid not null references clientes(id),
  promoter_id uuid references users(id),
  status text not null default 'pendente',
  num_pessoas integer not null default 1,
  valor_total numeric(10,2) not null default 0,
  valor_sinal numeric(10,2) not null default 0,
  desconto_pct numeric(5,2) not null default 0,
  codigo text unique default upper(substr(md5(random()::text), 1, 8)),
  observacoes text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;
alter table clientes enable row level security;
alter table camarotes enable row level security;
alter table eventos enable row level security;
alter table reservas enable row level security;

create policy "allow authenticated users" on users
for all to authenticated using (true) with check (true);

create policy "allow authenticated clientes" on clientes
for all to authenticated using (true) with check (true);

create policy "allow authenticated camarotes" on camarotes
for all to authenticated using (true) with check (true);

create policy "allow authenticated eventos" on eventos
for all to authenticated using (true) with check (true);

create policy "allow authenticated reservas" on reservas
for all to authenticated using (true) with check (true);