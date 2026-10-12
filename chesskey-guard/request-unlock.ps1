#Requires -RunAsAdministrator
#Requires -PSEdition Desktop
# Starts the cooling-off countdown. Once it matures, the guard removes everything.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext -InstallDir $PSScriptRoot
$ctx.Config = Read-GuardConfig (Join-Path $PSScriptRoot 'config.json')
$unlock = Request-Unlock $ctx
$remainingHours = ((Get-UnlockDelayMs $ctx) - [long]$unlock.elapsedMs) / 3600000
Write-Host ('Unlock requested at {0}.' -f $unlock.requestedAt)
Write-Host ('It completes after {0:N1} more hours of uptime. Restarts pause the countdown; with Fast Startup (Windows default), Shut down counts like sleep.' -f $remainingHours)
Write-Host "Changed your mind? Run $(Join-Path $PSScriptRoot 'cancel-unlock.ps1')."
