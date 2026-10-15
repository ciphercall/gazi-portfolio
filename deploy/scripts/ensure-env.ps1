# deploy/scripts/ensure-env.ps1
#
# Bootstraps deploy/.env from deploy/.env.example and fills in the secrets that
# must not be typed by hand. Idempotent: an existing .env is left alone except
# for placeholders that were never replaced.
#
# Encoding note: Windows PowerShell 5.1 reads and writes text files as ANSI
# unless told otherwise, which mangles non-ASCII comment text. Every .env read
# and write here is therefore explicit UTF-8, with NO BOM - a BOM would land in
# the first key and break Docker Compose's parser.

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$deployDir   = Split-Path -Parent $PSScriptRoot
$envPath     = Join-Path $deployDir '.env'
$examplePath = Join-Path $deployDir '.env.example'
$utf8NoBom   = New-Object System.Text.UTF8Encoding($false)

function Read-EnvFile([string]$Path) {
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-EnvFile([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Write-Note([string]$Message) {
    if (-not $Quiet) { Write-Host $Message }
}

function New-Secret([int]$ByteCount) {
    $bytes = New-Object byte[] $ByteCount
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

function Set-EnvValue([string]$Content, [string]$Key, [string]$Value) {
    $pattern = "(?m)^\s*$([regex]::Escape($Key))\s*=.*$"
    if ([regex]::IsMatch($Content, $pattern)) {
        return [regex]::Replace($Content, $pattern, "$Key=$Value")
    }
    return $Content.TrimEnd() + "`n$Key=$Value`n"
}

function Get-EnvValue([string]$Content, [string]$Key) {
    $match = [regex]::Match($Content, "(?m)^\s*$([regex]::Escape($Key))\s*=(.*)$")
    if ($match.Success) { return $match.Groups[1].Value.Trim() }
    return $null
}

if (-not (Test-Path $examplePath)) {
    throw "Missing $examplePath - cannot bootstrap the environment."
}

if (-not (Test-Path $envPath) -or $Force) {
    Copy-Item $examplePath $envPath -Force
    Write-Note "Created deploy\.env from deploy\.env.example"
}

$content = Read-EnvFile $envPath
$changes = @()

# ---------------------------------------------------------------- secrets ---
$authSecret = Get-EnvValue $content 'AUTH_SECRET'
if ([string]::IsNullOrWhiteSpace($authSecret) -or $authSecret -like 'change-me*') {
    $content = Set-EnvValue $content 'AUTH_SECRET' (New-Secret 48)
    $changes += 'AUTH_SECRET'
}

$tokenKey = Get-EnvValue $content 'SOCIAL_TOKEN_KEY'
if ([string]::IsNullOrWhiteSpace($tokenKey)) {
    $content = Set-EnvValue $content 'SOCIAL_TOKEN_KEY' (New-Secret 32)
    $changes += 'SOCIAL_TOKEN_KEY'
}

# --------------------------------------------------------------- database ---
# The password and the connection string must agree, so they are generated
# together rather than independently.
$dbPassword = Get-EnvValue $content 'POSTGRES_PASSWORD'
if ([string]::IsNullOrWhiteSpace($dbPassword) -or $dbPassword -like 'change-me*') {
    $dbPassword = (New-Secret 24) -replace '[^A-Za-z0-9]', ''
    $dbUser = Get-EnvValue $content 'POSTGRES_USER'
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = 'portfolio' }
    $dbName = Get-EnvValue $content 'POSTGRES_DB'
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = 'gazi_portfolio' }

    $content = Set-EnvValue $content 'POSTGRES_PASSWORD' $dbPassword
    $content = Set-EnvValue $content 'DATABASE_URL' "postgresql://${dbUser}:${dbPassword}@postgres:5432/${dbName}"
    $changes += 'POSTGRES_PASSWORD'
    $changes += 'DATABASE_URL'
}

# ------------------------------------------------------------------ admin ---
$adminPassword = Get-EnvValue $content 'ADMIN_PASSWORD'
if ([string]::IsNullOrWhiteSpace($adminPassword) -or $adminPassword -like 'change-me*') {
    $adminPassword = (New-Secret 18) -replace '[^A-Za-z0-9]', ''
    $content = Set-EnvValue $content 'ADMIN_PASSWORD' $adminPassword
    $changes += 'ADMIN_PASSWORD'
}

Write-EnvFile $envPath $content

if ($changes.Count -gt 0) {
    Write-Note "Generated values in deploy\.env: $($changes -join ', ')"
} else {
    Write-Note "deploy\.env already complete."
}

# Surface the admin password once, so the first login is not a mystery.
if ($changes -contains 'ADMIN_PASSWORD') {
    Write-Host ""
    Write-Host "  Admin login seeded by '-Action seed':" -ForegroundColor Cyan
    Write-Host "    email    : $(Get-EnvValue (Read-EnvFile $envPath) 'ADMIN_EMAIL')"
    Write-Host "    password : $adminPassword" -ForegroundColor Yellow
    Write-Host "  Change it from /admin after the first login." -ForegroundColor DarkGray
    Write-Host "  Full value is stored in gazi-portfolio\deploy\.env (git-ignored)."
    Write-Host ""
}
