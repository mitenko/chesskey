# Runs the ChessKey Guard Pester suite. Use Windows PowerShell 5.1 (powershell.exe):
# it is the runtime of the scheduled task, so it is the one that has to pass.
param([string]$Path = (Join-Path $PSScriptRoot 'tests'))
$ErrorActionPreference = 'Stop'
Import-Module Pester -MinimumVersion 5.5.0
$config = New-PesterConfiguration
$config.Run.Path = $Path
$config.Run.PassThru = $true
$config.Output.Verbosity = 'Detailed'
$result = Invoke-Pester -Configuration $config
Write-Host "CHESSKEY-GUARD-TESTS passed=$($result.PassedCount) failed=$($result.FailedCount)"
exit $result.FailedCount
