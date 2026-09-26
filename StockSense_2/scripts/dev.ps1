# Local development environment start karne ke liye script

Write-Host "Starting StockSense Development Environment..." -ForegroundColor Green

# 1. Backend start karein
Write-Host "Starting Backend Services..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn main:app --reload --port 8000"

# 2. Frontend start karein
Write-Host "Starting Frontend Next.js App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both Frontend and Backend are running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan