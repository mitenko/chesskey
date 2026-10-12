#Requires -PSEdition Desktop
# Prints ChessKey Guard's current state and the last log lines. Read-only.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext -InstallDir $PSScriptRoot
$ctx.Config = Read-GuardConfig (Join-Path $PSScriptRoot 'config.json')
Get-GuardStatus $ctx | Format-List
$log = Join-Path $PSScriptRoot 'guard.log'
if (Test-Path -LiteralPath $log) {
    Write-Host 'Recent log:'
    Get-Content -LiteralPath $log -Tail 10
}
