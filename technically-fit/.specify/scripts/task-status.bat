@echo off
REM Task Status Checker
echo Checking wearable development task status...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\run-wearable-tasks.ps1" -Status

echo.
echo Press any key to continue...
pause > nul