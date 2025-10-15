# PowerShell script to automate the creation of a new feature branch and spec file

param (
    [string]$FeatureName
)

if (-not $FeatureName) {
    Write-Host "Error: Please provide a feature name." -ForegroundColor Red
    exit 1
}

# Format the branch name
$BranchName = "feature/$FeatureName"

# Create a new Git branch
Write-Host "Creating a new branch: $BranchName" -ForegroundColor Green
& git checkout -b $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create the branch." -ForegroundColor Red
    exit 1
}

# Create the specs directory if it doesn't exist
$SpecsDir = "specs/$FeatureName"
if (-not (Test-Path $SpecsDir)) {
    Write-Host "Creating specs directory: $SpecsDir" -ForegroundColor Green
    New-Item -ItemType Directory -Path $SpecsDir | Out-Null
}

# Create the spec file
$SpecFile = "$SpecsDir/spec.md"
if (-not (Test-Path $SpecFile)) {
    Write-Host "Creating spec file: $SpecFile" -ForegroundColor Green
    @"
# Specification for $FeatureName

## Overview

## Requirements

## Implementation Details

## Testing Plan

"@ | Set-Content -Path $SpecFile
}
else {
    Write-Host "Spec file already exists: $SpecFile" -ForegroundColor Yellow
}

Write-Host "Feature setup complete!" -ForegroundColor Green