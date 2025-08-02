#!/bin/bash

# Deploy Edge Functions Script for SalonSphere - Belgium Timezone Update
# This script deploys all edge functions with the new Belgium timezone handling

echo "🚀 Deploying SalonSphere Edge Functions with Belgium Timezone..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Deploy each edge function
echo "📧 Deploying send-booking-confirmation..."
supabase functions deploy send-booking-confirmation

echo ""
echo "⏰ Deploying send-booking-reminder..."
supabase functions deploy send-booking-reminder

echo ""
echo "💰 Deploying send-payment-reminder..."
supabase functions deploy send-payment-reminder

echo ""
echo "📢 Deploying send-welcome-email..."
supabase functions deploy send-welcome-email

echo ""
echo "✅ All edge functions deployed successfully!"
echo ""
echo "🇧🇪 Belgium timezone (Europe/Brussels) is now active!"
echo ""
echo "Note: Make sure you're logged in to the correct Supabase project."
echo "Project ID: drwxswnfwctstgdorhdw"