@echo off
title RideLux Database Inspector
dotnet run --project "%~dp0src\tools\RentCar.DbViewer"
echo.
pause
