# LoungeERP — Módulo 1: Reservas de Camarotes

Sistema de gestão interno da Soho. MVP focado em reservas.

---

## Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS** — tema dark gold customizado
- **TypeScript** — tipagem completa
- **react-hook-form** — formulários
- **react-hot-toast** — notificações

---

## Setup em 5 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

Crie um projeto em [supabase.com](https://supabase.com) e copie as chaves:

```bash
cp .env.local.example .env.local
# Edite .env.local com suas chaves do Supabase
```

### 3. Criar o banco de dados

No **Supabase SQL Editor**, execute em ordem:

```
1. lounge_erp_schema.sql   ← schema completo com RLS
2. src/lib/seed.sql        ← camarotes + eventos de exemplo
```

> O arquivo `lounge_erp_schema.sql` está na raiz do projeto (gerado anteriormente).

### 4. Criar usuário admin

1. Supabase Dashboard → **Authentication → Users → Invite**
2. Insira o e-mail do administrador
3. No SQL Editor, execute:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
   ```

### 5. Rodar

```bash
npm run dev
# Acesse: http://localhost:3000
```

---

## Estrutura do projeto

```
src/
├── app/
│   ├── login/              ← Tela de login
│   └── dashboard/
│       ├── page.tsx        ← Dashboard com métricas
│       ├── camarotes/      ← Listagem de camarotes
│       ├── clientes/       ← CRUD de clientes
│       ├── reservas/       ← CRUD de reservas + status
│       └── calendario/     ← Grade de disponibilidade
├── components/
│   ├── layout/Sidebar.tsx  ← Navegação lateral
│   ├── forms/              ← LoginForm, ClienteForm, ReservaForm
│   ├── calendar/           ← CalendarioClient (grid interativo)
│   └── ui/StatusBadge.tsx  ← Badge de status
├── lib/
│   ├── supabase/           ← client.ts, server.ts, middleware.ts
│   ├── utils.ts            ← formatadores + STATUS_CONFIG
│   └── seed.sql            ← dados iniciais
└── types/index.ts          ← tipos TypeScript completos
```

---

## Camarotes configurados

| Setor     | Camarotes          | Capacidade | Preço base |
|-----------|-------------------|------------|------------|
| Gold      | Gold 1, Gold 2    | 10 pessoas | R$ 3.500   |
| Dom Julio | Dom Julio 1 e 2   | 8 pessoas  | R$ 5.000   |
| Lounge    | Lounge 3 ao 14    | 6 pessoas  | R$ 2.000–2.200 |

---

## Status de reserva

| Status     | Cor     | Significado                     |
|------------|---------|--------------------------------|
| Livre      | Verde   | Camarote disponível             |
| Pendente   | Âmbar   | Reserva aguardando confirmação  |
| Confirmado | Dourado | Reserva paga/confirmada         |
| Cancelado  | Vermelho| Reserva cancelada               |

---

## Próximos módulos (roadmap)

- **Módulo 2** — Promoters + Listas Free
- **Módulo 3** — Check-in + QR Code + Pulseiras
- **Módulo 4** — Financeiro + Comissões
- **Módulo 5** — App mobile para portaria
