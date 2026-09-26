#!/bin/bash

echo -e "\033[0;32mRunning Test Suites for StockSense...\033[0m"

# 1. Run Frontend Tests
echo -e "\033[0;33m[1/2] Running Frontend Tests (Jest / React Testing Library)...\033[0m"
if [ -d "frontend" ]; then
    (cd frontend && npm run test -- --watchAll=false)
    FRONTEND_EXIT=$?
else
    echo -e "\033[0;31mFrontend directory missing!\033[0m"
    FRONTEND_EXIT=1
fi

# 2. Run Backend Tests
echo -e "\033[0;33m[2/2] Running Backend Tests (pytest)...\033[0m"
if [ -d "backend" ]; then
    (cd backend && pytest)
    BACKEND_EXIT=$?
else
    echo -e "\033[0;31mBackend directory missing!\033[0m"
    BACKEND_EXIT=1
fi

# Summary Check
if [ $FRONTEND_EXIT -eq 0 ] && [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "\033[0;32mAll frontend and backend tests passed successfully!\033[0m"
    exit 0
else
    echo -e "\033[0;31mTest suite failed! Please check error logs above.\033[0m"
    exit 1
fi