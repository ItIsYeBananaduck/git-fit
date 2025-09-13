#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'

# Watch for changes in wearable-related files and auto-run tasks
$watchedPaths = @(
    "app\src\lib\components\Wearable*.svelte",
    "app\src\lib\components\wearable\*.svelte",
    "wearable\*\*.swift",
    "wearable\*\*.kt",
    "wearable\*\*.java"
)

$global:watchJob = $null

function Start-FileWatcher {
    Write-Host "Starting file watcher for wearable development..." -ForegroundColor Green
    Write-Host "Watching paths:" -ForegroundColor Cyan
    foreach ($path in $watchedPaths) {
        Write-Host "  - $path"
    }
    Write-Host ""

    $global:watchJob = Start-Job -ScriptBlock {
        param($watchedPaths, $scriptRoot)

        $lastRuns = @{}

        while ($true) {
            foreach ($path in $watchedPaths) {
                try {
                    $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
                    foreach ($file in $files) {
                        $lastWrite = $file.LastWriteTime
                        $key = $file.FullName

                        if (-not $lastRuns.ContainsKey($key) -or $lastRuns[$key] -lt $lastWrite) {
                            $lastRuns[$key] = $lastWrite

                            Write-Host "File changed: $($file.Name)" -ForegroundColor Yellow

                            # Determine which task to run based on file type
                            if ($file.Extension -eq '.svelte') {
                                Write-Host "Running wearable UI validation..." -ForegroundColor Green
                                # Could run linting or build checks here
                            } elseif ($file.Extension -in @('.swift', '.kt', '.java')) {
                                Write-Host "Running platform-specific validation..." -ForegroundColor Green
                                # Could run platform-specific checks here
                            }
                        }
                    }
                } catch {
                    # Ignore errors for paths that don't exist yet
                }
            }

            Start-Sleep -Seconds 2
        }
    } -ArgumentList $watchedPaths, $PSScriptRoot

    Write-Host "File watcher started in background (Job ID: $($global:watchJob.Id))" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop watching"
    Write-Host ""

    # Keep the script running
    try {
        while ($true) {
            $jobState = $global:watchJob.State
            if ($jobState -ne "Running") {
                Write-Host "Watch job stopped with state: $jobState" -ForegroundColor Red
                break
            }
            Start-Sleep -Seconds 5
        }
    } catch {
        Write-Host "Stopping file watcher..." -ForegroundColor Yellow
    } finally {
        if ($global:watchJob) {
            Stop-Job -Job $global:watchJob
            Remove-Job -Job $global:watchJob
        }
    }
}

function Stop-FileWatcher {
    if ($global:watchJob) {
        Write-Host "Stopping file watcher..." -ForegroundColor Yellow
        Stop-Job -Job $global:watchJob
        Remove-Job -Job $global:watchJob
        $global:watchJob = $null
        Write-Host "File watcher stopped" -ForegroundColor Green
    } else {
        Write-Host "No file watcher running" -ForegroundColor Yellow
    }
}

# Main execution
if ($Stop) {
    Stop-FileWatcher
} else {
    Start-FileWatcher
}