#!/bin/bash

# Deploy a single edge function to Supabase
# Usage: ./deploy-single-edge-function.sh <function-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide a function name${NC}"
    echo "Usage: ./deploy-single-edge-function.sh <function-name>"
    echo "Example: ./deploy-single-edge-function.sh send-booking-confirmation"
    exit 1
fi

FUNCTION_NAME=$1
FUNCTION_PATH="supabase/functions/$FUNCTION_NAME"

echo -e "${YELLOW}🚀 Deploying Edge Function: $FUNCTION_NAME${NC}"

# Check if function directory exists
if [ ! -d "$FUNCTION_PATH" ]; then
    echo -e "${RED}❌ Function directory not found: $FUNCTION_PATH${NC}"
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Deploy the function
echo -e "${YELLOW}📦 Deploying $FUNCTION_NAME...${NC}"
supabase functions deploy $FUNCTION_NAME --project-ref drwxswnfwctstgdorhdw

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully deployed $FUNCTION_NAME${NC}"
else
    echo -e "${RED}❌ Failed to deploy $FUNCTION_NAME${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"