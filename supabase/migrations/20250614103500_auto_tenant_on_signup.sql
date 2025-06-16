-- Auto-tenant-creatie en gebruikers-sync na signup
-- Beschrijving: maakt automatisch een rij in public.tenants en public.users aan
--              en vult tenant_id terug in de user-metadata.
-- Generated 2025-06-14

-- Zorg dat we alleen één keer bestaan
DROP FUNCTION IF EXISTS public.handle_user_signup CASCADE;

CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id    uuid;
    v_tenant_name  text;
    v_role         text;
BEGIN
    -- Forceer het verwachte search_path om privilege-escalatie te voorkomen
    PERFORM set_config('search_path', 'public,auth', TRUE);

    -- Als de user al een tenant_id heeft, niets doen
    IF NEW.raw_user_meta_data ? 'tenant_id' THEN
        RETURN NEW;
    END IF;

    -- Haal salonnaam & rol uit metadata (wanneer deze door de signup-flow wordt meegegeven)
    v_tenant_name := COALESCE(NEW.raw_user_meta_data ->> 'pending_tenant_name', 'Naamloos Salon');
    v_role        := COALESCE(NEW.raw_user_meta_data ->> 'role', 'admin');

    -- 1) Maak tenant aan of haal bestaande op
    INSERT INTO public.tenants (name, email)
    VALUES (v_tenant_name, NEW.email)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tenant_id;

    -- Wanneer er al een tenant bestond (geen row returned)
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.tenants WHERE email = NEW.email;
    END IF;

    -- 2) Voeg bijhorende rij toe in application users-table (idempotent)
    INSERT INTO public.users (id, tenant_id, email, role, first_name, last_name)
    VALUES (NEW.id, v_tenant_id, NEW.email, v_role, '', '')
    ON CONFLICT (id) DO NOTHING;

    -- 3) Schrijf tenant_id terug in de metadata
    UPDATE auth.users
    SET raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('tenant_id', v_tenant_id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger koppelen aan auth.users inserts
DROP TRIGGER IF EXISTS handle_user_signup_trigger ON auth.users;
CREATE TRIGGER handle_user_signup_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup(); 