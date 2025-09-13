#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$Background,
    [Parameter(Mandatory=$false)]
    [string]$TaskId,
    [Parameter(Mandatory=$false)]
    [switch]$Status
)

$ErrorActionPreference = 'Stop'

# Import common functions
. "$PSScriptRoot/common.ps1"

function Show-TaskStatus {
    Write-Host "=== Wearable Development Task Status ===" -ForegroundColor Cyan
    Write-Host ""

    $tasks = @(
        @{ Id = "wearable-ui"; Name = "Wearable Workout UI"; Status = "Not Started" },
        @{ Id = "watch-complications"; Name = "Apple Watch Complications"; Status = "Not Started" },
        @{ Id = "platform-specific"; Name = "Platform-Specific Code"; Status = "Not Started" },
        @{ Id = "strain-integration"; Name = "Strain Logic Integration"; Status = "Not Started" },
        @{ Id = "automated-builds"; Name = "Automated Build Scripts"; Status = "Not Started" }
    )

    foreach ($task in $tasks) {
        $statusColor = switch ($task.Status) {
            "Completed" { "Green" }
            "In Progress" { "Yellow" }
            default { "Red" }
        }
        Write-Host "[$($task.Id)] $($task.Name)" -NoNewline
        Write-Host " - $($task.Status)" -ForegroundColor $statusColor
    }
}

function Start-WearableUITask {
    Write-Host "Starting Wearable Workout UI implementation..." -ForegroundColor Green

    if ($Background) {
        # Run in background
        $job = Start-Job -ScriptBlock {
            param($scriptRoot)
            Set-Location "$scriptRoot\..\..\.."
            Write-Host "Background job: Creating wearable UI components..."

            # Create wearable UI structure
            $wearableDir = "app\src\lib\components\wearable"
            if (!(Test-Path $wearableDir)) {
                New-Item -ItemType Directory -Path $wearableDir -Force
            }

            # Create basic wearable components
            $components = @(
                "WearableWorkoutScreen.svelte",
                "WearableSetControls.svelte",
                "WearableFeedbackButtons.svelte",
                "WearableHRMonitor.svelte"
            )

            foreach ($component in $components) {
                $filePath = Join-Path $wearableDir $component
                if (!(Test-Path $filePath)) {
                    Set-Content -Path $filePath -Value "<!-- $component - Auto-generated wearable component -->`n<script>`n  // TODO: Implement wearable-specific logic`n</script>`n`n<div class='wearable-component'>`n  <!-- Wearable UI content -->`n</div>"
                }
            }

            Write-Host "Wearable UI components created successfully"
        } -ArgumentList $PSScriptRoot

        Write-Host "Task running in background. Job ID: $($job.Id)"
        return $job.Id
    } else {
        # Run synchronously
        Write-Host "Creating wearable UI components..."
        # Implementation would go here
        Write-Host "Wearable UI task completed"
    }
}

function Start-PlatformSpecificTask {
    Write-Host "Starting platform-specific wearable implementation..." -ForegroundColor Green

    if ($Background) {
        $job = Start-Job -ScriptBlock {
            param($scriptRoot)
            Set-Location "$scriptRoot\..\..\.."
            Write-Host "Background job: Setting up platform-specific code..."

            # Create platform directories
            $platforms = @("ios", "android")
            foreach ($platform in $platforms) {
                $platformDir = "wearable\$platform"
                if (!(Test-Path $platformDir)) {
                    New-Item -ItemType Directory -Path $platformDir -Force
                }

                # Create basic platform files
                $platformFile = Join-Path $platformDir "README.md"
                Set-Content -Path $platformFile -Value "# $platform Wearable Implementation`n`n## Setup Instructions`n`nTODO: Add platform-specific setup steps"
            }

            Write-Host "Platform-specific structure created"
        } -ArgumentList $PSScriptRoot

        Write-Host "Platform task running in background. Job ID: $($job.Id)"
        return $job.Id
    }
}

function Get-BackgroundJobs {
    $jobs = Get-Job
    if ($jobs.Count -eq 0) {
        Write-Host "No background jobs running"
        return
    }

    Write-Host "=== Background Jobs ===" -ForegroundColor Cyan
    foreach ($job in $jobs) {
        $statusColor = switch ($job.State) {
            "Running" { "Yellow" }
            "Completed" { "Green" }
            "Failed" { "Red" }
            default { "White" }
        }
        Write-Host "Job $($job.Id): $($job.Name) - $($job.State)" -ForegroundColor $statusColor
    }
}

# Main execution
if ($Status) {
    Show-TaskStatus
    Get-BackgroundJobs
    exit 0
}

switch ($TaskId) {
    "wearable-ui" {
        $jobId = Start-WearableUITask -Background:$Background
        if ($Background -and $jobId) {
            Write-Host "Wearable UI task started in background (Job ID: $jobId)"
        }
    }
    "platform-specific" {
        $jobId = Start-PlatformSpecificTask -Background:$Background
        if ($Background -and $jobId) {
            Write-Host "Platform-specific task started in background (Job ID: $jobId)"
        }
    }
    default {
        Write-Host "Available tasks:" -ForegroundColor Cyan
        Write-Host "  wearable-ui      - Implement Wearable Workout UI"
        Write-Host "  platform-specific - Build Platform-Specific Code"
        Write-Host ""
        Write-Host "Usage examples:" -ForegroundColor Yellow
        Write-Host "  .\run-wearable-tasks.ps1 -TaskId wearable-ui -Background"
        Write-Host "  .\run-wearable-tasks.ps1 -Status"
    }
}