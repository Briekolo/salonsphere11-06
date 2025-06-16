-- Popular services per tenant binnen periode
create or replace view public.popular_services_daily as
select
  tenant_id,
  service_id,
  date_trunc('day', scheduled_at)::date as day,
  count(*) as bookings
from bookings
where status in ('scheduled','confirmed','completed')
group by tenant_id, service_id, day;

-- RPC om top diensten terug te geven
create or replace function public.popular_services(
  _tenant uuid,
  _from date,
  _to date,
  _limit int default 5
)
returns table(service_name text, total bigint, percentage numeric)
language sql
security definer
set search_path = public, pg_temp
as $$
  with agg as (
    select s.name, sum(ps.bookings) as total
    from public.popular_services_daily ps
    join services s on s.id = ps.service_id
    where ps.tenant_id = _tenant
      and ps.day between _from and _to
    group by s.name
  ), total_sum as (
    select sum(total) as grand_total from agg
  )
  select a.name as service_name,
         a.total,
         round((a.total / nullif(ts.grand_total,0)) * 100, 1) as percentage
  from agg a, total_sum ts
  order by total desc
  limit _limit;
$$;

grant execute on function public.popular_services(uuid, date, date, int) to authenticated, anon, service_role; 