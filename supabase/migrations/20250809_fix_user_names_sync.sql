-- Fix user names sync from auth metadata to users table
-- This migration updates the handle_user_signup trigger to properly copy first_name and last_name
-- and fixes existing users who have empty names

-- First, update the trigger function to properly copy names from metadata
CREATE OR REPLACE FUNCTION public.handle_user_signup()
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

    -- Als de user al een tenant_id heeft, niets doen
    IF NEW.raw_user_meta_data ? 'tenant_id' THEN
        RETURN NEW;
    END IF;

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

-- Fix existing users who have empty names but have names in auth metadata
UPDATE public.users u
SET 
    first_name = COALESCE(a.raw_user_meta_data ->> 'first_name', u.first_name),
    last_name = COALESCE(a.raw_user_meta_data ->> 'last_name', u.last_name),
    updated_at = NOW()
FROM auth.users a
WHERE 
    u.id = a.id 
    AND (u.first_name = '' OR u.last_name = '' OR u.first_name IS NULL OR u.last_name IS NULL)
    AND a.raw_user_meta_data ? 'first_name';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'User names sync migration completed. Updated trigger and fixed existing users.';
END $$;