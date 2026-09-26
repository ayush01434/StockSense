#!/bin/bash

echo -e "\033[0;32mGenerating Supabase TypeScript types...\033[0m"

# Output directory create karein agar nahi hai
mkdir -p shared/types

# Supabase CLI se database schema ke TypeScript types generate karein
if command -v supabase &> /dev/null
then
    supabase gen types typescript --local > shared/types/database.types.ts
    echo -e "\033[0;32mTypes successfully generated at shared/types/database.types.ts!\033[0m"
else
    echo -e "\033[0;31mError: Supabase CLI is not installed.\033[0m"
    echo -e "\033[0;33mPlease install it via 'npm i -g supabase' or 'brew install supabase/tap/supabase'\033[0m"
    exit 1
fi