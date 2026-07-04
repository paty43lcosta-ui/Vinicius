-- Tabela de serviços oferecidos por cada barbearia
create table services (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  price       int4 not null,       -- em centavos
  duration    int2 not null,       -- em minutos
  active      bool not null default true,
  position    int2 not null default 0,
  created_at  timestamptz default now()
);

alter table services enable row level security;

create policy "owner manages own services"
  on services for all
  using (tenant_id in (select id from tenants where owner_id = auth.uid()));

create policy "public reads active services"
  on services for select
  using (active = true);
