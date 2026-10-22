# ============================================================================
#  Gazi Portfolio - GitHub Polling Auto-Deploy (local)
#  Polls GitHub main branch every N seconds. When a new commit is detected,
#  runs deploy-local.ps1 automatically.
#
#  Usage:
#    .\poll-github.ps1                    # poll every 60s (default)
#    .\poll-github.ps1 -Interval 30       # poll every 30s
#    .\poll-github.ps1 -Once              # check once and exit
# ============================================================================
param(
    [int]$Interval = 60,
    [switch]$Once
)

$ErrorActionPreference = "Continue"
$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Repo = "ciphercall/gazi-portfolio"
$Branch = "main"
$ApiUrl = "https://api.github.com/repos/$Repo/commits/$Branch"

# Get current local SHA
function Get-LocalSha {
    Set-Location $ProjectDir
    $sha = git rev-parse HEAD 2>$null
    if ($sha) { return $sha.Trim() }
    return $null
}

# Get remote SHA from GitHub API
function Get-RemoteSha {
    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Headers @{ "User-Agent" = "gazi-portfolio-poller" } -TimeoutSec 15
        return $response.sha
    } catch {
        Write-Host "  [WARN] Failed to fetch remote SHA: $_" -ForegroundColor Yellow
        return $null
    }
}

Write-Host "=== Gazi Portfolio - GitHub Auto-Deploy Poller ===" -ForegroundColor Cyan
Write-Host "Repo: $Repo (branch: $Branch)" -ForegroundColor Gray
Write-Host "Poll interval: ${Interval}s" -ForegroundColor Gray
Write-Host "Project dir: $ProjectDir" -ForegroundColor Gray
Write-Host ""

$localSha = Get-LocalSha
Write-Host "Current local SHA: $($localSha.Substring(0,8))" -ForegroundColor White

while ($true) {
    $remoteSha = Get-RemoteSha

    if ($remoteSha -and $localSha -and $remoteSha -ne $localSha) {
        Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] New commit detected!" -ForegroundColor Green
        Write-Host "  Local:  $($localSha.Substring(0,8))" -ForegroundColor Gray
        Write-Host "  Remote: $($remoteSha.Substring(0,8))" -ForegroundColor Gray
        Write-Host "  Triggering deploy..." -ForegroundColor Yellow

        $deployScript = Join-Path $ProjectDir "deploy\deploy-local.ps1"
        & $deployScript

        if ($LASTEXITCODE -eq 0) {
            $localSha = Get-LocalSha
            Write-Host "  Deploy successful. New local SHA: $($localSha.Substring(0,8))" -ForegroundColor Green
        } else {
            Write-Host "  Deploy failed (exit code $LASTEXITCODE). Will retry on next poll." -ForegroundColor Red
        }
    } elseif ($remoteSha) {
        $short = $remoteSha.Substring(0,8)
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Up to date ($short)" -ForegroundColor DarkGray
    }

    if ($Once) { break }

    Start-Sleep -Seconds $Interval
}