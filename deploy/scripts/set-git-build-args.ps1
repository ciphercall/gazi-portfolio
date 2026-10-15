# deploy/scripts/set-git-build-args.ps1
#
# Stamps the current commit into deploy/.env so every built image can be traced
# back to the exact revision it was built from. /api/health reports it, which is
# what lets a deployment be *proved* to carry a change rather than assumed to.
#
# Tolerant by design: a repository with no commits yet, or no repository at all,
# is a normal first-time state and must never fail the deploy.

[CmdletBinding()]
param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $PSScriptRoot
$envPath   = Join-Path $deployDir '.env'
$repoDir   = Split-Path -Parent $deployDir

if (-not (Test-Path $envPath)) {
    throw "deploy\.env not found - run '-Action env' first."
}

$sha    = 'unknown'
$branch = 'unknown'
$dirty  = ''

# Native commands write to the error stream when they fail, which would trip
# $ErrorActionPreference = 'Stop'. Relax the policy for the probe block only.
$previousPolicy = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    if (Test-Path (Join-Path $repoDir '.git')) {
        # --verify --quiet prints nothing and exits 1 before the first commit.
        $head = (& git -C $repoDir rev-parse --verify --quiet HEAD 2>$null | Out-String).Trim()
        if ($head) {
            $sha = $head.Substring(0, [Math]::Min(12, $head.Length))

            $branchOut = (& git -C $repoDir rev-parse --abbrev-ref HEAD 2>$null | Out-String).Trim()
            if ($branchOut) { $branch = $branchOut }

            # A dirty tree is worth recording - it is the difference between
            # "this image is exactly commit X" and "this image is close to X".
            $status = (& git -C $repoDir status --porcelain 2>$null | Out-String).Trim()
            if ($status) { $dirty = '-dirty' }
        }
    }
} finally {
    $ErrorActionPreference = $previousPolicy
}

$stamp = "$sha$dirty"

# Read and write .env as explicit UTF-8 with NO BOM: Windows PowerShell 5.1
# would otherwise treat the file as ANSI, and a BOM would land in the first key
# and break Docker Compose's own parser.
$content = [System.IO.File]::ReadAllText($envPath, [System.Text.Encoding]::UTF8)
$pattern = '(?m)^\s*GIT_SHA\s*=.*$'
if ([regex]::IsMatch($content, $pattern)) {
    $content = [regex]::Replace($content, $pattern, "GIT_SHA=$stamp")
} else {
    $content = $content.TrimEnd() + "`nGIT_SHA=$stamp`n"
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($envPath, $content, $utf8NoBom)

if (-not $Quiet) {
    Write-Host "Build stamp: $stamp (branch $branch)"
}

# Emit for the caller.
Write-Output $stamp
