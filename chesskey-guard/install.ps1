#Requires -RunAsAdministrator
#Requires -PSEdition Desktop
# One-time install of ChessKey Guard. Run from an elevated Windows PowerShell:
#   powershell.exe -ExecutionPolicy Bypass -File chesskey-guard\install.ps1
$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
Import-Module (Join-Path $source 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext
$ctx.Config = Read-GuardConfig (Join-Path $source 'config.json')

$version = Test-InstallPreflight $ctx
Write-Host "Firefox $version detected: OK."

Rename-UnlockMarker $ctx
# The install folder is deleted and recreated below. While it is gone, someone else could
# create it with their own guard.ps1, which an existing SYSTEM task would then run; so a
# previous install's task is removed first and registered again once the files are in place.
$taskRemoved = $false
if (Get-ScheduledTask -TaskName $ctx.TaskName -ErrorAction SilentlyContinue) {
    & $ctx.UnregisterTask $ctx
    $taskRemoved = $true
    Write-Host 'Removed the existing guard task; it is registered again at the end of install.'
}
try {
    # Fresh folder with its ACL applied while empty; keeps state.json on a reinstall. Aborts,
    # before any task is registered, if the old folder cannot be deleted.
    Initialize-InstallDirectory $ctx
    # A junction at the install path would send the files (and SYSTEM's guard.ps1) elsewhere.
    Assert-InstallDirectoryNotLink $ctx
    foreach ($file in 'ChessKeyGuard.psm1', 'guard.ps1', 'request-unlock.ps1', 'cancel-unlock.ps1', 'status.ps1', 'config.json') {
        Copy-Item -LiteralPath (Join-Path $source $file) -Destination $ctx.InstallDir
    }
    Assert-InstallDirectoryNotLink $ctx
    Register-GuardTask $ctx
} catch {
    if ($taskRemoved) {
        throw "Install aborted: $($_.Exception.Message) ChessKey Guard is NOT running until install succeeds; fix the problem and run install again."
    }
    throw
}

if ((Invoke-GuardMain $ctx) -ne 0) {
    throw "The first guard run failed; see $(Join-Path $ctx.InstallDir 'guard.log')"
}
& (Join-Path $ctx.InstallDir 'status.ps1')
Write-Host ''
Write-Host 'Installed. Restart Firefox, then check about:policies and about:addons.'
Write-Host "To remove later: run $(Join-Path $ctx.InstallDir 'request-unlock.ps1') elevated and wait $($ctx.Config.unlockDelayHours)h of uptime."
