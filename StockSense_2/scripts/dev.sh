#!/bin/bash

echo -e "\033[0;32mStarting StockSense Development Environment...\033[0m"

# Cleanup function jab script stop (Ctrl+C) ho
cleanup() {
    echo -e "\033[0;31mStopping all services...\033[0m"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# 1. Backend start karein (Background me)
echo -e "\033[0;33mStarting Backend Services...\033[0m"
(cd backend && uvicorn main:app --reload --port 8000) &

# 2. Frontend start karein (Background me)
echo -e "\033[0;33mStarting Frontend Next.js App...\033[0m"
(cd frontend && npm run dev) &

echo -e "\033[0;32mBoth services started!\033[0m"
echo -e "\033[0;36mFrontend: http://localhost:3000\033[0m"
echo -e "\033[0;36mBackend:  http://localhost:8000\033[0m"

# Process ko active rakhne ke liye
wait