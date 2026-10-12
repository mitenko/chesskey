# ChessKey Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A SYSTEM scheduled task that keeps ChessKey force-installed in Firefox and lichess.org blocked in Edge/Chrome, removable only through a 24-hour-of-uptime unlock request.

**Architecture:** A single PowerShell module (`ChessKeyGuard.psm1`) holds all logic as small functions that take a context hashtable (`$Ctx`), so tests can point them at a scratch `HKCU:` key, a temp folder, a fake clock and a fake task unregister. Thin scripts (`guard.ps1`, `install.ps1`, `request-unlock.ps1`, `cancel-unlock.ps1`, `status.ps1`) import the module and call one entry point. `guard.ps1` runs every minute as SYSTEM and converges the machine either to "policies enforced" or, once an unlock has matured, through an idempotent teardown.

**Tech Stack:** Windows PowerShell 5.1 (the runtime of the scheduled task — all code must run there), Pester 5.5+, Windows registry policies, Task Scheduler (`ScheduledTasks` module), `icacls`.

**Spec:** `docs/superpowers/specs/2026-10-09-chesskey-guard-design.md`

## Global Constraints

- All code must run on **Windows PowerShell 5.1**: no `??`, `?:`, `-AsHashtable`, `[Environment]::TickCount64`, `ForEach-Object -Parallel`.
- Install dir `C:\ProgramData\ChessKeyGuard\`; marker `C:\ProgramData\ChessKeyGuard-unlocked.log`; task `\ChessKeyGuard`, SYSTEM, highest privileges, at startup + every 1 minute, IgnoreNew.
- Mutex `Global\ChessKeyGuardState`; commands wait up to 30 s, then fail with a clear message.
- Policies: Firefox `ExtensionSettings` entry for `altersonic@yahoo.com` = `installation_mode: force_installed`, `install_url: https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi`, `private_browsing: true`; Firefox `DisableSafeMode` = DWORD 1; Edge and Chrome `URLBlocklist` entry `lichess.org`.
- Minimum Firefox: **136+, or ESR 128.8+**.
- Default `unlockDelayHours` = 24, measured in **uptime** (same-boot `GetTickCount64` deltas only).
- Every log line: ISO timestamp + `CHESSKEY-GUARD`; rotate `guard.log` to `guard.log.1` past 1 MB; no-change runs log nothing.
- No `uninstall.ps1`. The unlock request is the uninstall.
- Commits: GitHub identity `mitenko <mitenko@gmail.com>`, **no Claude attribution lines**.

## Spec deviations (deliberate, flag in review)

1. **Marker only counts when `state.json` is missing.** The spec says teardown is under way when `phase == "teardown"` *or* the marker exists. Here a marker next to a valid active state is ignored, because the marker sits in a folder where standard users can create files and would otherwise be a one-step bypass. Teardown deletes `state.json` only after writing the marker, so retry behaviour is unchanged.
2. **Tick source is `GetTickCount64` via P/Invoke.** PS 5.1 runs on .NET Framework, which has no `[Environment]::TickCount64`. It is the same counter.
3. **Keys the guard creates are tracked generically.** Instead of "remove `URLBlocklist` only if the guard created it", the guard records every policy key it creates and teardown removes each one if empty (deepest first). This covers `Mozilla\Firefox`, `Microsoft\Edge`, etc.
4. **`state.json` is deleted first during directory removal.** That way a partially deleted folder can never hold a state file without its `config.json`.
5. **The Firefox version warning is logged once per distinct problem**, not every minute.
6. **Config key `blockedHost` (single).** The spec mentions "blocked hosts"; only lichess.org is needed.

## Review Focus

1. **Firefox `CurrentVersion` strings carry suffixes** (`153.0.1 (x64 en-US)`, `128.8.0esr (x64 en-US)`) and must parse correctly. Test lives in Task 6.
2. **A pre-existing `ExtensionSettings` stored as `REG_SZ`** must stay `REG_SZ` after the merge and after teardown. Tests live in Tasks 3 and 5.
3. **The mutex is created by SYSTEM but opened by an elevated admin user.** Without an explicit ACL the admin gets access-denied. The ACL test is in Task 2; Task 8 runs the real check.
4. **Uptime values above 2^32 ms (more than 49 days) and multi-hour elapsed values** must round-trip through `state.json` as `Int64`. Test lives in Task 2.
5. **Single-element arrays** (one created key, one-line `MultiString`) must round-trip without PS 5.1's `{"value":…,"Count":1}` wrapper. Test lives in Task 2.

---

## File Structure

```
chesskey-guard/
  ChessKeyGuard.psm1      all logic; sections appended per task
  config.json             unlockDelayHours, extensionId, installUrl, blockedHost
  guard.ps1               task entry point -> Invoke-GuardMain
  install.ps1             elevated one-time install
  request-unlock.ps1      start the countdown
  cancel-unlock.ps1       cancel a pending countdown
  status.ps1              print Get-GuardStatus + log tail
  run-tests.ps1           Pester 5 runner (Windows PowerShell 5.1)
  README.md               install / unlock / verify instructions
  tests/
    TestHelpers.ps1       New-TestContext, Remove-TestContext, Set-FailOnce, Start-LockHolder
    Registry.Tests.ps1    Task 1
    State.Tests.ps1       Task 2
    Policies.Tests.ps1    Task 3
    Unlock.Tests.ps1      Task 4
    Teardown.Tests.ps1    Task 5
    GuardRun.Tests.ps1    Task 6
    Install.Tests.ps1     Task 7
```

**Running tests** (always under Windows PowerShell 5.1, from the repo root):

```
powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1                     # all
powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\State.Tests.ps1
```

Tests need no elevation. They write only under `HKCU:\Software\ChessKeyGuardTest\<guid>` and `%TEMP%\ckg-test-<guid>`.

---

### Task 1: Scaffold, test harness, registry primitives

**Files:**
- Create: `chesskey-guard/ChessKeyGuard.psm1`
- Create: `chesskey-guard/config.json`
- Create: `chesskey-guard/run-tests.ps1`
- Create: `chesskey-guard/tests/TestHelpers.ps1`
- Test: `chesskey-guard/tests/Registry.Tests.ps1`

**Interfaces:**
- Produces:
  - `New-GuardContext [-PolicyRoot] [-InstallDir] [-MarkerPath] [-MutexName] [-MutexTimeoutMs] [-FirefoxKeys] [-VolatileHive] [-VolatileParent] [-TaskName]` → hashtable. Keys: those parameters plus `Config` (`$null`), `FailPoint` (`$null`), and `GetBootId`, `GetTick`, `UnregisterTask` (scriptblocks, each invoked as `& $Ctx.X $Ctx`).
  - `ConvertTo-HashtableDeep $obj` → ordered dictionaries/arrays.
  - `Get-RegValueSnapshot -KeyPath -Name` → `[ordered]@{present; kind; data}`; throws `Unsupported registry type <kind>`.
  - `Get-RegValueText $Snapshot` → string or `$null`.
  - `New-RegKeyTree -KeyPath`.
  - `Set-RegValue -KeyPath -Name -Kind -Data`.
  - `Restore-RegValue -KeyPath -Name -Snapshot`.
  - `Initialize-PolicyKey $Ctx $State $KeyPath`, which appends created key paths to `$State.createdKeys`.
  - Test helpers: `New-TestConfig`, `New-TestContext` (adds `$ctx.Test = @{RegRoot; TempDir; Clock=@{BootId;Tick}; Calls=@{Unregister}}`), `Remove-TestContext`, `Set-FailOnce`.

- [ ] **Step 1: Install Pester 5 for Windows PowerShell 5.1**

Run:
```
powershell.exe -NoProfile -Command "Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -Force -SkipPublisherCheck"
powershell.exe -NoProfile -Command "(Get-Module -ListAvailable Pester | Sort-Object Version -Descending | Select-Object -First 1).Version.ToString()"
```
Expected: second command prints `5.x.x` (5.5 or later).

- [ ] **Step 2: Create `chesskey-guard/config.json`**

```json
{
  "unlockDelayHours": 24,
  "extensionId": "altersonic@yahoo.com",
  "installUrl": "https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi",
  "blockedHost": "lichess.org"
}
```

- [ ] **Step 3: Create `chesskey-guard/run-tests.ps1`**

```powershell
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
```

- [ ] **Step 4: Create `chesskey-guard/tests/TestHelpers.ps1`**

```powershell
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
    New-Item -Path "HKCU:\Software\ChessKeyGuardTest" -Force -ErrorAction SilentlyContinue | Out-Null
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
```

- [ ] **Step 5: Write the failing tests `chesskey-guard/tests/Registry.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
}

Describe 'Registry snapshots' {
    BeforeEach {
        $ctx = New-TestContext
        $key = "$($ctx.PolicyRoot)\Sample"
    }
    AfterEach { Remove-TestContext $ctx }

    It 'reports an absent value when the key is missing' {
        (Get-RegValueSnapshot -KeyPath $key -Name 'X').present | Should -BeFalse
    }

    It 'reports an absent value when the key exists without it' {
        New-RegKeyTree -KeyPath $key
        (Get-RegValueSnapshot -KeyPath $key -Name 'X').present | Should -BeFalse
    }

    It 'round-trips <Kind>' -TestCases @(
        @{ Kind = 'String'; Data = 'abc' }
        @{ Kind = 'ExpandString'; Data = '%TEMP%\x' }
        @{ Kind = 'MultiString'; Data = @('one') }
        @{ Kind = 'DWord'; Data = 0 }
        @{ Kind = 'QWord'; Data = [long]5000000000 }
    ) {
        Set-RegValue -KeyPath $key -Name 'V' -Kind $Kind -Data $Data
        $snap = Get-RegValueSnapshot -KeyPath $key -Name 'V'
        $snap.present | Should -BeTrue
        $snap.kind | Should -Be $Kind
        @($snap.data) | Should -Be @($Data)
    }

    It 'refuses unsupported kinds' {
        New-RegKeyTree -KeyPath $key
        New-ItemProperty -LiteralPath $key -Name 'B' -PropertyType Binary -Value ([byte[]](1, 2)) | Out-Null
        { Get-RegValueSnapshot -KeyPath $key -Name 'B' } | Should -Throw '*Unsupported registry type Binary*'
    }

    It 'joins MultiString lines as text' {
        Set-RegValue -KeyPath $key -Name 'M' -Kind 'MultiString' -Data @('{', '}')
        Get-RegValueText (Get-RegValueSnapshot -KeyPath $key -Name 'M') | Should -Be "{`n}"
        Get-RegValueText (Get-RegValueSnapshot -KeyPath $key -Name 'none') | Should -BeNullOrEmpty
    }

    It 'restores an absent snapshot by deleting the value' {
        $before = Get-RegValueSnapshot -KeyPath $key -Name 'V'
        Set-RegValue -KeyPath $key -Name 'V' -Kind 'DWord' -Data 1
        Restore-RegValue -KeyPath $key -Name 'V' -Snapshot $before
        (Get-RegValueSnapshot -KeyPath $key -Name 'V').present | Should -BeFalse
    }

    It 'restores kind and data after a JSON round trip' {
        Set-RegValue -KeyPath $key -Name 'V' -Kind 'DWord' -Data 0
        $json = ConvertTo-Json -InputObject (Get-RegValueSnapshot -KeyPath $key -Name 'V') -Depth 5
        $snap = ConvertTo-HashtableDeep ($json | ConvertFrom-Json)
        Set-RegValue -KeyPath $key -Name 'V' -Kind 'String' -Data 'tampered'
        Restore-RegValue -KeyPath $key -Name 'V' -Snapshot $snap
        $after = Get-RegValueSnapshot -KeyPath $key -Name 'V'
        $after.kind | Should -Be 'DWord'
        $after.data | Should -Be 0
    }

    It 'does not wipe an existing key when writing a value' {
        Set-RegValue -KeyPath $key -Name 'Keep' -Kind 'String' -Data 'me'
        Set-RegValue -KeyPath $key -Name 'Other' -Kind 'String' -Data 'x'
        (Get-RegValueSnapshot -KeyPath $key -Name 'Keep').data | Should -Be 'me'
    }
}

Describe 'Initialize-PolicyKey' {
    BeforeEach { $ctx = New-TestContext; $root = $ctx.PolicyRoot }
    AfterEach { Remove-TestContext $ctx }

    It 'creates missing segments and records only the ones it created' {
        $state = [ordered]@{ createdKeys = @() }
        New-Item -Path "$root\Microsoft" | Out-Null
        Initialize-PolicyKey $ctx $state "$root\Microsoft\Edge\URLBlocklist"
        Test-Path -LiteralPath "$root\Microsoft\Edge\URLBlocklist" | Should -BeTrue
        @($state.createdKeys) | Should -Be @("$root\Microsoft\Edge", "$root\Microsoft\Edge\URLBlocklist")
    }

    It 'records nothing when the key already exists' {
        $state = [ordered]@{ createdKeys = @() }
        New-RegKeyTree -KeyPath "$root\Mozilla\Firefox"
        Initialize-PolicyKey $ctx $state "$root\Mozilla\Firefox"
        @($state.createdKeys).Count | Should -Be 0
    }

    It 'rejects keys outside the policy root' {
        { Initialize-PolicyKey $ctx ([ordered]@{ createdKeys = @() }) 'HKCU:\Software\Elsewhere' } | Should -Throw '*outside*'
    }
}

Describe 'ConvertTo-HashtableDeep' {
    It 'converts nested objects and keeps single-element arrays as arrays' {
        $obj = '{"a":{"b":[1]},"c":"x","d":[]}' | ConvertFrom-Json
        $h = ConvertTo-HashtableDeep $obj
        $h | Should -BeOfType [System.Collections.Specialized.OrderedDictionary]
        $h.a.b.GetType().IsArray | Should -BeTrue
        @($h.a.b) | Should -Be @(1)
        $h.c | Should -Be 'x'
        @($h.d).Count | Should -Be 0
    }
}
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Registry.Tests.ps1`
Expected: FAIL. `Import-Module` errors because `ChessKeyGuard.psm1` does not exist.

- [ ] **Step 7: Create `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
# ChessKey Guard: keeps ChessKey force-installed in Firefox and lichess.org blocked in
# Edge/Chrome until a cooling-off unlock matures.
# Design: docs/superpowers/specs/2026-10-09-chesskey-guard-design.md
#
# Every function takes a context hashtable ($Ctx) from New-GuardContext so tests can
# point it at a scratch registry root, temp folder, fake clock and fake task removal.
# Must run on Windows PowerShell 5.1 (the scheduled task's runtime).

# PS 5.1 serialises PSObject-wrapped arrays as {"value":[...],"Count":n}; dropping the
# ETS Count property makes ConvertTo-Json emit plain arrays.
Remove-TypeData -TypeName System.Array -ErrorAction SilentlyContinue
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$script:SupportedKinds = @('String', 'ExpandString', 'MultiString', 'DWord', 'QWord')

#region Context

function New-GuardContext {
    param(
        [string]$PolicyRoot = 'HKLM:\SOFTWARE\Policies',
        [string]$InstallDir = 'C:\ProgramData\ChessKeyGuard',
        [string]$MarkerPath = 'C:\ProgramData\ChessKeyGuard-unlocked.log',
        [string]$MutexName = 'Global\ChessKeyGuardState',
        [int]$MutexTimeoutMs = 30000,
        [string[]]$FirefoxKeys = @('HKLM:\SOFTWARE\Mozilla\Mozilla Firefox', 'HKLM:\SOFTWARE\WOW6432Node\Mozilla\Mozilla Firefox'),
        [string]$VolatileHive = 'LocalMachine',
        [string]$VolatileParent = 'SOFTWARE\ChessKeyGuard',
        [string]$TaskName = 'ChessKeyGuard'
    )
    @{
        PolicyRoot     = $PolicyRoot.TrimEnd('\')
        InstallDir     = $InstallDir
        MarkerPath     = $MarkerPath
        MutexName      = $MutexName
        MutexTimeoutMs = $MutexTimeoutMs
        FirefoxKeys    = $FirefoxKeys
        VolatileHive   = $VolatileHive
        VolatileParent = $VolatileParent
        TaskName       = $TaskName
        Config         = $null
        FailPoint      = $null
        GetBootId      = { param($c) Get-VolatileBootId -Hive $c.VolatileHive -Parent $c.VolatileParent }
        GetTick        = { param($c) Get-SystemTick }
        UnregisterTask = { param($c) Unregister-ScheduledTask -TaskName $c.TaskName -Confirm:$false -ErrorAction Stop }
    }
}

function ConvertTo-HashtableDeep {
    param($InputObject)
    if ($null -eq $InputObject) { return $null }
    if ($InputObject -is [System.Collections.IDictionary]) {
        $result = [ordered]@{}
        foreach ($k in @($InputObject.Keys)) { $result[[string]$k] = ConvertTo-HashtableDeep $InputObject[$k] }
        return $result
    }
    if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
        $result = [ordered]@{}
        foreach ($p in $InputObject.PSObject.Properties) { $result[$p.Name] = ConvertTo-HashtableDeep $p.Value }
        return $result
    }
    if ($InputObject -is [System.Collections.IEnumerable] -and $InputObject -isnot [string]) {
        $items = @(foreach ($item in $InputObject) { ConvertTo-HashtableDeep $item })
        return , $items
    }
    return $InputObject
}

#endregion

#region Registry primitives

function Get-RegValueSnapshot {
    param([string]$KeyPath, [string]$Name)
    if (-not (Test-Path -LiteralPath $KeyPath)) { return [ordered]@{ present = $false } }
    $key = Get-Item -LiteralPath $KeyPath
    if (@($key.GetValueNames()) -notcontains $Name) { return [ordered]@{ present = $false } }
    $kind = $key.GetValueKind($Name).ToString()
    if ($script:SupportedKinds -notcontains $kind) {
        throw "Unsupported registry type $kind at $KeyPath\$Name; refusing to modify it."
    }
    $data = $key.GetValue($Name, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
    [ordered]@{ present = $true; kind = $kind; data = $data }
}

function Get-RegValueText {
    param($Snapshot)
    if (-not $Snapshot -or -not $Snapshot.present) { return $null }
    if ($Snapshot.kind -eq 'MultiString') { return (@($Snapshot.data) -join "`n") }
    return [string]$Snapshot.data
}

function New-RegKeyTree {
    param([string]$KeyPath)
    if (Test-Path -LiteralPath $KeyPath) { return }
    $parent = Split-Path -Path $KeyPath -Parent
    if ($parent -and -not (Test-Path -LiteralPath $parent)) { New-RegKeyTree -KeyPath $parent }
    # Never New-Item -Force on an existing registry key: it recreates the key empty.
    New-Item -Path $KeyPath | Out-Null
}

function Set-RegValue {
    param([string]$KeyPath, [string]$Name, [string]$Kind, $Data)
    New-RegKeyTree -KeyPath $KeyPath
    switch ($Kind) {
        'MultiString' { $typed = [string[]]@($Data) }
        'DWord' { $typed = [int]$Data }
        'QWord' { $typed = [long]$Data }
        default { $typed = [string]$Data }
    }
    New-ItemProperty -LiteralPath $KeyPath -Name $Name -PropertyType $Kind -Value $typed -Force | Out-Null
}

function Restore-RegValue {
    param([string]$KeyPath, [string]$Name, $Snapshot)
    if (-not $Snapshot.present) {
        if ((Test-Path -LiteralPath $KeyPath) -and (@((Get-Item -LiteralPath $KeyPath).GetValueNames()) -contains $Name)) {
            Remove-ItemProperty -LiteralPath $KeyPath -Name $Name
        }
        return
    }
    Set-RegValue -KeyPath $KeyPath -Name $Name -Kind $Snapshot.kind -Data $Snapshot.data
}

# Creates $KeyPath under the policy root one segment at a time and records each key
# it creates, so teardown can remove exactly those (if they end up empty).
function Initialize-PolicyKey {
    param([hashtable]$Ctx, $State, [string]$KeyPath)
    $root = $Ctx.PolicyRoot
    if (-not $KeyPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Key $KeyPath is outside the policy root $root"
    }
    $current = $root
    foreach ($segment in ($KeyPath.Substring($root.Length) -split '\\' | Where-Object { $_ })) {
        $current = "$current\$segment"
        if (-not (Test-Path -LiteralPath $current)) {
            New-Item -Path $current | Out-Null
            $State.createdKeys = @($State.createdKeys) + $current
        }
    }
}

#endregion
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Registry.Tests.ps1`
Expected: PASS, with `CHESSKEY-GUARD-TESTS ... failed=0`.

- [ ] **Step 9: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard scaffold and registry primitives"
```

---

### Task 2: State store, lock, log, boot id and tick

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Modify: `chesskey-guard/tests/TestHelpers.ps1` (append `Start-LockHolder`)
- Test: `chesskey-guard/tests/State.Tests.ps1`

**Interfaces:**
- Consumes: `New-GuardContext`, `ConvertTo-HashtableDeep` (Task 1).
- Produces:
  - `New-StateMutex -Name` → `System.Threading.Mutex` whose ACL grants SYSTEM and Administrators full control.
  - `Use-StateLock $Ctx { body }` → the body's output; throws `*busy*` on timeout.
  - `Read-State $Ctx` → ordered dictionary, or `$null` when there is no `state.json`; throws `state.json is unreadable` otherwise.
  - `Save-State $Ctx $State`, writing atomically via `state.json.tmp`.
  - `Write-GuardLog $Ctx $Message`.
  - `Get-VolatileBootId -Hive -Parent` → GUID string.
  - `Remove-VolatileBootId $Ctx`.
  - `Get-SystemTick` → `[long]`.
  - Test helper `Start-LockHolder -Ctx -HoldMs [-StateMarker]` → a job holding the lock. When `-StateMarker` is given, it sets `state.firefoxWarning` to that value and saves while holding the lock.

- [ ] **Step 1: Append `Start-LockHolder` to `chesskey-guard/tests/TestHelpers.ps1`**

```powershell
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
```

- [ ] **Step 2: Write the failing tests `chesskey-guard/tests/State.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
}

Describe 'State file' {
    BeforeEach { $ctx = New-TestContext; $statePath = Join-Path $ctx.InstallDir 'state.json' }
    AfterEach { Remove-TestContext $ctx }

    It 'returns null when there is no state file' {
        Read-State $ctx | Should -BeNullOrEmpty
    }

    It 'round-trips nested data, single-element arrays and large Int64 values' {
        $state = [ordered]@{
            createdKeys = @('HKCU:\only-one')
            originals   = [ordered]@{ es = [ordered]@{ present = $true; kind = 'MultiString'; data = [string[]]@('{"a":1}') } }
            unlock      = [ordered]@{ baseTick = [long]5200000000; elapsedMs = [long]86400000 }
        }
        Save-State $ctx $state
        $raw = Get-Content -LiteralPath $statePath -Raw
        $raw | Should -Not -Match '"Count"'
        $loaded = Read-State $ctx
        $loaded.createdKeys.GetType().IsArray | Should -BeTrue
        @($loaded.createdKeys) | Should -Be @('HKCU:\only-one')
        @($loaded.originals.es.data) | Should -Be @('{"a":1}')
        $loaded.unlock.baseTick | Should -Be 5200000000
        $loaded.unlock.baseTick | Should -BeOfType [long]
    }

    It 'throws on an unreadable state file' {
        Set-Content -LiteralPath $statePath -Value '{ not json'
        { Read-State $ctx } | Should -Throw '*state.json is unreadable*'
    }

    It 'throws on an empty state file' {
        Set-Content -LiteralPath $statePath -Value ''
        { Read-State $ctx } | Should -Throw '*state.json is unreadable*'
    }

    It 'ignores a truncated leftover tmp file and overwrites it on save' {
        Save-State $ctx ([ordered]@{ phase = 'active' })
        Set-Content -LiteralPath "$statePath.tmp" -Value '{"phase":"act'
        (Read-State $ctx).phase | Should -Be 'active'
        Save-State $ctx ([ordered]@{ phase = 'teardown' })
        (Read-State $ctx).phase | Should -Be 'teardown'
        Test-Path -LiteralPath "$statePath.tmp" | Should -BeFalse
    }
}

Describe 'State lock' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Get-Job | Remove-Job -Force; Remove-TestContext $ctx }

    It 'grants SYSTEM and Administrators full control on the mutex' {
        $m = New-StateMutex -Name $ctx.MutexName
        try {
            $sids = @($m.GetAccessControl().GetAccessRules($true, $false, [System.Security.Principal.SecurityIdentifier]) |
                Where-Object { $_.MutexRights -eq 'FullControl' -and $_.AccessControlType -eq 'Allow' } |
                ForEach-Object { $_.IdentityReference.Value })
            $sids | Should -Contain 'S-1-5-18'
            $sids | Should -Contain 'S-1-5-32-544'
        } finally { $m.Dispose() }
    }

    It 'returns the body output' {
        Use-StateLock $ctx { 'ran' } | Should -Be 'ran'
    }

    It 'waits for another process to release the lock' {
        $job = Start-LockHolder -Ctx $ctx -HoldMs 1500
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        Use-StateLock $ctx { 'ran' } | Should -Be 'ran'
        $sw.ElapsedMilliseconds | Should -BeGreaterThan 500
        Wait-Job $job | Out-Null
    }

    It 'fails with a busy message past the timeout' {
        $job = Start-LockHolder -Ctx $ctx -HoldMs 4000
        $ctx.MutexTimeoutMs = 300
        { Use-StateLock $ctx { 'ran' } } | Should -Throw '*busy*'
        Wait-Job $job | Out-Null
    }
}

Describe 'Guard log' {
    BeforeEach { $ctx = New-TestContext; $log = Join-Path $ctx.InstallDir 'guard.log' }
    AfterEach { Remove-TestContext $ctx }

    It 'writes a timestamped tagged line' {
        Write-GuardLog $ctx 'REPAIRED edge URLBlocklist'
        Get-Content -LiteralPath $log | Should -Match '^\d{4}-\d{2}-\d{2}T\S+ CHESSKEY-GUARD REPAIRED edge URLBlocklist$'
    }

    It 'rotates past 1 MB' {
        Set-Content -LiteralPath $log -Value ('x' * 1100KB)
        Write-GuardLog $ctx 'after rotation'
        Test-Path -LiteralPath "$log.1" | Should -BeTrue
        @(Get-Content -LiteralPath $log).Count | Should -Be 1
    }

    It 'does nothing when the install dir is gone' {
        Remove-Item -LiteralPath $ctx.InstallDir -Recurse -Force
        Write-GuardLog $ctx 'nowhere'
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
    }
}

Describe 'Boot id and tick' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'returns a stable boot id until the volatile key is removed' {
        $first = Get-VolatileBootId -Hive $ctx.VolatileHive -Parent $ctx.VolatileParent
        $first | Should -Match '^[0-9a-f-]{36}$'
        Get-VolatileBootId -Hive $ctx.VolatileHive -Parent $ctx.VolatileParent | Should -Be $first
        Remove-VolatileBootId $ctx
        Get-VolatileBootId -Hive $ctx.VolatileHive -Parent $ctx.VolatileParent | Should -Not -Be $first
    }

    It 'reads a positive, non-decreasing system tick' {
        $a = Get-SystemTick
        $b = Get-SystemTick
        $a | Should -BeOfType [long]
        $a | Should -BeGreaterThan 0
        $b | Should -BeGreaterOrEqual $a
    }
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\State.Tests.ps1`
Expected: FAIL with `The term 'Read-State' is not recognized` (and similar for the other functions).

- [ ] **Step 4: Append the state region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region State, lock, log

function New-StateMutex {
    param([string]$Name)
    # The guard (SYSTEM) usually creates the mutex; the unlock commands run as an
    # elevated admin and must still be able to open it.
    $security = New-Object System.Security.AccessControl.MutexSecurity
    foreach ($sid in 'S-1-5-18', 'S-1-5-32-544') {
        $identity = New-Object System.Security.Principal.SecurityIdentifier $sid
        $rule = New-Object System.Security.AccessControl.MutexAccessRule($identity, 'FullControl', 'Allow')
        $security.AddAccessRule($rule)
    }
    $created = $false
    return [System.Threading.Mutex]::new($false, $Name, [ref]$created, $security)
}

function Use-StateLock {
    param([hashtable]$Ctx, [scriptblock]$Body)
    $mutex = New-StateMutex -Name $Ctx.MutexName
    $acquired = $false
    try {
        try {
            $acquired = $mutex.WaitOne($Ctx.MutexTimeoutMs)
        } catch [System.Threading.AbandonedMutexException] {
            $acquired = $true
        }
        if (-not $acquired) {
            throw "ChessKey Guard state is busy (another guard run or command holds the lock). Try again in a minute."
        }
        & $Body
    } finally {
        if ($acquired) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
}

function Get-StatePath { param([hashtable]$Ctx) Join-Path $Ctx.InstallDir 'state.json' }

function Read-State {
    param([hashtable]$Ctx)
    $path = Get-StatePath $Ctx
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    $raw = Get-Content -LiteralPath $path -Raw
    $parsed = $null
    try { if ($raw) { $parsed = $raw | ConvertFrom-Json } } catch { $parsed = $null }
    if ($parsed -isnot [System.Management.Automation.PSCustomObject]) {
        throw "state.json is unreadable ($path); not changing anything until it is fixed."
    }
    return (ConvertTo-HashtableDeep $parsed)
}

function Save-State {
    param([hashtable]$Ctx, $State)
    $path = Get-StatePath $Ctx
    $tmp = "$path.tmp"
    $bytes = (New-Object System.Text.UTF8Encoding $false).GetBytes((ConvertTo-Json -InputObject $State -Depth 20))
    $stream = [System.IO.File]::Open($tmp, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush($true)
    } finally { $stream.Dispose() }
    if (Test-Path -LiteralPath $path) {
        [System.IO.File]::Replace($tmp, $path, [NullString]::Value)
    } else {
        [System.IO.File]::Move($tmp, $path)
    }
}

function Write-GuardLog {
    param([hashtable]$Ctx, [string]$Message)
    if (-not (Test-Path -LiteralPath $Ctx.InstallDir)) { return }
    $log = Join-Path $Ctx.InstallDir 'guard.log'
    if ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 1MB) {
        Move-Item -LiteralPath $log -Destination "$log.1" -Force
    }
    $line = '{0} CHESSKEY-GUARD {1}' -f (Get-Date).ToString('o'), $Message
    Add-Content -LiteralPath $log -Value $line -Encoding UTF8
}

#endregion

#region Boot id and tick

function Get-VolatileBootId {
    param([string]$Hive, [string]$Parent)
    # A volatile key is discarded by Windows at reboot, so a new GUID means a new boot.
    $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey($Hive, [Microsoft.Win32.RegistryView]::Registry64)
    try {
        $key = $base.CreateSubKey("$Parent\Volatile", [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [Microsoft.Win32.RegistryOptions]::Volatile)
        try {
            $id = [string]$key.GetValue('BootId')
            if (-not $id) {
                $id = [guid]::NewGuid().ToString()
                $key.SetValue('BootId', $id, [Microsoft.Win32.RegistryValueKind]::String)
            }
            return $id
        } finally { $key.Dispose() }
    } finally { $base.Dispose() }
}

function Remove-VolatileBootId {
    param([hashtable]$Ctx)
    $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey($Ctx.VolatileHive, [Microsoft.Win32.RegistryView]::Registry64)
    try { $base.DeleteSubKeyTree($Ctx.VolatileParent, $false) } finally { $base.Dispose() }
}

function Get-SystemTick {
    # Milliseconds since boot, including sleep; unaffected by clock changes.
    if (-not ('ChessKeyGuardNative.Tick' -as [type])) {
        Add-Type -Namespace ChessKeyGuardNative -Name Tick -MemberDefinition '[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern ulong GetTickCount64();'
    }
    return [long][ChessKeyGuardNative.Tick]::GetTickCount64()
}

#endregion
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\State.Tests.ps1`
Expected: PASS. The lock tests take about 10 s because of the `Start-Job` startup.

- [ ] **Step 6: Run the whole suite**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1`
Expected: `failed=0`.

- [ ] **Step 7: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard state store, lock, log and boot clock"
```

---

### Task 3: Policy snapshot and sync

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Test: `chesskey-guard/tests/Policies.Tests.ps1`

**Interfaces:**
- Consumes: Task 1 registry functions, `$Ctx.Config.extensionId/installUrl/blockedHost`.
- Produces:
  - `$script:Browsers` = `[ordered]@{ edge = 'Microsoft\Edge\URLBlocklist'; chrome = 'Google\Chrome\URLBlocklist' }`.
  - `Get-FirefoxPolicyKey $Ctx` → `"$PolicyRoot\Mozilla\Firefox"`.
  - `New-ExtensionEntry $Ctx` → ordered dictionary.
  - `Test-ExtensionEntry $Entry $Desired` → bool.
  - `ConvertFrom-ExtensionSettingsText [string]` → ordered dictionary; throws `*not valid JSON*`.
  - `New-GuardState $Ctx` → a new state. Its keys are `schema, phase='active', originals{extensionSettings, disableSafeMode}, extensionSettingsWritten, blocklists{}, createdKeys=@(), unlock=$null, restored{}, firefoxWarning=$null`. It throws before any write if `ExtensionSettings` is not JSON.
  - `Sync-ExtensionSettings`, `Sync-DisableSafeMode`, `Sync-Blocklist $Ctx $State $Browser` → bool (`$true` when something was written or re-recorded).
  - `Get-BlocklistKey $Ctx $Browser`.
  - `Get-BlocklistEntries $KeyPath` → ordered name→string.
  - `Get-UnusedBlocklistName $Entries` → string.
  - `Sync-Policies $Ctx $State` → `string[]` of changed items: `Firefox ExtensionSettings`, `Firefox DisableSafeMode`, `edge URLBlocklist`, `chrome URLBlocklist`.
  - `$State.blocklists.<browser>` = `[ordered]@{ name; owned }`.

- [ ] **Step 1: Write the failing tests `chesskey-guard/tests/Policies.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')

    function Get-ExtensionSettings($ctx) {
        ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-RegValueSnapshot -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'ExtensionSettings'))
    }
    function Set-ExtensionSettingsRaw($ctx, $kind, $text) {
        Set-RegValue -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'ExtensionSettings' -Kind $kind -Data $text
    }
}

Describe 'Fresh machine' {
    BeforeEach { $ctx = New-TestContext; $root = $ctx.PolicyRoot }
    AfterEach { Remove-TestContext $ctx }

    It 'writes every policy and records ownership' {
        $state = New-GuardState $ctx
        $changed = @(Sync-Policies $ctx $state)
        $changed | Should -Be @('Firefox ExtensionSettings', 'Firefox DisableSafeMode', 'edge URLBlocklist', 'chrome URLBlocklist')

        $entry = (Get-ExtensionSettings $ctx)['altersonic@yahoo.com']
        $entry.installation_mode | Should -Be 'force_installed'
        $entry.install_url | Should -Be 'https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi'
        $entry.private_browsing | Should -BeTrue
        (Get-RegValueSnapshot -KeyPath "$root\Mozilla\Firefox" -Name 'ExtensionSettings').kind | Should -Be 'MultiString'

        $safe = Get-RegValueSnapshot -KeyPath "$root\Mozilla\Firefox" -Name 'DisableSafeMode'
        $safe.kind | Should -Be 'DWord'
        $safe.data | Should -Be 1

        foreach ($b in 'edge', 'chrome') {
            (Get-BlocklistEntries (Get-BlocklistKey $ctx $b))['1'] | Should -Be 'lichess.org'
            $state.blocklists[$b].name | Should -Be '1'
            $state.blocklists[$b].owned | Should -BeTrue
        }
        $state.originals.extensionSettings.present | Should -BeFalse
        $state.originals.disableSafeMode.present | Should -BeFalse
        @($state.createdKeys) | Should -Contain "$root\Mozilla"
        @($state.createdKeys) | Should -Contain "$root\Google\Chrome\URLBlocklist"
    }

    It 'changes nothing on a second sync' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        @(Sync-Policies $ctx $state).Count | Should -Be 0
    }

    It 'leaves unrelated sibling values alone' {
        Set-RegValue -KeyPath "$root\Mozilla\Firefox" -Name 'DisableTelemetry' -Kind 'DWord' -Data 1
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        (Get-RegValueSnapshot -KeyPath "$root\Mozilla\Firefox" -Name 'DisableTelemetry').data | Should -Be 1
    }
}

Describe 'Existing ExtensionSettings' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'merges and keeps other extensions and the * entry' {
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"*":{"installation_mode":"allowed"},"other@x":{"installation_mode":"blocked"}}'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        $settings = Get-ExtensionSettings $ctx
        $settings['*'].installation_mode | Should -Be 'allowed'
        $settings['other@x'].installation_mode | Should -Be 'blocked'
        $settings['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
        $state.originals.extensionSettings.present | Should -BeTrue
    }

    It 'keeps a REG_SZ value as REG_SZ' {
        Set-ExtensionSettingsRaw $ctx 'String' '{"*":{"installation_mode":"allowed"}}'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        (Get-RegValueSnapshot -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'ExtensionSettings').kind | Should -Be 'String'
    }

    It 'refuses to start when the value is not JSON, without changing it' {
        Set-ExtensionSettingsRaw $ctx 'String' '{nope'
        { New-GuardState $ctx } | Should -Throw '*not valid JSON*'
        (Get-RegValueSnapshot -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'ExtensionSettings').data | Should -Be '{nope'
    }

    It 're-merges the ChessKey entry if it is removed, keeping others' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"*":{"installation_mode":"allowed"}}'
        @(Sync-Policies $ctx $state) | Should -Be @('Firefox ExtensionSettings')
        $settings = Get-ExtensionSettings $ctx
        $settings['*'].installation_mode | Should -Be 'allowed'
        $settings['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }

    It 'repairs a ChessKey entry switched to allowed' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"altersonic@yahoo.com":{"installation_mode":"allowed"}}'
        @(Sync-Policies $ctx $state) | Should -Be @('Firefox ExtensionSettings')
        (Get-ExtensionSettings $ctx)['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }
}

Describe 'DisableSafeMode' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'records an existing 0 and sets 1' {
        Set-RegValue -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        $state.originals.disableSafeMode.data | Should -Be 0
        (Get-RegValueSnapshot -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'DisableSafeMode').data | Should -Be 1
    }
}

Describe 'URLBlocklist' {
    BeforeEach { $ctx = New-TestContext; $edge = Get-BlocklistKey $ctx 'edge' }
    AfterEach { Remove-TestContext $ctx }

    It 'uses the lowest unused name next to an existing entry' {
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'example.com'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        $entries = Get-BlocklistEntries $edge
        $entries['1'] | Should -Be 'example.com'
        $entries['2'] | Should -Be 'lichess.org'
        $state.blocklists.edge.name | Should -Be '2'
        $state.blocklists.edge.owned | Should -BeTrue
    }

    It 'reuses an existing lichess.org entry without writing' {
        Set-RegValue -KeyPath $edge -Name '3' -Kind 'String' -Data 'lichess.org'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        $state.blocklists.edge.name | Should -Be '3'
        $state.blocklists.edge.owned | Should -BeFalse
        @((Get-BlocklistEntries $edge).Keys) | Should -Be @('3')
    }

    It 'claims a new entry when a reused one is deleted' {
        Set-RegValue -KeyPath $edge -Name '3' -Kind 'String' -Data 'lichess.org'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Remove-ItemProperty -LiteralPath $edge -Name '3'
        @(Sync-Policies $ctx $state) | Should -Be @('edge URLBlocklist')
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        $state.blocklists.edge.name | Should -Be '1'
        $state.blocklists.edge.owned | Should -BeTrue
    }

    It 'keeps a URL written over its entry and uses a new name' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'other.org'
        Sync-Policies $ctx $state | Out-Null
        $entries = Get-BlocklistEntries $edge
        $entries['1'] | Should -Be 'other.org'
        $entries['2'] | Should -Be 'lichess.org'
        $state.blocklists.edge.name | Should -Be '2'
    }

    It 'recreates the whole key when it is deleted' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        @(Sync-Policies $ctx $state) | Should -Be @('edge URLBlocklist')
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Policies.Tests.ps1`
Expected: FAIL with `The term 'New-GuardState' is not recognized`.

- [ ] **Step 3: Append the policy region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region Policies

$script:Browsers = [ordered]@{
    edge   = 'Microsoft\Edge\URLBlocklist'
    chrome = 'Google\Chrome\URLBlocklist'
}

function Get-FirefoxPolicyKey { param([hashtable]$Ctx) "$($Ctx.PolicyRoot)\Mozilla\Firefox" }

function Get-BlocklistKey { param([hashtable]$Ctx, [string]$Browser) "$($Ctx.PolicyRoot)\$($script:Browsers[$Browser])" }

function New-ExtensionEntry {
    param([hashtable]$Ctx)
    [ordered]@{
        installation_mode = 'force_installed'
        install_url       = $Ctx.Config.installUrl
        private_browsing  = $true
    }
}

function Test-ExtensionEntry {
    param($Entry, $Desired)
    if (-not $Entry -or $Entry -isnot [System.Collections.IDictionary]) { return $false }
    return ($Entry['installation_mode'] -eq $Desired.installation_mode -and
        $Entry['install_url'] -eq $Desired.install_url -and
        $Entry['private_browsing'] -eq $true)
}

function ConvertFrom-ExtensionSettingsText {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) { return [ordered]@{} }
    try {
        $parsed = $Text | ConvertFrom-Json
    } catch {
        throw "Firefox ExtensionSettings policy is not valid JSON; refusing to modify it."
    }
    if ($parsed -isnot [System.Management.Automation.PSCustomObject]) {
        throw "Firefox ExtensionSettings policy is not valid JSON object; refusing to modify it."
    }
    return (ConvertTo-HashtableDeep $parsed)
}

function New-GuardState {
    param([hashtable]$Ctx)
    $ff = Get-FirefoxPolicyKey $Ctx
    $extensionSettings = Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings'
    # Validate before anything is written, so a conflict changes nothing.
    $null = ConvertFrom-ExtensionSettingsText (Get-RegValueText $extensionSettings)
    [ordered]@{
        schema                   = 1
        phase                    = 'active'
        originals                = [ordered]@{
            extensionSettings = $extensionSettings
            disableSafeMode   = (Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode')
        }
        extensionSettingsWritten = $null
        blocklists               = [ordered]@{}
        createdKeys              = @()
        unlock                   = $null
        restored                 = [ordered]@{}
        firefoxWarning           = $null
    }
}

function Sync-ExtensionSettings {
    param([hashtable]$Ctx, $State)
    $key = Get-FirefoxPolicyKey $Ctx
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'ExtensionSettings'
    $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText $current)
    $desired = New-ExtensionEntry $Ctx
    $id = $Ctx.Config.extensionId
    if (Test-ExtensionEntry $settings[$id] $desired) { return $false }
    $settings[$id] = $desired
    $json = ConvertTo-Json -InputObject $settings -Depth 20 -Compress
    $kind = if ($current.present) { $current.kind } else { 'MultiString' }
    Initialize-PolicyKey $Ctx $State $key
    Set-RegValue -KeyPath $key -Name 'ExtensionSettings' -Kind $kind -Data $json
    $State.extensionSettingsWritten = $json
    return $true
}

function Sync-DisableSafeMode {
    param([hashtable]$Ctx, $State)
    $key = Get-FirefoxPolicyKey $Ctx
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'DisableSafeMode'
    if ($current.present -and $current.kind -eq 'DWord' -and [int]$current.data -eq 1) { return $false }
    Initialize-PolicyKey $Ctx $State $key
    Set-RegValue -KeyPath $key -Name 'DisableSafeMode' -Kind 'DWord' -Data 1
    return $true
}

function Get-BlocklistEntries {
    param([string]$KeyPath)
    $entries = [ordered]@{}
    if (-not (Test-Path -LiteralPath $KeyPath)) { return $entries }
    $key = Get-Item -LiteralPath $KeyPath
    foreach ($name in $key.GetValueNames()) {
        if ($name) { $entries[$name] = [string]$key.GetValue($name) }
    }
    return $entries
}

function Get-UnusedBlocklistName {
    param($Entries)
    $n = 1
    while ($Entries.Contains([string]$n)) { $n++ }
    return [string]$n
}

function Sync-Blocklist {
    param([hashtable]$Ctx, $State, [string]$Browser)
    $blocked = $Ctx.Config.blockedHost
    $keyPath = Get-BlocklistKey $Ctx $Browser
    $entries = Get-BlocklistEntries $keyPath
    $record = $State.blocklists[$Browser]
    if ($record -and $entries.Contains([string]$record.name) -and $entries[[string]$record.name] -eq $blocked) {
        return $false
    }
    $match = @($entries.Keys | Where-Object { $entries[$_] -eq $blocked })
    if ($match.Count -gt 0) {
        $State.blocklists[$Browser] = [ordered]@{ name = [string]$match[0]; owned = $false }
        return $true
    }
    $name = Get-UnusedBlocklistName $entries
    Initialize-PolicyKey $Ctx $State $keyPath
    Set-RegValue -KeyPath $keyPath -Name $name -Kind 'String' -Data $blocked
    $State.blocklists[$Browser] = [ordered]@{ name = $name; owned = $true }
    return $true
}

function Sync-Policies {
    param([hashtable]$Ctx, $State)
    $changed = @()
    if (Sync-ExtensionSettings $Ctx $State) { $changed += 'Firefox ExtensionSettings' }
    if (Sync-DisableSafeMode $Ctx $State) { $changed += 'Firefox DisableSafeMode' }
    foreach ($browser in @($script:Browsers.Keys)) {
        if (Sync-Blocklist $Ctx $State $browser) { $changed += "$browser URLBlocklist" }
    }
    return , $changed
}

#endregion
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Policies.Tests.ps1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard policy snapshot and sync"
```

---

### Task 4: Unlock accounting, request and cancel

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Test: `chesskey-guard/tests/Unlock.Tests.ps1`

**Interfaces:**
- Consumes: `Use-StateLock`, `Read-State`, `Save-State` (Task 2); `New-GuardState` (Task 3); `$Ctx.GetBootId`, `$Ctx.GetTick`.
- Produces:
  - `Update-UnlockElapsed $Ctx $State`.
  - `Get-UnlockDelayMs $Ctx` → `[long]`.
  - `Test-UnlockMatured $Ctx $State` → `[bool]`.
  - `Request-Unlock $Ctx` → the `unlock` dictionary, with keys `requestedAt, elapsedMs, baseBootId, baseTick`.
  - `Clear-UnlockRequest $Ctx`.
  - Error messages: `*not installed*`, `*already in progress*`.

- [ ] **Step 1: Write the failing tests `chesskey-guard/tests/Unlock.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')

    # One guard-run's worth of accounting against the saved state.
    function Invoke-AccountingRun($ctx) {
        $s = Read-State $ctx
        Update-UnlockElapsed $ctx $s
        Save-State $ctx $s
        return $s
    }
}

Describe 'Unlock accounting' {
    BeforeEach {
        $ctx = New-TestContext
        $clock = $ctx.Test.Clock
        Save-State $ctx (New-GuardState $ctx)
    }
    AfterEach { Get-Job | Remove-Job -Force; Remove-TestContext $ctx }

    It 'baselines a request at the current boot and tick' {
        $clock.Tick = 5000000
        $unlock = Request-Unlock $ctx
        $unlock.baseBootId | Should -Be 'boot-1'
        $unlock.baseTick | Should -Be 5000000
        $unlock.elapsedMs | Should -Be 0
    }

    It 'does not reset a pending countdown on repeat requests' {
        Request-Unlock $ctx | Out-Null
        $clock.Tick += 60000
        Invoke-AccountingRun $ctx | Out-Null
        $clock.Tick += 60000
        (Request-Unlock $ctx).elapsedMs | Should -Be 60000
    }

    It 'credits only time after a request made between runs' {
        $t = $clock.Tick
        Invoke-AccountingRun $ctx | Out-Null              # run at T, nothing pending
        $clock.Tick = $t + 50000
        Request-Unlock $ctx | Out-Null                    # request at T+50s
        $clock.Tick = $t + 60000
        (Invoke-AccountingRun $ctx).unlock.elapsedMs | Should -Be 10000
    }

    It 'never writes a baseline while nothing is pending' {
        $clock.Tick += 60000
        (Invoke-AccountingRun $ctx).unlock | Should -BeNullOrEmpty
    }

    It 'ignores the wall clock (only tick deltas count)' {
        Request-Unlock $ctx | Out-Null
        Use-StateLock $ctx {
            $s = Read-State $ctx
            $s.unlock.requestedAt = (Get-Date).AddHours(-48).ToString('o')
            Save-State $ctx $s
        }
        $clock.Tick += 60000
        (Invoke-AccountingRun $ctx).unlock.elapsedMs | Should -Be 60000
    }

    It 'credits nothing across 100 rapid reboots' {
        Request-Unlock $ctx | Out-Null
        foreach ($i in 1..100) {
            $clock.BootId = "boot-r$i"
            $clock.Tick = 60000
            Invoke-AccountingRun $ctx | Out-Null
        }
        (Read-State $ctx).unlock.elapsedMs | Should -Be 0
    }

    It 'credits nothing for a non-increasing tick and re-baselines' {
        Request-Unlock $ctx | Out-Null
        $clock.Tick -= 1000
        $s = Invoke-AccountingRun $ctx
        $s.unlock.elapsedMs | Should -Be 0
        $s.unlock.baseTick | Should -Be $clock.Tick
    }

    It 'matures exactly at the delay' {
        $ctx.Config.unlockDelayHours = 1.0
        Request-Unlock $ctx | Out-Null
        $clock.Tick += 3599999
        Test-UnlockMatured $ctx (Invoke-AccountingRun $ctx) | Should -BeFalse
        $clock.Tick += 1
        Test-UnlockMatured $ctx (Invoke-AccountingRun $ctx) | Should -BeTrue
    }

    It 'is not matured when nothing is pending' {
        Test-UnlockMatured $ctx (Read-State $ctx) | Should -BeFalse
    }
}

Describe 'Request and cancel' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Get-Job | Remove-Job -Force; Remove-TestContext $ctx }

    It 'refuses a request when not installed' {
        { Request-Unlock $ctx } | Should -Throw '*not installed*'
    }

    It 'cancel clears the request, elapsed time and baseline' {
        Save-State $ctx (New-GuardState $ctx)
        Request-Unlock $ctx | Out-Null
        Clear-UnlockRequest $ctx
        (Read-State $ctx).unlock | Should -BeNullOrEmpty
    }

    It 'refuses cancel and request once teardown has started' {
        $s = New-GuardState $ctx
        $s.phase = 'teardown'
        Save-State $ctx $s
        { Clear-UnlockRequest $ctx } | Should -Throw '*already in progress*'
        { Request-Unlock $ctx } | Should -Throw '*already in progress*'
    }

    It 'keeps both the guard save and the request when they overlap' {
        Save-State $ctx (New-GuardState $ctx)
        $job = Start-LockHolder -Ctx $ctx -HoldMs 1500 -StateMarker 'from-guard'
        Request-Unlock $ctx | Out-Null
        Wait-Job $job | Out-Null
        $s = Read-State $ctx
        $s.firefoxWarning | Should -Be 'from-guard'
        $s.unlock | Should -Not -BeNullOrEmpty
    }

    It 'fails cleanly and leaves state unchanged when the lock stays busy' {
        Save-State $ctx (New-GuardState $ctx)
        $job = Start-LockHolder -Ctx $ctx -HoldMs 4000
        $ctx.MutexTimeoutMs = 300
        { Request-Unlock $ctx } | Should -Throw '*busy*'
        Wait-Job $job | Out-Null
        (Read-State $ctx).unlock | Should -BeNullOrEmpty
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Unlock.Tests.ps1`
Expected: FAIL with `The term 'Request-Unlock' is not recognized`.

- [ ] **Step 3: Append the unlock region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region Unlock

# Credits only same-boot, monotonic tick deltas since the last baseline. The wall
# clock is never used for timing, and reboots/downtime credit nothing.
function Update-UnlockElapsed {
    param([hashtable]$Ctx, $State)
    $unlock = $State.unlock
    if (-not $unlock) { return }
    $bootId = [string](& $Ctx.GetBootId $Ctx)
    $tick = [long](& $Ctx.GetTick $Ctx)
    if ($bootId -eq [string]$unlock.baseBootId -and $tick -gt [long]$unlock.baseTick) {
        $unlock.elapsedMs = [long]$unlock.elapsedMs + ($tick - [long]$unlock.baseTick)
    }
    $unlock.baseBootId = $bootId
    $unlock.baseTick = $tick
}

function Get-UnlockDelayMs {
    param([hashtable]$Ctx)
    return [long]([double]$Ctx.Config.unlockDelayHours * 3600000)
}

function Test-UnlockMatured {
    param([hashtable]$Ctx, $State)
    if (-not $State -or -not $State.unlock) { return $false }
    return ([long]$State.unlock.elapsedMs -ge (Get-UnlockDelayMs $Ctx))
}

function Request-Unlock {
    param([hashtable]$Ctx)
    Use-StateLock $Ctx {
        $state = Read-State $Ctx
        if (-not $state) { throw 'ChessKey Guard is not installed (no state.json).' }
        if ($state.phase -eq 'teardown') { throw 'Unlock is already in progress; nothing to request.' }
        if (-not $state.unlock) {
            $state.unlock = [ordered]@{
                requestedAt = (Get-Date).ToString('o')
                elapsedMs   = [long]0
                baseBootId  = [string](& $Ctx.GetBootId $Ctx)
                baseTick    = [long](& $Ctx.GetTick $Ctx)
            }
            Save-State $Ctx $state
        }
        $state.unlock
    }
}

function Clear-UnlockRequest {
    param([hashtable]$Ctx)
    Use-StateLock $Ctx {
        $state = Read-State $Ctx
        if (-not $state) { throw 'ChessKey Guard is not installed (no state.json).' }
        if ($state.phase -eq 'teardown') { throw 'Unlock is already in progress and cannot be cancelled.' }
        $state.unlock = $null
        Save-State $Ctx $state
    }
}

#endregion
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Unlock.Tests.ps1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard unlock accounting and request/cancel"
```

---

### Task 5: Teardown and the self-unregistering task action

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Test: `chesskey-guard/tests/Teardown.Tests.ps1`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  - `Invoke-FailPoint $Ctx $Name`. Points: `enter-teardown`, `restore:extensionSettings`, `restore:disableSafeMode`, `restore:edge`, `restore:chrome`, `restore:createdKeys`, `marker`, `delete-dir`, `unregister`.
  - `Restore-ExtensionSettings`, `Restore-Blocklist`, `Remove-CreatedKeys`, `Restore-PolicyItem $Ctx $State $Item`.
  - `$script:RestoreOrder`.
  - `Remove-InstallDirectory $Ctx`, which deletes `state.json` first and `guard.ps1` last.
  - `Invoke-Teardown $Ctx $State`. `$State` may be `$null`, meaning the marker path.
  - `Get-TaskActionScript -InstallDir -TaskName` → string.

- [ ] **Step 1: Write the failing tests `chesskey-guard/tests/Teardown.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')

    function Initialize-Enforced($ctx) {
        foreach ($f in 'guard.ps1', 'ChessKeyGuard.psm1', 'status.ps1') {
            Set-Content -LiteralPath (Join-Path $ctx.InstallDir $f) -Value '# stub'
        }
        $s = New-GuardState $ctx
        Sync-Policies $ctx $s | Out-Null
        Save-State $ctx $s
        return $s
    }
    function Get-Value($key, $name) { Get-RegValueSnapshot -KeyPath $key -Name $name }
}

Describe 'Teardown on a machine with no prior policies' {
    BeforeEach { $ctx = New-TestContext; $root = $ctx.PolicyRoot }
    AfterEach { Remove-TestContext $ctx }

    It 'removes every policy and created key, the folder, and the task' {
        $s = Initialize-Enforced $ctx
        Get-VolatileBootId -Hive $ctx.VolatileHive -Parent $ctx.VolatileParent | Out-Null
        Invoke-Teardown $ctx $s
        @(Get-ChildItem -LiteralPath $root).Count | Should -Be 0
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
        Get-Content -LiteralPath $ctx.MarkerPath | Should -Match 'CHESSKEY-GUARD UNLOCKED'
        $ctx.Test.Calls.Unregister | Should -Be 1
        Test-Path -LiteralPath "HKCU:\$($ctx.VolatileParent)" | Should -BeFalse
    }
}

Describe 'Teardown restores pre-existing policy exactly' {
    BeforeEach {
        $ctx = New-TestContext
        $ff = Get-FirefoxPolicyKey $ctx
        $edge = Get-BlocklistKey $ctx 'edge'
        $originalJson = '{ "*": { "installation_mode": "allowed" } }'
    }
    AfterEach { Remove-TestContext $ctx }

    It 'restores a MultiString ExtensionSettings byte-for-byte' {
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data @($originalJson)
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        $v = Get-Value $ff 'ExtensionSettings'
        $v.kind | Should -Be 'MultiString'
        @($v.data) | Should -Be @($originalJson)
    }

    It 'restores a REG_SZ ExtensionSettings as REG_SZ' {
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'String' -Data $originalJson
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        $v = Get-Value $ff 'ExtensionSettings'
        $v.kind | Should -Be 'String'
        $v.data | Should -Be $originalJson
    }

    It 'removes only the ChessKey entry when others were added after the guard' {
        $s = Initialize-Enforced $ctx
        $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-Value $ff 'ExtensionSettings'))
        $settings['new@x'] = [ordered]@{ installation_mode = 'blocked' }
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data (ConvertTo-Json -InputObject $settings -Depth 10 -Compress)
        Invoke-Teardown $ctx $s
        $after = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-Value $ff 'ExtensionSettings'))
        @($after.Keys) | Should -Be @('new@x')
    }

    It 'restores a ChessKey entry that existed before the guard' {
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data '{"altersonic@yahoo.com":{"installation_mode":"normal_installed"}}'
        $s = Initialize-Enforced $ctx
        Set-RegValue -KeyPath $ff -Name 'Unrelated' -Kind 'DWord' -Data 1
        $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-Value $ff 'ExtensionSettings'))
        $settings['new@x'] = [ordered]@{ installation_mode = 'blocked' }
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data (ConvertTo-Json -InputObject $settings -Depth 10 -Compress)
        Invoke-Teardown $ctx $s
        $after = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-Value $ff 'ExtensionSettings'))
        $after['altersonic@yahoo.com'].installation_mode | Should -Be 'normal_installed'
        $after['new@x'].installation_mode | Should -Be 'blocked'
    }

    It 'restores DisableSafeMode 0 with its DWORD type' {
        Set-RegValue -KeyPath $ff -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        $v = Get-Value $ff 'DisableSafeMode'
        $v.kind | Should -Be 'DWord'
        $v.data | Should -Be 0
    }

    It 'removes only its own blocklist entry and keeps the pre-existing key' {
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'example.com'
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        $entries = Get-BlocklistEntries $edge
        @($entries.Keys) | Should -Be @('1')
        $entries['1'] | Should -Be 'example.com'
    }

    It 'leaves a reused lichess.org entry in place' {
        Set-RegValue -KeyPath $edge -Name '7' -Kind 'String' -Data 'lichess.org'
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        (Get-BlocklistEntries $edge)['7'] | Should -Be 'lichess.org'
    }

    It 'does not delete its entry name if someone repurposed it' {
        $s = Initialize-Enforced $ctx
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'other.org'
        Invoke-Teardown $ctx $s
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'other.org'
    }
}

Describe 'Teardown with no state (marker path)' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'removes the folder and unregisters the task' {
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'guard.ps1') -Value '# stub'
        Set-Content -LiteralPath $ctx.MarkerPath -Value 'x CHESSKEY-GUARD UNLOCKED'
        Invoke-Teardown $ctx $null
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
        $ctx.Test.Calls.Unregister | Should -Be 1
    }
}

Describe 'Remove-InstallDirectory ordering' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'has deleted state.json and kept guard.ps1 when it fails partway' {
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'guard.ps1') -Value '# stub'
        Save-State $ctx ([ordered]@{ phase = 'teardown' })
        Set-FailOnce $ctx 'delete-dir'
        { Remove-InstallDirectory $ctx } | Should -Throw '*injected*'
        Test-Path -LiteralPath (Join-Path $ctx.InstallDir 'state.json') | Should -BeFalse
        Test-Path -LiteralPath (Join-Path $ctx.InstallDir 'config.json') | Should -BeFalse
        Test-Path -LiteralPath (Join-Path $ctx.InstallDir 'guard.ps1') | Should -BeTrue
    }
}

Describe 'Task action script' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'unregisters the task when guard.ps1 is gone' {
        Mock Unregister-ScheduledTask {}
        $script = Get-TaskActionScript -InstallDir $ctx.InstallDir -TaskName 'ChessKeyGuard'
        & ([scriptblock]::Create($script))
        Should -Invoke Unregister-ScheduledTask -Times 1 -Exactly -ParameterFilter { $TaskName -eq 'ChessKeyGuard' }
    }

    It 'runs guard.ps1 when it exists and passes its exit code through' {
        # This branch ends with `exit`, which would end the Pester run in-process, so
        # run it the way Task Scheduler does: in a child powershell.exe. The task name
        # is never registered, so reaching the else branch would fail the exit code.
        $ran = Join-Path $ctx.Test.TempDir 'ran.txt'
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'guard.ps1') -Value "Set-Content -LiteralPath '$ran' -Value 'yes'; exit 3"
        $script = Get-TaskActionScript -InstallDir $ctx.InstallDir -TaskName $ctx.TaskName
        & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command $script
        $LASTEXITCODE | Should -Be 3
        Test-Path -LiteralPath $ran | Should -BeTrue
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Teardown.Tests.ps1`
Expected: FAIL with `The term 'Invoke-Teardown' is not recognized`.

- [ ] **Step 3: Append the teardown region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region Teardown

$script:RestoreOrder = @('extensionSettings', 'disableSafeMode', 'edge', 'chrome', 'createdKeys')

function Invoke-FailPoint {
    param([hashtable]$Ctx, [string]$Name)
    if ($Ctx.FailPoint) { & $Ctx.FailPoint $Name }
}

function Restore-ExtensionSettings {
    param([hashtable]$Ctx, $State)
    $key = Get-FirefoxPolicyKey $Ctx
    $original = $State.originals.extensionSettings
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'ExtensionSettings'
    $currentText = Get-RegValueText $current
    $originalText = Get-RegValueText $original
    # Untouched since the guard wrote it (or already restored, or deleted): put the
    # original back exactly, kind and bytes.
    if (-not $current.present -or
        $currentText -ceq [string]$State.extensionSettingsWritten -or
        ($original.present -and $currentText -ceq $originalText)) {
        Restore-RegValue -KeyPath $key -Name 'ExtensionSettings' -Snapshot $original
        return
    }
    # Someone edited it after the guard: only undo the guard's own entry.
    try {
        $settings = ConvertFrom-ExtensionSettingsText $currentText
    } catch {
        Restore-RegValue -KeyPath $key -Name 'ExtensionSettings' -Snapshot $original
        return
    }
    $id = $Ctx.Config.extensionId
    $settings.Remove($id)
    $originalSettings = ConvertFrom-ExtensionSettingsText $originalText
    if ($originalSettings.Contains($id)) { $settings[$id] = $originalSettings[$id] }
    if ($settings.Count -eq 0 -and -not $original.present) {
        Remove-ItemProperty -LiteralPath $key -Name 'ExtensionSettings'
        return
    }
    Set-RegValue -KeyPath $key -Name 'ExtensionSettings' -Kind $current.kind -Data (ConvertTo-Json -InputObject $settings -Depth 20 -Compress)
}

function Restore-Blocklist {
    param([hashtable]$Ctx, $State, [string]$Browser)
    $record = $State.blocklists[$Browser]
    if (-not $record -or -not $record.owned) { return }
    $keyPath = Get-BlocklistKey $Ctx $Browser
    $entries = Get-BlocklistEntries $keyPath
    $name = [string]$record.name
    if ($entries.Contains($name) -and $entries[$name] -eq $Ctx.Config.blockedHost) {
        Remove-ItemProperty -LiteralPath $keyPath -Name $name
    }
}

function Remove-CreatedKeys {
    param([hashtable]$Ctx, $State)
    foreach ($keyPath in @(@($State.createdKeys) | Sort-Object -Property Length -Descending)) {
        if (-not (Test-Path -LiteralPath $keyPath)) { continue }
        $key = Get-Item -LiteralPath $keyPath
        if ($key.SubKeyCount -eq 0 -and $key.ValueCount -eq 0) { Remove-Item -LiteralPath $keyPath }
    }
}

function Restore-PolicyItem {
    param([hashtable]$Ctx, $State, [string]$Item)
    switch ($Item) {
        'extensionSettings' { Restore-ExtensionSettings $Ctx $State }
        'disableSafeMode' { Restore-RegValue -KeyPath (Get-FirefoxPolicyKey $Ctx) -Name 'DisableSafeMode' -Snapshot $State.originals.disableSafeMode }
        'createdKeys' { Remove-CreatedKeys $Ctx $State }
        default { Restore-Blocklist $Ctx $State $Item }
    }
}

function Remove-InstallDirectory {
    param([hashtable]$Ctx)
    $dir = $Ctx.InstallDir
    if (-not (Test-Path -LiteralPath $dir)) { return }
    # state.json first: a half-deleted folder must never hold state without config.json.
    $statePath = Get-StatePath $Ctx
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath -Force }
    Get-ChildItem -LiteralPath $dir -Force | Where-Object { $_.Name -ne 'guard.ps1' } | Remove-Item -Recurse -Force
    Invoke-FailPoint $Ctx 'delete-dir'
    $guard = Join-Path $dir 'guard.ps1'
    if (Test-Path -LiteralPath $guard) { Remove-Item -LiteralPath $guard -Force }
    Remove-Item -LiteralPath $dir -Force
}

# Idempotent: every step skips work already done, and the task stays registered
# until the last step, so a failure anywhere is retried on the next minute's run.
function Invoke-Teardown {
    param([hashtable]$Ctx, $State)
    if ($State) {
        if ($State.phase -ne 'teardown') {
            $State.phase = 'teardown'
            Invoke-FailPoint $Ctx 'enter-teardown'
            Save-State $Ctx $State
            Write-GuardLog $Ctx 'TEARDOWN started'
        }
        if (-not $State.restored) { $State.restored = [ordered]@{} }
        foreach ($item in $script:RestoreOrder) {
            if ($State.restored[$item]) { continue }
            Invoke-FailPoint $Ctx "restore:$item"
            Restore-PolicyItem $Ctx $State $item
            $State.restored[$item] = $true
            Save-State $Ctx $State
        }
        Remove-VolatileBootId $Ctx
        if (-not (Test-Path -LiteralPath $Ctx.MarkerPath)) {
            Invoke-FailPoint $Ctx 'marker'
            Add-Content -LiteralPath $Ctx.MarkerPath -Value ('{0} CHESSKEY-GUARD UNLOCKED' -f (Get-Date).ToString('o')) -Encoding UTF8
        }
    }
    Remove-InstallDirectory $Ctx
    Invoke-FailPoint $Ctx 'unregister'
    & $Ctx.UnregisterTask $Ctx
}

# The scheduled task runs this instead of guard.ps1 directly, so a task left behind
# after its files are gone unregisters itself.
function Get-TaskActionScript {
    param([string]$InstallDir, [string]$TaskName)
    $guard = Join-Path $InstallDir 'guard.ps1'
    return "if (Test-Path -LiteralPath '$guard') { & '$guard'; exit `$LASTEXITCODE } else { Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false }"
}

#endregion
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Teardown.Tests.ps1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard idempotent teardown and self-unregistering task action"
```

---

### Task 6: Guard run orchestration, config, Firefox version, `guard.ps1`

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Create: `chesskey-guard/guard.ps1`
- Test: `chesskey-guard/tests/GuardRun.Tests.ps1`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces:
  - `Read-GuardConfig -Path` → ordered dictionary; throws `config.json ...`.
  - `Get-FirefoxVersion $Ctx` → string or `$null`.
  - `Test-FirefoxVersionSupported [string]` → bool.
  - `Write-FirefoxVersionWarning $Ctx $State`.
  - `Invoke-GuardRun $Ctx`.
  - `Invoke-GuardMain $Ctx` → exit code, `0` or `1`.

- [ ] **Step 1: Write the failing tests `chesskey-guard/tests/GuardRun.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    function Get-LogLines($ctx) {
        $log = Join-Path $ctx.InstallDir 'guard.log'
        if (Test-Path -LiteralPath $log) { @(Get-Content -LiteralPath $log) } else { @() }
    }
}

Describe 'Firefox version support' {
    It '<Version> -> <Expected>' -TestCases @(
        @{ Version = '153.0.1 (x64 en-US)'; Expected = $true }
        @{ Version = '136.0'; Expected = $true }
        @{ Version = '135.0.1 (x64 en-US)'; Expected = $false }
        @{ Version = '128.8.0esr (x64 en-US)'; Expected = $true }
        @{ Version = '128.8.0 ESR (x64 en-US)'; Expected = $true }
        @{ Version = '128.7.1esr (x64 en-US)'; Expected = $false }
        @{ Version = '129.0'; Expected = $false }
        @{ Version = 'garbage'; Expected = $false }
        @{ Version = ''; Expected = $false }
    ) {
        Test-FirefoxVersionSupported $Version | Should -Be $Expected
    }
}

Describe 'Guard runs' {
    BeforeEach { $ctx = New-TestContext; $edge = Get-BlocklistKey $ctx 'edge' }
    AfterEach { Remove-TestContext $ctx }

    It 'applies everything on the first run and logs APPLIED' {
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        Test-Path -LiteralPath (Join-Path $ctx.InstallDir 'state.json') | Should -BeTrue
        @((Get-LogLines $ctx) -match 'CHESSKEY-GUARD APPLIED Firefox ExtensionSettings$').Count | Should -Be 1
        @((Get-LogLines $ctx) -match 'APPLIED').Count | Should -Be 4
    }

    It 'logs nothing on a no-change run' {
        Invoke-GuardMain $ctx | Out-Null
        $before = @(Get-LogLines $ctx).Count
        Invoke-GuardMain $ctx | Should -Be 0
        @(Get-LogLines $ctx).Count | Should -Be $before
    }

    It 'repairs a deleted Edge key and logs REPAIRED' {
        Invoke-GuardMain $ctx | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        @((Get-LogLines $ctx) -match 'CHESSKEY-GUARD REPAIRED edge URLBlocklist$').Count | Should -Be 1
    }

    It 'changes nothing and exits 1 when state.json is unreadable' {
        Invoke-GuardMain $ctx | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        $statePath = Join-Path $ctx.InstallDir 'state.json'
        Set-Content -LiteralPath $statePath -Value '{ broken'
        Invoke-GuardMain $ctx | Should -Be 1
        Test-Path -LiteralPath $edge | Should -BeFalse
        Get-Content -LiteralPath $statePath -Raw | Should -Match '\{ broken'
        @((Get-LogLines $ctx) -match 'ERROR state.json is unreadable').Count | Should -Be 1
    }

    It 'exits 1 and logs when config.json is invalid' {
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'config.json') -Value 'nope'
        Invoke-GuardMain $ctx | Should -Be 1
        @((Get-LogLines $ctx) -match 'ERROR config.json').Count | Should -Be 1
    }

    It 'exits 1 when unlockDelayHours is not positive' {
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'config.json') -Value '{"unlockDelayHours":0,"extensionId":"a","installUrl":"b","blockedHost":"c"}'
        Invoke-GuardMain $ctx | Should -Be 1
    }

    It 'warns once about an old Firefox but keeps enforcing' {
        Set-ItemProperty -LiteralPath "$($ctx.Test.RegRoot)\Firefox" -Name CurrentVersion -Value '135.0 (x64 en-US)'
        Invoke-GuardMain $ctx | Should -Be 0
        Invoke-GuardMain $ctx | Should -Be 0
        @((Get-LogLines $ctx) -match 'WARN firefox-version 135.0 \(x64 en-US\)').Count | Should -Be 1
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
    }

    It 'warns when Firefox is not found' {
        Remove-Item -LiteralPath "$($ctx.Test.RegRoot)\Firefox" -Recurse
        Invoke-GuardMain $ctx | Should -Be 0
        @((Get-LogLines $ctx) -match 'WARN firefox-version not-found').Count | Should -Be 1
    }

    It 'ignores a forged marker while an active state exists' {
        Invoke-GuardMain $ctx | Out-Null
        Set-Content -LiteralPath $ctx.MarkerPath -Value 'forged'
        Remove-Item -LiteralPath $edge -Recurse
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeTrue
    }

    It 'tears everything down once the unlock matures' {
        Invoke-GuardMain $ctx | Out-Null
        Request-Unlock $ctx | Out-Null
        $ctx.Test.Clock.Tick += 24 * 3600000
        Invoke-GuardMain $ctx | Should -Be 0
        @(Get-ChildItem -LiteralPath $ctx.PolicyRoot).Count | Should -Be 0
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
        $ctx.Test.Calls.Unregister | Should -Be 1
    }

    It 'stays enforced while the unlock is pending' {
        Invoke-GuardMain $ctx | Out-Null
        Request-Unlock $ctx | Out-Null
        $ctx.Test.Clock.Tick += 23 * 3600000
        Remove-Item -LiteralPath $edge -Recurse
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
    }
}

Describe 'Teardown retries after a failure at <Point>' -ForEach @(
    @{ Point = 'enter-teardown' }
    @{ Point = 'restore:extensionSettings' }
    @{ Point = 'restore:disableSafeMode' }
    @{ Point = 'restore:edge' }
    @{ Point = 'restore:chrome' }
    @{ Point = 'restore:createdKeys' }
    @{ Point = 'marker' }
    @{ Point = 'delete-dir' }
    @{ Point = 'unregister' }
) {
    BeforeEach {
        $ctx = New-TestContext
        $ff = Get-FirefoxPolicyKey $ctx
        $edge = Get-BlocklistKey $ctx 'edge'
        $originalJson = '{ "*": { "installation_mode": "allowed" } }'
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data @($originalJson)
        Set-RegValue -KeyPath $ff -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'example.com'
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'guard.ps1') -Value '# stub'
        Invoke-GuardMain $ctx | Out-Null
        Request-Unlock $ctx | Out-Null
        $ctx.Test.Clock.Tick += 24 * 3600000
    }
    AfterEach { Remove-TestContext $ctx }

    It 'completes on the next run with policies restored exactly' {
        Set-FailOnce $ctx $Point
        Invoke-GuardMain $ctx | Should -Be 1
        Invoke-GuardMain $ctx | Should -Be 0

        $es = Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings'
        $es.kind | Should -Be 'MultiString'
        @($es.data) | Should -Be @($originalJson)
        (Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode').data | Should -Be 0
        $entries = Get-BlocklistEntries $edge
        @($entries.Keys) | Should -Be @('1')
        Test-Path -LiteralPath (Get-BlocklistKey $ctx 'chrome') | Should -BeFalse
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
        Test-Path -LiteralPath $ctx.MarkerPath | Should -BeTrue
        $ctx.Test.Calls.Unregister | Should -Be 1
    }

    It 'keeps policies enforced if it failed before restoring anything' -Skip:($Point -ne 'enter-teardown') {
        Set-FailOnce $ctx $Point
        Invoke-GuardMain $ctx | Should -Be 1
        (Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode').data | Should -Be 1
        (Read-State $ctx).phase | Should -Be 'active'
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\GuardRun.Tests.ps1`
Expected: FAIL with `The term 'Test-FirefoxVersionSupported' is not recognized`.

- [ ] **Step 3: Append the orchestration region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region Guard run

function Read-GuardConfig {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "config.json not found at $Path" }
    $raw = Get-Content -LiteralPath $Path -Raw
    try { $parsed = $raw | ConvertFrom-Json } catch { throw "config.json is not valid JSON ($Path)" }
    if ($parsed -isnot [System.Management.Automation.PSCustomObject]) { throw "config.json must be a JSON object ($Path)" }
    $cfg = ConvertTo-HashtableDeep $parsed
    foreach ($name in 'extensionId', 'installUrl', 'blockedHost') {
        if ([string]::IsNullOrWhiteSpace([string]$cfg[$name])) { throw "config.json: '$name' is required" }
    }
    $hours = 0.0
    $ok = [double]::TryParse([string]$cfg['unlockDelayHours'], [System.Globalization.NumberStyles]::Float,
        [System.Globalization.CultureInfo]::InvariantCulture, [ref]$hours)
    if (-not $ok -or $hours -le 0) { throw "config.json: 'unlockDelayHours' must be a positive number" }
    $cfg['unlockDelayHours'] = $hours
    return $cfg
}

function Get-FirefoxVersion {
    param([hashtable]$Ctx)
    foreach ($keyPath in $Ctx.FirefoxKeys) {
        if (Test-Path -LiteralPath $keyPath) {
            $value = (Get-Item -LiteralPath $keyPath).GetValue('CurrentVersion')
            if ($value) { return [string]$value }
        }
    }
    return $null
}

# Firefox 136+, or ESR 128.8+ (no non-ESR 128.x ever reached .8, so the major/minor
# test alone is enough).
function Test-FirefoxVersionSupported {
    param([string]$Version)
    if ($Version -notmatch '^(\d+)\.(\d+)') { return $false }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -ge 136) { return $true }
    return ($major -eq 128 -and $minor -ge 8)
}

function Write-FirefoxVersionWarning {
    param([hashtable]$Ctx, $State)
    $version = Get-FirefoxVersion $Ctx
    $problem = $null
    if (-not $version) { $problem = 'not-found' }
    elseif (-not (Test-FirefoxVersionSupported $version)) { $problem = $version }
    if ($problem -and $State.firefoxWarning -ne $problem) {
        Write-GuardLog $Ctx "WARN firefox-version $problem"
    }
    $State['firefoxWarning'] = $problem
}

function Invoke-GuardRun {
    param([hashtable]$Ctx)
    Use-StateLock $Ctx {
        $state = Read-State $Ctx
        # The marker only matters once state.json is gone; a marker next to an active
        # state is ignored (standard users can create files beside it).
        if (-not $state -and (Test-Path -LiteralPath $Ctx.MarkerPath)) {
            Invoke-Teardown $Ctx $null
            return
        }
        $Ctx.Config = Read-GuardConfig (Join-Path $Ctx.InstallDir 'config.json')
        $fresh = $false
        if (-not $state) {
            $state = New-GuardState $Ctx
            $fresh = $true
        }
        if ($state.phase -eq 'teardown') {
            Invoke-Teardown $Ctx $state
            return
        }
        Update-UnlockElapsed $Ctx $state
        if (Test-UnlockMatured $Ctx $state) {
            Invoke-Teardown $Ctx $state
            return
        }
        Write-FirefoxVersionWarning $Ctx $state
        $verb = if ($fresh) { 'APPLIED' } else { 'REPAIRED' }
        foreach ($item in @(Sync-Policies $Ctx $state)) { Write-GuardLog $Ctx "$verb $item" }
        Save-State $Ctx $state
    }
}

function Invoke-GuardMain {
    param([hashtable]$Ctx)
    try {
        Invoke-GuardRun $Ctx
        return 0
    } catch {
        Write-GuardLog $Ctx ('ERROR {0}' -f $_.Exception.Message)
        return 1
    }
}

#endregion
```

- [ ] **Step 4: Create `chesskey-guard/guard.ps1`**

```powershell
# Run every minute by the ChessKeyGuard scheduled task (as SYSTEM).
# Design: docs/superpowers/specs/2026-10-09-chesskey-guard-design.md
$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
    $ctx = New-GuardContext -InstallDir $PSScriptRoot
    exit (Invoke-GuardMain $ctx)
} catch {
    exit 1
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\GuardRun.Tests.ps1`
Expected: PASS.

- [ ] **Step 6: Run the whole suite**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1`
Expected: `failed=0`.

- [ ] **Step 7: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard run orchestration and guard.ps1 entry point"
```

---

### Task 7: Install preflight, status, and the user-facing scripts

**Files:**
- Modify: `chesskey-guard/ChessKeyGuard.psm1` (append a region)
- Create: `chesskey-guard/install.ps1`
- Create: `chesskey-guard/request-unlock.ps1`
- Create: `chesskey-guard/cancel-unlock.ps1`
- Create: `chesskey-guard/status.ps1`
- Create: `chesskey-guard/README.md`
- Test: `chesskey-guard/tests/Install.Tests.ps1`

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces:
  - `Test-InstallPreflight $Ctx` → the Firefox version string. Throws `*not installed*`, `*too old*`, `*not valid JSON*`, `*state.json is unreadable*`.
  - `Rename-UnlockMarker $Ctx`.
  - `Set-GuardAcl -Path`.
  - `Register-GuardTask $Ctx`.
  - `Get-GuardStatus $Ctx` → PSCustomObject with `Installed, Phase, FirefoxVersion, ExtensionForced, SafeModeDisabled, edgeBlocked, chromeBlocked, UnlockPending, UnlockRemainingHours`.

- [ ] **Step 1: Write the failing tests `chesskey-guard/tests/Install.Tests.ps1`**

```powershell
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..\ChessKeyGuard.psm1') -Force
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
}

Describe 'Install preflight' {
    BeforeEach { $ctx = New-TestContext; $ffVersionKey = "$($ctx.Test.RegRoot)\Firefox" }
    AfterEach { Remove-TestContext $ctx }

    It 'passes and returns the version on a supported Firefox' {
        Test-InstallPreflight $ctx | Should -Be '153.0.1 (x64 en-US)'
    }

    It 'refuses Firefox 135' {
        Set-ItemProperty -LiteralPath $ffVersionKey -Name CurrentVersion -Value '135.0 (x64 en-US)'
        { Test-InstallPreflight $ctx } | Should -Throw '*too old*'
    }

    It 'accepts ESR 128.8' {
        Set-ItemProperty -LiteralPath $ffVersionKey -Name CurrentVersion -Value '128.8.0esr (x64 en-US)'
        Test-InstallPreflight $ctx | Should -Be '128.8.0esr (x64 en-US)'
    }

    It 'refuses when Firefox is not installed' {
        Remove-Item -LiteralPath $ffVersionKey -Recurse
        { Test-InstallPreflight $ctx } | Should -Throw '*not installed*'
    }

    It 'refuses unparsable ExtensionSettings without changing the registry' {
        Set-RegValue -KeyPath (Get-FirefoxPolicyKey $ctx) -Name 'ExtensionSettings' -Kind 'String' -Data '{nope'
        { Test-InstallPreflight $ctx } | Should -Throw '*not valid JSON*'
        @(Get-ChildItem -LiteralPath $ctx.PolicyRoot -Recurse | Where-Object { $_.PSChildName -eq 'URLBlocklist' }).Count | Should -Be 0
    }

    It 'refuses an unreadable existing state.json' {
        Set-Content -LiteralPath (Join-Path $ctx.InstallDir 'state.json') -Value 'garbage'
        { Test-InstallPreflight $ctx } | Should -Throw '*state.json is unreadable*'
    }
}

Describe 'Rename-UnlockMarker' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'moves an old marker aside with a timestamp' {
        Set-Content -LiteralPath $ctx.MarkerPath -Value 'old'
        Rename-UnlockMarker $ctx
        Test-Path -LiteralPath $ctx.MarkerPath | Should -BeFalse
        @(Get-ChildItem -LiteralPath $ctx.Test.TempDir -Filter 'ChessKeyGuard-unlocked.*.log').Count | Should -Be 1
    }

    It 'does nothing without a marker' {
        { Rename-UnlockMarker $ctx } | Should -Not -Throw
    }
}

Describe 'Get-GuardStatus' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach { Remove-TestContext $ctx }

    It 'reports not installed before the first run' {
        $s = Get-GuardStatus $ctx
        $s.Installed | Should -BeFalse
        $s.ExtensionForced | Should -BeFalse
    }

    It 'reports enforcement and remaining unlock time' {
        Invoke-GuardMain $ctx | Out-Null
        Request-Unlock $ctx | Out-Null
        $s = Get-GuardStatus $ctx
        $s.Installed | Should -BeTrue
        $s.Phase | Should -Be 'active'
        $s.ExtensionForced | Should -BeTrue
        $s.SafeModeDisabled | Should -BeTrue
        $s.edgeBlocked | Should -BeTrue
        $s.chromeBlocked | Should -BeTrue
        $s.UnlockPending | Should -BeTrue
        $s.UnlockRemainingHours | Should -Be 24
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Install.Tests.ps1`
Expected: FAIL with `The term 'Test-InstallPreflight' is not recognized`.

- [ ] **Step 3: Append the install region to `chesskey-guard/ChessKeyGuard.psm1`**

```powershell
#region Install and status

function Test-InstallPreflight {
    param([hashtable]$Ctx)
    $version = Get-FirefoxVersion $Ctx
    if (-not $version) {
        throw 'Firefox is not installed (no CurrentVersion under the Mozilla Firefox registry key). Install Firefox 136+ first.'
    }
    if (-not (Test-FirefoxVersionSupported $version)) {
        throw "Firefox $version is too old. ChessKey Guard needs Firefox 136+ or ESR 128.8+. Update Firefox first."
    }
    $null = Read-State $Ctx
    $ff = Get-FirefoxPolicyKey $Ctx
    $null = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings'))
    $null = Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode'
    return $version
}

function Rename-UnlockMarker {
    param([hashtable]$Ctx)
    if (-not (Test-Path -LiteralPath $Ctx.MarkerPath)) { return }
    $dir = Split-Path -Path $Ctx.MarkerPath -Parent
    $name = 'ChessKeyGuard-unlocked.{0}.log' -f (Get-Date).ToString('yyyyMMdd-HHmmss')
    Move-Item -LiteralPath $Ctx.MarkerPath -Destination (Join-Path $dir $name)
}

function Set-GuardAcl {
    param([string]$Path)
    & icacls.exe $Path /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "icacls failed on $Path (exit $LASTEXITCODE)" }
}

function Register-GuardTask {
    param([hashtable]$Ctx)
    $script = Get-TaskActionScript -InstallDir $Ctx.InstallDir -TaskName $Ctx.TaskName
    $action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
        -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command `"$script`""
    $triggers = @(
        (New-ScheduledTaskTrigger -AtStartup),
        (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1))
    )
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
    Register-ScheduledTask -TaskName $Ctx.TaskName -Action $action -Trigger $triggers -Principal $principal `
        -Settings $settings -Force | Out-Null
}

function Get-GuardStatus {
    param([hashtable]$Ctx)
    $state = Read-State $Ctx
    $ff = Get-FirefoxPolicyKey $Ctx
    $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText (Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings'))
    $safe = Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode'
    $status = [ordered]@{
        Installed            = [bool]$state
        Phase                = $null
        FirefoxVersion       = (Get-FirefoxVersion $Ctx)
        ExtensionForced      = (Test-ExtensionEntry $settings[$Ctx.Config.extensionId] (New-ExtensionEntry $Ctx))
        SafeModeDisabled     = [bool]($safe.present -and [int]$safe.data -eq 1)
        UnlockPending        = $false
        UnlockRemainingHours = $null
    }
    foreach ($browser in @($script:Browsers.Keys)) {
        $entries = Get-BlocklistEntries (Get-BlocklistKey $Ctx $browser)
        $status["$($browser)Blocked"] = (@($entries.Values | Where-Object { $_ -eq $Ctx.Config.blockedHost }).Count -gt 0)
    }
    if ($state) {
        $status.Phase = $state.phase
        if ($state.unlock) {
            $status.UnlockPending = $true
            $remaining = (Get-UnlockDelayMs $Ctx) - [long]$state.unlock.elapsedMs
            $status.UnlockRemainingHours = [math]::Round([math]::Max(0, $remaining) / 3600000, 2)
        }
    }
    return [pscustomobject]$status
}

#endregion
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1 -Path chesskey-guard\tests\Install.Tests.ps1`
Expected: PASS.

- [ ] **Step 5: Create `chesskey-guard/install.ps1`**

```powershell
#Requires -RunAsAdministrator
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
New-Item -ItemType Directory -Path $ctx.InstallDir -Force | Out-Null
foreach ($file in 'ChessKeyGuard.psm1', 'guard.ps1', 'request-unlock.ps1', 'cancel-unlock.ps1', 'status.ps1', 'config.json') {
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination $ctx.InstallDir -Force
}
Set-GuardAcl -Path $ctx.InstallDir
Register-GuardTask $ctx

if ((Invoke-GuardMain $ctx) -ne 0) {
    throw "The first guard run failed; see $(Join-Path $ctx.InstallDir 'guard.log')"
}
& (Join-Path $ctx.InstallDir 'status.ps1')
Write-Host ''
Write-Host 'Installed. Restart Firefox, then check about:policies and about:addons.'
Write-Host "To remove later: run $(Join-Path $ctx.InstallDir 'request-unlock.ps1') elevated and wait $($ctx.Config.unlockDelayHours)h of uptime."
```

- [ ] **Step 6: Create `chesskey-guard/request-unlock.ps1`**

```powershell
#Requires -RunAsAdministrator
# Starts the cooling-off countdown. Once it matures, the guard removes everything.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext -InstallDir $PSScriptRoot
$ctx.Config = Read-GuardConfig (Join-Path $PSScriptRoot 'config.json')
$unlock = Request-Unlock $ctx
$remainingHours = ((Get-UnlockDelayMs $ctx) - [long]$unlock.elapsedMs) / 3600000
Write-Host ('Unlock requested at {0}.' -f $unlock.requestedAt)
Write-Host ('It completes after {0:N1} more hours of uptime. Shutdowns pause the countdown; sleep does not.' -f $remainingHours)
Write-Host "Changed your mind? Run $(Join-Path $PSScriptRoot 'cancel-unlock.ps1')."
```

- [ ] **Step 7: Create `chesskey-guard/cancel-unlock.ps1`**

```powershell
#Requires -RunAsAdministrator
# Cancels a pending unlock request. Refused once teardown has started.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ChessKeyGuard.psm1') -Force
$ctx = New-GuardContext -InstallDir $PSScriptRoot
$ctx.Config = Read-GuardConfig (Join-Path $PSScriptRoot 'config.json')
Clear-UnlockRequest $ctx
Write-Host 'Unlock request cancelled. ChessKey Guard stays on.'
```

- [ ] **Step 8: Create `chesskey-guard/status.ps1`**

```powershell
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
```

- [ ] **Step 9: Create `chesskey-guard/README.md`**

````markdown
# ChessKey Guard

Keeps the ChessKey extension switched on. A SYSTEM scheduled task, run every minute, enforces
three things:

- **Firefox:** ChessKey is force-installed, so it can't be disabled or removed. It stays active in
  private windows, and Troubleshoot Mode is turned off.
- **Edge and Chrome:** lichess.org is blocked.
- **Repairs:** any policy that is deleted or edited is put back within about a minute.

The only way to turn it off is to request an unlock and then wait 24 hours of uptime.

Design: `docs/superpowers/specs/2026-10-09-chesskey-guard-design.md`

## Requirements

- Windows 10/11, Windows PowerShell 5.1
- Firefox 136+ (or ESR 128.8+)
- ChessKey published on AMO (it is force-installed from the AMO `latest` URL)

## Install

From an elevated Windows PowerShell in the repo root:

```
powershell.exe -ExecutionPolicy Bypass -File chesskey-guard\install.ps1
```

Then restart Firefox and check `about:policies` and `about:addons`.

## Unlock (the only uninstall)

```
powershell.exe -ExecutionPolicy Bypass -File C:\ProgramData\ChessKeyGuard\request-unlock.ps1   # elevated
powershell.exe -ExecutionPolicy Bypass -File C:\ProgramData\ChessKeyGuard\status.ps1           # remaining time
powershell.exe -ExecutionPolicy Bypass -File C:\ProgramData\ChessKeyGuard\cancel-unlock.ps1    # elevated
```

The countdown counts only uptime. Shutdowns and reboots pause it, but sleep does count. When it
matures, the guard puts back any browser policies that existed before it was installed, then
deletes `C:\ProgramData\ChessKeyGuard` and its scheduled task. It leaves
`C:\ProgramData\ChessKeyGuard-unlocked.log` as a record.

## Tests

```
powershell.exe -NoProfile -Command "Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -Force -SkipPublisherCheck"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1
```
````

- [ ] **Step 10: Run the whole suite**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1`
Expected: `failed=0`.

- [ ] **Step 11: Commit**

```bash
git add chesskey-guard
git commit -m "Add ChessKey Guard install, unlock, cancel and status scripts"
```

---

### Task 8: Manual verification on the real machine

This task installs the guard for real, so **ask the user before starting it.** It needs an elevated shell. Prerequisite: ChessKey 2.1.1 is live on AMO (it was submitted 2026-10-10).

- [ ] **Step 1: Full test suite green**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1`
Expected: `failed=0`.

- [ ] **Step 2: Install with a short delay first, to rehearse the unlock**

In the repo copy, temporarily set `chesskey-guard/config.json` `unlockDelayHours` to `0.05` (3 min). Do not commit that change. From an elevated shell, run `powershell.exe -ExecutionPolicy Bypass -File chesskey-guard\install.ps1`.
Expected: `Firefox 153.x detected: OK.`, then the status shows `ExtensionForced : True`, `SafeModeDisabled : True`, `edgeBlocked : True`, `chromeBlocked : True`.

- [ ] **Step 3: Check the task definition**

Run: `Get-ScheduledTask ChessKeyGuard | Select-Object -ExpandProperty Triggers | Format-List *Repetition*, StartBoundary`
Expected: one trigger with `Interval PT1M` and an empty `Duration` (indefinite), plus an at-startup trigger. Principal: `SYSTEM`, `Highest`. If `Duration` is not indefinite, re-register with `-RepetitionDuration ([TimeSpan]::FromDays(3650))` and note it in the module.

- [ ] **Step 4: Browser checks**

- Firefox `about:policies` lists `ExtensionSettings` and `DisableSafeMode` as active.
- `about:addons` shows ChessKey with no Disable or Remove option.
- ChessKey runs in a private window.
- Edge: `https://lichess.org` shows the "blocked by your organization" page.

- [ ] **Step 5: Tamper repair**

Run (elevated): `Remove-Item 'HKLM:\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist' -Recurse`. Wait about 70 s.
Expected: the key is back, and `C:\ProgramData\ChessKeyGuard\guard.log` has a `CHESSKEY-GUARD REPAIRED edge URLBlocklist` line.

- [ ] **Step 6: Admin command against the SYSTEM-owned mutex, plus the unlock rehearsal**

Run (elevated, while the task is running every minute): `powershell.exe -ExecutionPolicy Bypass -File C:\ProgramData\ChessKeyGuard\request-unlock.ps1`
Expected: no access-denied or busy error, and it reports about 0.05 h remaining. Within about 5 minutes, all of these are true:
- `HKLM:\SOFTWARE\Policies\Mozilla\Firefox` has no `ExtensionSettings` or `DisableSafeMode`, unless they pre-existed;
- Edge loads lichess;
- `Get-ScheduledTask ChessKeyGuard` returns nothing;
- `C:\ProgramData\ChessKeyGuard` is gone;
- `C:\ProgramData\ChessKeyGuard-unlocked.log` exists.

- [ ] **Step 7: Reboot accounting**

Restore `unlockDelayHours` to `24` in the repo (`git checkout chesskey-guard/config.json`) and run `install.ps1` again. Request an unlock and note `UnlockRemainingHours` from `status.ps1` after a few minutes. Reboot, then run `status.ps1` again.
Expected: remaining hours have not dropped by the downtime; at most a few minutes of pre-reboot uptime are credited. Then run `cancel-unlock.ps1` (elevated). Expected: `UnlockPending : False`.

- [ ] **Step 8: Leave it installed and report**

Report each step's outcome to the user. Nothing to commit unless Step 3 needed a change. In that case commit the module fix as "Make ChessKey Guard task repetition indefinite".
