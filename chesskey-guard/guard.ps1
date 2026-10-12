#Requires -PSEdition Desktop
# Run every minute by the ChessKeyGuard scheduled task (as SYSTEM).
# Design: docs/superpowers/specs/2026-10-09-chesskey-guard-design.md
$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
    $ctx = New-GuardContext -InstallDir $PSScriptRoot
    exit (Invoke-GuardMain $ctx)
} catch {
    try {
        if ($PSScriptRoot -and (Test-Path -LiteralPath $PSScriptRoot)) {
            Add-Content -LiteralPath (Join-Path $PSScriptRoot 'guard.log') -Encoding UTF8 `
                -Value ('{0} CHESSKEY-GUARD ERROR {1}' -f (Get-Date).ToString('o'), $_.Exception.Message)
        }
    } catch { }
    exit 1
}
