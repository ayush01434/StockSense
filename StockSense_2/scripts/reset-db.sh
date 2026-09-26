#!/bin/bash

echo -e "\033[0;31mCAUTION: Resetting local Supabase Database...\033[0m"

# Supabase CLI installation check
if ! command -v supabase &> /dev/null
then
    echo -e "\033[0;31mError: Supabase CLI is not installed.\033[0m"
    echo -e "\033[0;33mInstall it via 'npm i -g supabase' or 'brew install supabase/tap/supabase'\033[0m"
    exit 1
fi

# Local Database reset aur migrations re-apply
echo -e "\033[0;33mApplying migrations and resetting schema...\033[0m"
supabase db reset

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mDatabase reset successfully!\033[0m"
else
    echo -e "\033[0;31mFailed to reset database.\033[0m"
    exit 1