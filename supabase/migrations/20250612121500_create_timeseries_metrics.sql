-- Migration: revenue & bookings timeseries views + RPC
-- ---------------------------------------------------------------
-- 1. Dagelijkse omzet per tenant
create or replace view public.revenue_daily as
select
  tenant_id,
  date_trunc('day', created_at)::date                       as day,
   sum(amount)::numeric(10,2)         as revenue
 ...
where status = 'completed'
 ...
group by tenant_id,
         date_trunc('day', created_at)::date;
-- 2. Dagelijkse afspraakcount per tenant
create or replace view public.bookings_daily as
select
  tenant_id,
  date_trunc('day', scheduled_at)::date as day,
  count(*)                            as bookings
from bookings
where status in ('scheduled','confirmed','completed')
group by tenant_id,
         date_trunc('day', scheduled_at)::date;

-- ---------------------------------------------------------------
-- 3. RPC functies
create or replace function public.revenue_timeseries(_tenant uuid, _from date, _to date)
returns table(day date, revenue numeric)
language sql
security definer
set search_path = public, pg_temp
as $$
  select day, revenue
  from public.revenue_daily
  where tenant_id = _tenant
    and day between _from and _to
  order by day;
$$;

grant execute on function public.revenue_timeseries(uuid, date, date) to authenticated, service_role, anon;

create or replace function public.bookings_timeseries(_tenant uuid, _from date, _to date)
returns table(day date, bookings bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select day, bookings
  from public.bookings_daily
  where tenant_id = _tenant
    and day between _from and _to
  order by day;
$$;

grant execute on function public.bookings_timeseries(uuid, date, date) to authenticated, service_role, anon; 