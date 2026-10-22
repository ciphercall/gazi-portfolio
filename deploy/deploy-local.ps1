# ============================================================================
#  Gazi Portfolio - Local Docker Deploy Script
#  Run manually or via poll-github.ps1 for auto-deploy on push to main.
# ============================================================================
param(
    [switch]$SkipBuild,
    [switch]$SkipMigrate
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DeployDir = Join-Path $ProjectDir "deploy"

Write-Host "=== Deploying Gazi Portfolio (local) ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray

# 1. Pull latest code
Write-Host "`n[1/4] Pulling latest code from main..." -ForegroundColor Yellow
Set-Location $ProjectDir
git fetch origin main
git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw "Git pull failed" }

# 2. Build
if (-not $SkipBuild) {
    Write-Host "`n[2/4] Building Docker images..." -ForegroundColor Yellow
    Set-Location $DeployDir
    docker compose --env-file .env build
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
} else {
    Write-Host "`n[2/4] Skipping build (--SkipBuild)" -ForegroundColor Gray
}

# 3. Start containers
Write-Host "`n[3/4] Starting containers..." -ForegroundColor Yellow
Set-Location $DeployDir
docker compose --env-file .env up -d
if ($LASTEXITCODE -ne 0) { throw "Docker up failed" }

# 4. Migrate
if (-not $SkipMigrate) {
    Write-Host "`n[4/4] Running migrations..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    docker compose --env-file .env exec -T app npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Write-Host "Migration warning (may already be applied)" -ForegroundColor Yellow }
} else {
    Write-Host "`n[4/4] Skipping migrate (--SkipMigrate)" -ForegroundColor Gray
}

# Health check
Write-Host "`n=== Health check ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8023/healthz" -UseBasicParsing -TimeoutSec 10
    Write-Host "HTTP $($response.StatusCode) - $(($response.Content | ConvertFrom-Json).status)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Deploy complete ===" -ForegroundColor Green
Write-Host "URL: http://localhost:8023" -ForegroundColor White
Write-Host "Admin: http://localhost:8023/admin" -ForegroundColor White