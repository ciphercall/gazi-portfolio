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

# The on-demand gatekeeper owns the public port when it is running (a node
# process listens on 8023). In that mode the real stack must bind its internal
# port on loopback only; otherwise both try to publish 8023 and `web` fails to
# start. Always-on mode (no gatekeeper) keeps publishing 0.0.0.0:8023.
$GatekeeperEnv = Join-Path (Split-Path -Parent $ProjectDir) "on-demand-gatekeeper\.env.gazi"
$OnDemand = $false
$InternalPort = 8023
$WebBind = "0.0.0.0"
if (Test-Path $GatekeeperEnv) {
    $listener = Get-NetTCPConnection -LocalPort 8023 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
        if ($owner -and $owner.ProcessName -eq "node") {
            $OnDemand = $true
            foreach ($line in Get-Content $GatekeeperEnv) {
                if ($line -match "^\s*INTERNAL_PORT\s*=\s*(\d+)") { $InternalPort = [int]$Matches[1] }
                if ($line -match "^\s*WEB_BIND\s*=\s*(\S+)") { $WebBind = $Matches[1] }
            }
            if ($WebBind -eq "0.0.0.0") { $WebBind = "127.0.0.1" }
        }
    }
}

Write-Host "=== Deploying Gazi Portfolio (local) ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
if ($OnDemand) {
    Write-Host "Mode: on-demand (gatekeeper owns :8023; stack binds ${WebBind}:${InternalPort})" -ForegroundColor Gray
} else {
    Write-Host "Mode: always-on (stack binds ${WebBind}:${InternalPort})" -ForegroundColor Gray
}

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
$env:WEB_BIND = $WebBind
$env:WEB_PORT = "$InternalPort"
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
$HealthUrl = if ($OnDemand) { "http://127.0.0.1:$InternalPort/api/health" } else { "http://localhost:8023/healthz" }
try {
    $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "HTTP $($response.StatusCode) - $(($response.Content | ConvertFrom-Json).status)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Deploy complete ===" -ForegroundColor Green
Write-Host "URL: http://localhost:8023" -ForegroundColor White
Write-Host "Admin: http://localhost:8023/admin" -ForegroundColor White