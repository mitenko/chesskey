#Requires -RunAsAdministrator
#Requires -PSEdition Desktop
# Cancels a pending unlock request. Refused once teardown has started.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext -InstallDir $PSScriptRoot
$ctx.Config = Read-GuardConfig (Join-Path $PSScriptRoot 'config.json')
Clear-UnlockRequest $ctx
Write-Host 'Unlock request cancelled. ChessKey Guard stays on.'
