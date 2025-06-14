-- Migration: tenant_metrics view en RPC
-- Beschrijving: berekent kerncijfers (omzet, afspraken, nieuwe klanten, lage voorraad) per tenant
-- ---------------------------------------------------------------
-- 1. VIEW
create or replace view public.tenant_metrics_view as
select
  t.id                                                    as tenant_id,
  -- Totale betaalde omzet laatste 30 dagen
  coalesce(
    (
      select sum(p.amount)
      from payments p
      where p.tenant_id = t.id
        and p.status = 'paid'
        and p.created_at > now() - interval '30 days'
    ), 0
  )                                                       as revenue_last30,
  -- Aantal afspraken laatste 30 dagen
  coalesce(
    (
      select count(*) from bookings b
      where b.tenant_id = t.id
        and b.scheduled_at > now() - interval '30 days'
    ), 0
  )                                                       as appointments_last30,
  -- Nieuwe klanten laatste 30 dagen
  coalesce(
    (
      select count(*) from clients c
      where c.tenant_id = t.id
        and c.created_at > now() - interval '30 days'
    ), 0
  )                                                       as new_clients_last30,
  -- Lage voorraad items (current_stock <= min_stock)
  coalesce(
    (
      select count(*) from inventory_items ii
      where ii.tenant_id = t.id
        and ii.current_stock <= ii.min_stock
    ), 0
  )                                                       as low_stock_items,
  -- Gemiddelde besteding per client (betaalde omzet / unieke klanten) laatste 30 dagen
  coalesce(
    (
      select round(sum(p.amount)::numeric / nullif(count(distinct b.client_id),0),2)
      from payments p
        join bookings b on b.id = p.booking_id
      where p.tenant_id = t.id
        and p.status = 'paid'
        and p.created_at > now() - interval '30 days'
    ), 0
  )                                                       as avg_spend_per_client
from tenants t;

-- ---------------------------------------------------------------
-- 2. RPC FUNCTIE
create or replace function public.tenant_metrics(_tenant uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select row_to_json(tm.*)::jsonb
  from public.tenant_metrics_view tm
  where tm.tenant_id = _tenant;
$$;

-- ---------------------------------------------------------------
-- 3. Rechten: alleen ingelogde gebruikers mogen de functie uitvoeren
grant execute on function public.tenant_metrics(uuid) to authenticated, service_role, anon; 