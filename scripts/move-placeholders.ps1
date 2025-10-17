$now = Get-Date -Format yyyyMMdd-HHmmss
$trash = Join-Path . ".trash"
if (-not (Test-Path $trash)) { New-Item -ItemType Directory -Path $trash | Out-Null }
$backupDir = Join-Path $trash ("placeholder-backup-" + $now)
New-Item -ItemType Directory -Path $backupDir | Out-Null

$paths = @("specs/your-feature-name", "specs/feature/your-feature-name")
$moved = 0
foreach ($p in $paths) {
    if (Test-Path $p) {
        $leaf = Split-Path $p -Leaf
        $dest = Join-Path $backupDir $leaf
        Move-Item -Path $p -Destination $dest -Force
        Write-Output "Moved $p -> $dest"
        $moved++
    }
    else {
        Write-Output "Not found: $p"
    }
}

if (-not (Test-Path 'specs/drafts')) { New-Item -ItemType Directory -Path 'specs/drafts' -Force | Out-Null }
if ($moved -gt 0) {
    if (-not (Test-Path 'specs/drafts/feature-your-feature-name')) { New-Item -ItemType Directory -Path 'specs/drafts/feature-your-feature-name' -Force | Out-Null }
    Write-Output "Done. Moved $moved placeholders to $backupDir and ensured drafts folder."
}
else {
    Write-Output "No placeholders found."
}
