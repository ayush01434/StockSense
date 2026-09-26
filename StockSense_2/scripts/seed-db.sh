#!/bin/bash

echo -e "\033[0;32mSeeding local Supabase Database with dummy data...\033[0m"

# Supabase CLI check
if ! command -v supabase &> /dev/null
then
    echo -e "\033[0;31mError: Supabase CLI is not installed.\033[0m"
    echo -e "\033[0;33mInstall it via 'npm i -g supabase' or 'brew install supabase/tap/supabase'\033[0m"
    exit 1
fi

# Seed SQL file ko execute karein
if [ -f "supabase/seed.sql" ]; then
    supabase db execute --file supabase/seed.sql
    echo -e "\033[0;32mDatabase seeded successfully!\033[0m"
else
    echo -e "\033[0;31mError: supabase/seed.sql file not found.\033[0m"
    exit 1
fi