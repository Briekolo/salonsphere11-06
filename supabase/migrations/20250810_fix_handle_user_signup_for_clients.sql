-- Fix the handle_user_signup trigger to properly handle client users
-- This fixes the "Database error updating user" during client registration
--
-- Background: The current trigger checks for tenant_id in metadata to detect clients,
-- but still performs database operations that cause errors for client users.

-- Drop and recreate the function with proper client handling
CREATE OR REPLACE FUNCTION handle_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id    uuid;
    v_tenant_name  text;
    v_role         text;
    v_first_name   text;
    v_last_name    text;
BEGIN
    -- Forceer het verwachte search_path om privilege-escalatie te voorkomen
    PERFORM set_config('search_path', 'public,auth', TRUE);

    -- Check if this is a client user (has user_type = 'client')
    IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
        -- Client users are handled by the application, not this trigger
        -- Don't create tenant or user record, just return
        RETURN NEW;
    END IF;

    -- Als de user al een tenant_id heeft (maar geen client), niets doen
    IF NEW.raw_user_meta_data ? 'tenant_id' THEN
        RETURN NEW;
    END IF;

    -- Voor staff/admin users: proceed with tenant creation
    -- Haal salonnaam, rol, en namen uit metadata
    v_tenant_name := COALESCE(NEW.raw_user_meta_data ->> 'pending_tenant_name', 'Naamloos Salon');
    v_role        := COALESCE(NEW.raw_user_meta_data ->> 'role', 'admin');
    v_first_name  := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
    v_last_name   := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');

    -- 1) Maak tenant aan of haal bestaande op
    INSERT INTO public.tenants (name, email)
    VALUES (v_tenant_name, NEW.email)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tenant_id;

    -- Wanneer er al een tenant bestond (geen row returned)
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.tenants WHERE email = NEW.email;
    END IF;

    -- 2) Voeg bijhorende rij toe in application users-table met namen uit metadata
    INSERT INTO public.users (id, tenant_id, email, role, first_name, last_name)
    VALUES (NEW.id, v_tenant_id, NEW.email, v_role, v_first_name, v_last_name)
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
    WHERE public.users.first_name = '' OR public.users.last_name = '';

    -- 3) Schrijf tenant_id terug in de metadata
    UPDATE auth.users
    SET raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('tenant_id', v_tenant_id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;