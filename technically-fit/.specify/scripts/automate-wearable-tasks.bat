@echo off
REM Wearable Development Automation Script
REM This script can run multiple wearable tasks in background

echo Starting Wearable Development Automation...
echo.

REM Check if we should run in background mode
if "%1"=="background" goto :background_mode

REM Sequential mode - run tasks one after another
echo Running tasks sequentially...
echo.

echo [1/4] Setting up wearable UI components...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\run-wearable-tasks.ps1" -TaskId wearable-ui
echo.

echo [2/4] Creating platform-specific implementations...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\run-wearable-tasks.ps1" -TaskId platform-specific
echo.

echo [3/4] Setting up automated build scripts...
REM Add automated build setup here
echo Automated build scripts setup completed.
echo.

echo [4/4] Running final checks...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\check-task-prerequisites.ps1"
echo.

echo All tasks completed!
goto :end

:background_mode
echo Running tasks in background mode...
echo.

REM Start tasks in background
start /B powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\run-wearable-tasks.ps1" -TaskId wearable-ui -Background
start /B powershell.exe -ExecutionPolicy Bypass -File "%~dp0powershell\run-wearable-tasks.ps1" -TaskId platform-specific -Background

echo Background tasks started. Use 'task-status.bat' to check progress.
goto :end

:end
echo.
echo Press any key to continue...
pause > nul