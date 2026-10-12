# Shared fixtures for the ChessKey Guard tests. Dot-source from BeforeAll, after
# importing the module. Everything lives under a per-test HKCU key and temp folder.
$script:ModulePath = (Resolve-Path (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1')).Path

function New-TestConfig {
    [ordered]@{
        unlockDelayHours = 24.0
        extensionId      = 'altersonic@yahoo.com'
        installUrl       = 'https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi'
        blockedHost      = 'lichess.org'
    }
}

function New-TestContext {
    $id = [guid]::NewGuid().ToString('N')
    $regRoot = "HKCU:\Software\ChessKeyGuardTest\$id"
    $tempDir = Join-Path $env:TEMP "ckg-test-$id"
    # Never New-Item -Force here: it would recreate the shared parent empty, wiping other contexts.
    if (-not (Test-Path -LiteralPath "HKCU:\Software\ChessKeyGuardTest")) { New-Item -Path "HKCU:\Software\ChessKeyGuardTest" | Out-Null }
    New-Item -Path $regRoot | Out-Null
    New-Item -Path "$regRoot\Policies" | Out-Null
    New-Item -Path "$regRoot\Firefox" | Out-Null
    Set-ItemProperty -LiteralPath "$regRoot\Firefox" -Name CurrentVersion -Value '153.0.1 (x64 en-US)'
    New-Item -ItemType Directory -Path "$tempDir\install" -Force | Out-Null

    $ctx = New-GuardContext -PolicyRoot "$regRoot\Policies" -InstallDir "$tempDir\install" `
        -MarkerPath "$tempDir\ChessKeyGuard-unlocked.log" -MutexName "ChessKeyGuardTest-$id" `
        -FirefoxKeys @("$regRoot\Firefox") -VolatileHive 'CurrentUser' `
        -VolatileParent "Software\ChessKeyGuardTest\$id\VolatileParent" -TaskName "ChessKeyGuardTest-$id"

    $clock = @{ BootId = 'boot-1'; Tick = [long]1000000 }
    $calls = @{ Unregister = 0 }
    $ctx.GetBootId = { param($c) $clock.BootId }.GetNewClosure()
    $ctx.GetTick = { param($c) $clock.Tick }.GetNewClosure()
    $ctx.UnregisterTask = { param($c) $calls.Unregister++ }.GetNewClosure()
    $ctx.Config = New-TestConfig
    ConvertTo-Json -InputObject $ctx.Config | Set-Content -LiteralPath "$tempDir\install\config.json" -Encoding UTF8
    $ctx.Test = @{ RegRoot = $regRoot; TempDir = $tempDir; Clock = $clock; Calls = $calls }
    return $ctx
}

function Remove-TestContext {
    param([hashtable]$Ctx)
    Remove-Item -LiteralPath $Ctx.Test.RegRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $Ctx.Test.TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Makes the named failure point in the module throw exactly once.
function Set-FailOnce {
    param([hashtable]$Ctx, [string]$Point)
    $fired = @{ Done = $false }
    $Ctx.FailPoint = {
        param($name)
        if ($name -eq $Point -and -not $fired.Done) {
            $fired.Done = $true
            throw "injected failure at $name"
        }
    }.GetNewClosure()
}

# Holds the state lock from a separate process (a mutex is re-entrant on its own
# thread, so contention can only be tested cross-process). Returns once it holds it.
function Start-LockHolder {
    param([hashtable]$Ctx, [int]$HoldMs, [string]$StateMarker = '')
    $ready = Join-Path $Ctx.Test.TempDir ('ready-' + [guid]::NewGuid().ToString('N'))
    $job = Start-Job -ScriptBlock {
        param($ModulePath, $InstallDir, $MutexName, $Ready, $HoldMs, $StateMarker)
        Import-Module $ModulePath
        $c = New-GuardContext -InstallDir $InstallDir -MutexName $MutexName
        Use-StateLock $c {
            $s = Read-State $c
            Set-Content -LiteralPath $Ready -Value 'ready'
            Start-Sleep -Milliseconds $HoldMs
            if ($StateMarker -and $s) {
                $s['firefoxWarning'] = $StateMarker
                Save-State $c $s
            }
        }
    } -ArgumentList $script:ModulePath, $Ctx.InstallDir, $Ctx.MutexName, $ready, $HoldMs, $StateMarker
    $deadline = (Get-Date).AddSeconds(60)
    while (-not (Test-Path -LiteralPath $ready)) {
        if ($job.State -eq 'Failed' -or (Get-Date) -gt $deadline) {
            throw "lock holder did not start: $(Receive-Job $job 2>&1 | Out-String)"
        }
        Start-Sleep -Milliseconds 100
    }
    return $job
}
