# Registration Debug Guide

## 🎉 ISSUE FIXED!

The registration issue has been resolved. The problem was a function called `set_claim` that was trying to access a column `app_metadata` which doesn't exist in Supabase. The correct column name is `raw_app_meta_data`.

### What was fixed:
- Applied migration `fix_set_claim_function_app_metadata_column` 
- Updated the `set_claim` function to use `raw_app_meta_data` instead of `app_metadata`

### To verify the fix:
1. Open `test-fix-verification.html` in your browser
2. Click "Test Registration Now"
3. You should see a success message

---

## Quick Start

I've created several tools to help debug the registration issue. Follow these steps:

### 1. Test with Debug HTML Page

Open `debug-registration.html` in your browser:
```bash
open debug-registration.html
```

Click through the tests in order:
1. **Test Supabase Connection** - Verifies the project is accessible
2. **Check Auth Config** - Checks if signup is enabled
3. **Check DB Trigger** - Verifies the trigger is working
4. **Attempt Registration** - Creates a test user
5. **Check Recent Signups** - Views recent registration attempts

### 2. Test in Development Environment

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. Open browser console and navigate to: http://localhost:3000

3. Load the test script:
   ```javascript
   const script = document.createElement('script');
   script.src = '/test-registration.js';
   document.head.appendChild(script);
   ```

4. Run the tests:
   ```javascript
   // Monitor all auth requests
   monitorAuthRequests();
   
   // Test registration via form
   testSignUpForm();
   
   // Or test direct API
   testRegistration();
   ```

### 3. Check Logs

The enhanced logging will show:
- `[SignUpForm]` - Form submission and UI events
- `[AuthProvider]` - Supabase auth calls and responses
- `[Auth Callback]` - Email confirmation handling

### 4. Common Issues to Check

#### Email Not Sending
- Check Supabase Dashboard > Auth > Settings > Email
- Verify SMTP settings if using custom provider
- Check rate limits (30 emails/hour default)
- Look in spam folder

#### Database Trigger Failing
- The trigger is already updated to extract names
- Check Postgres logs in Supabase Dashboard
- Verify trigger exists: `handle_user_signup`

#### Registration Errors
- "Database error saving new user" - Trigger or constraint issue
- "User already registered" - Email already exists
- "Email rate limit exceeded" - Wait 60 seconds
- "Signup is disabled" - Check auth settings

### 5. Manual Database Check

Run these queries in Supabase SQL Editor:

```sql
-- Check recent auth users
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- Check if users are created in public schema
SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id, t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.created_at > NOW() - INTERVAL '1 day'
ORDER BY u.created_at DESC
LIMIT 10;

-- Check trigger function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_user_signup';
```

### 6. Fix Verification

After identifying and fixing the issue:

1. Register a new test user
2. Verify email is received
3. Click confirmation link
4. Check redirect to `/onboarding` or dashboard
5. Verify user data in database:
   - `auth.users` has the user
   - `public.users` has first_name and last_name
   - `public.tenants` has the salon

## Files Created

1. **`/app/auth/callback/route.ts`** - Improved callback handler with logging
2. **`/components/auth/SignUpForm.tsx`** - Enhanced with detailed logging
3. **`/components/auth/AuthProvider.tsx`** - Added comprehensive error logging
4. **`test-registration.js`** - Browser console testing script
5. **`test-registration.html`** - Standalone test page
6. **`debug-registration.html`** - Comprehensive debug tool

## Next Steps

1. Open `debug-registration.html` and run through all tests
2. Check browser console for specific error messages
3. If emails aren't sending, check Supabase email settings
4. If database trigger is failing, check Postgres logs
5. Report findings with specific error messages