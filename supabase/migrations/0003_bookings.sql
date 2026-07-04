-- Agendamentos
create type booking_status as enum (
  'aguardando_pagamento',
  'confirmado',
  'cancelado',
  'concluido'
);

create table bookings (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  service_id       uuid not null references services(id),
  date             date not null,
  time_slot        time not null,             -- ex: '09:00'
  client_name      text not null,
  client_phone     text not null,
  client_email     text,
  status           booking_status not null default 'aguardando_pagamento',
  total_amount     int4 not null,             -- em centavos
  deposit_amount   int4 not null,             -- em centavos
  remaining_amount int4 not null,             -- em centavos
  mp_preference_id text,                      -- ID da preferência criada no MP
  mp_payment_id    text,                      -- ID do pagamento confirmado no MP
  payment_method   text,                      -- 'pix' | 'credit_card' | null
  payment_at       timestamptz,
  notes            text,
  created_at       timestamptz default now()
);

-- Índice para checar conflito de horário
create unique index on bookings(tenant_id, date, time_slot)
  where status not in ('cancelado');

-- Índice para agenda do dono
create index on bookings(tenant_id, date);

alter table bookings enable row level security;

create policy "owner manages own bookings"
  on bookings for all
  using (tenant_id in (select id from tenants where owner_id = auth.uid()));

-- Inserção pública (sem autenticação) — via Server Action com validação
create policy "public can insert bookings"
  on bookings for insert
  with check (true);

-- Realtime para o painel do dono
alter publication supabase_realtime add table bookings;
