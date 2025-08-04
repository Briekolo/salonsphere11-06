# Mollie Webhook Configuration Fix

## Issue
Payments were getting stuck in "pending" status because Mollie webhooks were not being received.

## Root Cause
Missing `NEXT_PUBLIC_SITE_URL` environment variable caused webhook URL to be incorrectly configured.

## Solution
Add the following to your production environment variables:

```
NEXT_PUBLIC_SITE_URL=https://salonsphere-three.vercel.app
```

## How it works
The mollieService.getWebhookUrl() method uses this priority:
1. NEXT_PUBLIC_SITE_URL (preferred)
2. VERCEL_URL (fallback)
3. localhost (development)

Without NEXT_PUBLIC_SITE_URL, the webhook URL may point to an inaccessible internal URL.

## Verification
After adding the environment variable, new payments should:
1. Create webhook URL: https://salonsphere-three.vercel.app/api/webhooks/mollie
2. Receive webhook calls from Mollie after payment completion
3. Automatically update payment and subscription status

## Manual Fix for Stuck Payments
If payments are stuck in "pending" status, they can be manually synced using the sync-payment-status endpoint or by updating the database directly.