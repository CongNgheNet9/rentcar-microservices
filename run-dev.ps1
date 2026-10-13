# Script to start all microservices and frontend concurrently

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  Starting RideLux Vehicle Rental Microservices & Web App  " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

$scriptRoot = $PSScriptRoot

# 0. Pre-build the entire backend solution to avoid DLL lock race conditions
Write-Host "[0/5] Pre-building Solution (RentCar.sln)..." -ForegroundColor Cyan
dotnet build "$scriptRoot\src\backend\RentCar.sln" -c Debug
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Solution build failed. Please fix errors before launching." -ForegroundColor Red
    exit 1
}

# 1. Start User Service (Port 5001)
Write-Host "[1/5] Launching UserService on http://localhost:5001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\src\backend\RentCar.UserService'; dotnet run --no-build"

Start-Sleep -Seconds 2

# 2. Start Vehicle Service (Port 5002)
Write-Host "[2/5] Launching VehicleService on http://localhost:5002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\src\backend\RentCar.VehicleService'; dotnet run --no-build"

Start-Sleep -Seconds 2

# 3. Start Booking Service (Port 5003)
Write-Host "[3/5] Launching BookingService on http://localhost:5003..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\src\backend\RentCar.BookingService'; dotnet run --no-build"

Start-Sleep -Seconds 2

# 4. Start API Gateway / YARP (Port 5000)
Write-Host "[4/5] Launching Gateway on http://localhost:5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\src\backend\RentCar.Gateway'; dotnet run --no-build"

Start-Sleep -Seconds 2

# 5. Start Frontend (Port 5173)
Write-Host "[5/5] Launching Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\src\frontend'; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " All services launched successfully!                      " -ForegroundColor Green
Write-Host " Web Application: http://localhost:5173                  " -ForegroundColor Green
Write-Host " API Gateway:     http://localhost:5000                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
