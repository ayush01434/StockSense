#!/bin/bash

echo -e "\033[0;32mStarting StockSense Project Setup...\033[0m"

# 1. Frontend Dependencies Install Karein
echo -e "\033[0;33m[1/3] Installing Frontend Dependencies...\033[0m"
if [ -d "frontend" ]; then
    (cd frontend && npm install)
else
    echo -e "\033[0;31mError: frontend directory not found!\033[0m"
    exit 1
fi

# 2. Backend Dependencies / Environment Check
echo -e "\033[0;33m[2/3] Setting up Backend Environment...\033[0m"
if [ -d "backend" ]; then
    if [ -f "backend/requirements.txt" ]; then
        pip install -r backend/requirements.txt
    fi
fi

# 3. Executable Permissions for Scripts
echo -e "\033[0;33m[3/3] Setting execution permissions for scripts...\033[0m"
chmod +x scripts/*.sh 2>/dev/null || true

echo -e "\033[0;32mSetup complete! You can now run ./scripts/dev.sh to start the dev environment.\033[0m"