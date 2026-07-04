-- Tabela de barbearias (tenants)
create table tenants (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  slug         text not null unique,
  name         text not null,
  address      text,
  phone        text,
  hours_start  int2 not null default 9,   -- hora de abertura (0–23)
  hours_end    int2 not null default 19,  -- hora de fechamento
  working_days int2[] not null default '{1,2,3,4,5,6}', -- 0=Dom…6=Sáb
  mp_access_token text,                   -- token OAuth do Mercado Pago do dono
  deposit_pct  int2 not null default 30,  -- % do sinal cobrado online
  deposit_min  int4 not null default 1000,-- valor mínimo do sinal em centavos
  active       bool not null default true,
  created_at   timestamptz default now()
);

-- Índice para lookup por slug (rota pública)
create index on tenants(slug);

-- RLS: dono só acessa o próprio tenant
alter table tenants enable row level security;

create policy "owner can manage own tenant"
  on tenants for all
  using (owner_id = auth.uid());

-- Leitura pública para a página de agendamento
create policy "public can read active tenants"
  on tenants for select
  using (active = true);
