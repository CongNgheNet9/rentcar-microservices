@echo off
title RideLux Launcher
echo ==========================================================
echo   Starting RideLux Vehicle Rental Microservices & Web App  
echo ==========================================================

set "ROOT=%~dp0"

echo [0/5] Pre-building Solution to avoid DLL file lock race conditions...
dotnet build "%ROOT%src\backend\RentCar.sln" -c Debug
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [1/5] Starting UserService (Port 5001)...
start "UserService (Port 5001)" cmd /k "cd /d %ROOT%src\backend\RentCar.UserService && dotnet run --no-build"
timeout /t 2 /nobreak >nul

echo [2/5] Starting VehicleService (Port 5002)...
start "VehicleService (Port 5002)" cmd /k "cd /d %ROOT%src\backend\RentCar.VehicleService && dotnet run --no-build"
timeout /t 2 /nobreak >nul

echo [3/5] Starting BookingService (Port 5003)...
start "BookingService (Port 5003)" cmd /k "cd /d %ROOT%src\backend\RentCar.BookingService && dotnet run --no-build"
timeout /t 2 /nobreak >nul

echo [4/5] Starting API Gateway / YARP (Port 5000)...
start "API Gateway (Port 5000)" cmd /k "cd /d %ROOT%src\backend\RentCar.Gateway && dotnet run --no-build"
timeout /t 2 /nobreak >nul

echo [5/5] Starting Frontend Web App (Port 5173)...
start "Frontend (Port 5173)" cmd /k "cd /d %ROOT%src\frontend && npm run dev"

echo.
echo ==========================================================
echo  All services have been launched!
echo  Website:     http://localhost:5173
echo  API Gateway: http://localhost:5000
echo ==========================================================
echo.
pause
