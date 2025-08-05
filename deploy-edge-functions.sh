#!/bin/bash

# Deploy Edge Functions Script
# This script deploys all edge functions to Supabase

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Deploy each edge function
echo "📦 Deploying send-booking-confirmation..."
supabase functions deploy send-booking-confirmation

echo "📦 Deploying send-booking-reminder..."
supabase functions deploy send-booking-reminder

echo "📦 Deploying send-welcome-email..."
supabase functions deploy send-welcome-email

echo "📦 Deploying send-payment-reminder..."
supabase functions deploy send-payment-reminder

echo "📦 Deploying booking-reminder-scheduler..."
supabase functions deploy booking-reminder-scheduler

echo "✅ All edge functions deployed successfully!"
echo ""
echo "📌 Don't forget to:"
echo "1. Set up the GitHub Action secrets for automated scheduling"
echo "2. Configure the RESEND_API_KEY in your Supabase project settings"
echo "3. Apply the database migration for the cron job (if using pg_cron)"