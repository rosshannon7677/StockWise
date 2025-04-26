# Daily startup script
Write-Host "Starting StockWise development environment..."

# Start ML service in new terminal
Start-Process powershell -ArgumentList "-NoExit -Command cd '$PSScriptRoot\ml_service'; uvicorn api:app --reload --host 0.0.0.0 --port 8000"

# Start Ionic frontend
Write-Host "Starting Ionic frontend..."
ionic serve