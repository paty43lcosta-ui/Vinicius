-- View para o dashboard financeiro.
-- security_invoker garante que a RLS de `bookings` se aplica a quem consulta.
create view financial_summary
  with (security_invoker = true)
as
select
  tenant_id,
  date_trunc('month', date) as month,
  count(*) filter (where status = 'confirmado' or status = 'concluido') as total_bookings,
  sum(deposit_amount) filter (where status != 'cancelado') as total_deposits,
  sum(total_amount) filter (where status = 'concluido') as total_revenue
from bookings
group by tenant_id, date_trunc('month', date);
