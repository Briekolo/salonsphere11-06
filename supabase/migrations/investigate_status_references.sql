-- This is a diagnostic script to find references to the removed 'status' field
-- Run this in Supabase SQL editor to identify the issue

-- 1. Check for triggers on bookings table
SELECT 
    tgname AS trigger_name,
    tgtype,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'bookings'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Search for functions that might reference 'status' in bookings context
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%bookings%' 
AND prosrc LIKE '%status%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Check RLS policies on bookings table for status references
SELECT 
    polname AS policy_name,
    polcmd AS command,
    pg_get_expr(polqual, polrelid) AS using_expression,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'public.bookings'::regclass
AND (
    pg_get_expr(polqual, polrelid)::text LIKE '%status%'
    OR pg_get_expr(polwithcheck, polrelid)::text LIKE '%status%'
);

-- 4. Check for any views that might reference bookings.status
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND definition LIKE '%bookings%'
AND definition LIKE '%status%';

-- 5. Check constraints on bookings table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass;

-- 6. Look for any custom types or domains that might be affected
SELECT 
    t.typname AS type_name,
    obj_description(t.oid, 'pg_type') AS description
FROM pg_type t
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND t.typname LIKE '%booking%';