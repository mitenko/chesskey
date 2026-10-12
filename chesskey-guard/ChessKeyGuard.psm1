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
$script:TextKinds = @('String', 'ExpandString', 'MultiString')

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

# -AnyKind reports an unsupported kind (with no data) instead of throwing; only callers
# that replace such a value outright use it, so install still refuses to snapshot one.
function Get-RegValueSnapshot {
    param([string]$KeyPath, [string]$Name, [switch]$AnyKind)
    if (-not (Test-Path -LiteralPath $KeyPath)) { return [ordered]@{ present = $false } }
    $key = Get-Item -LiteralPath $KeyPath
    if (@($key.GetValueNames()) -notcontains $Name) { return [ordered]@{ present = $false } }
    $kind = $key.GetValueKind($Name).ToString()
    if ($script:SupportedKinds -notcontains $kind) {
        if ($AnyKind) { return [ordered]@{ present = $true; kind = $kind; data = $null } }
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

#region State, lock, log

function New-StateMutex {
    param([string]$Name)
    # The guard (SYSTEM) usually creates the mutex; the unlock commands run as an
    # elevated admin and must still be able to open it.
    $security = New-Object System.Security.AccessControl.MutexSecurity
    # Also grant the creating user: a non-elevated process (Administrators is deny-only
    # in its token) could otherwise not reopen the mutex from a second process.
    $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    foreach ($sid in ('S-1-5-18', 'S-1-5-32-544', $currentSid | Select-Object -Unique)) {
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
    # Save-State writes BOM-less UTF-8; Get-Content on 5.1 would decode that as ANSI.
    $raw = [System.IO.File]::ReadAllText($path, (New-Object System.Text.UTF8Encoding $false))
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
        $Entry['private_browsing'] -is [bool] -and $Entry['private_browsing'])
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

function Test-TextValue {
    param($Snapshot)
    return ($Snapshot.present -and $script:TextKinds -contains $Snapshot.kind)
}

function Sync-ExtensionSettings {
    param([hashtable]$Ctx, $State)
    $key = Get-FirefoxPolicyKey $Ctx
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'ExtensionSettings' -AnyKind
    # A non-string kind (DWORD, binary, ...) can never hold the JSON: replace it.
    $wrongKind = $current.present -and -not (Test-TextValue $current)
    $corrupt = $wrongKind
    try {
        if ($wrongKind) { throw 'not a string value' }
        $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText $current)
    } catch {
        $corrupt = $true
        # Corrupted after install: rebuild from the validated original so repairs continue.
        $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText $State.originals.extensionSettings)
    }
    $desired = New-ExtensionEntry $Ctx
    $id = $Ctx.Config.extensionId
    if (-not $corrupt -and (Test-ExtensionEntry $settings[$id] $desired)) { return $false }
    $settings[$id] = $desired
    $json = ConvertTo-Json -InputObject $settings -Depth 20 -Compress
    $kind = if ($current.present -and -not $wrongKind) { $current.kind } else { 'MultiString' }
    Initialize-PolicyKey $Ctx $State $key
    if ($wrongKind) { Remove-ItemProperty -LiteralPath $key -Name 'ExtensionSettings' }
    Set-RegValue -KeyPath $key -Name 'ExtensionSettings' -Kind $kind -Data $json
    $State.extensionSettingsWritten = $json
    return $true
}

function Sync-DisableSafeMode {
    param([hashtable]$Ctx, $State)
    $key = Get-FirefoxPolicyKey $Ctx
    # -AnyKind: a value switched to an unsupported kind (e.g. REG_BINARY) is simply
    # rewritten; New-ItemProperty -Force replaces the value's type as well.
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'DisableSafeMode' -AnyKind
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
    # Write-ahead: persist ownership before the entry exists. If the save only came
    # after the write and failed, the next run would find the entry and record it as
    # pre-existing, and teardown would leave lichess.org blocked.
    $State.blocklists[$Browser] = [ordered]@{ name = $name; owned = $true }
    Save-State $Ctx $State
    Set-RegValue -KeyPath $keyPath -Name $name -Kind 'String' -Data $blocked
    return $true
}

$script:SyncItems = [ordered]@{
    extensionSettings = 'Firefox ExtensionSettings'
    disableSafeMode   = 'Firefox DisableSafeMode'
    edge              = 'edge URLBlocklist'
    chrome            = 'chrome URLBlocklist'
}

function Sync-PolicyItem {
    param([hashtable]$Ctx, $State, [string]$Item)
    switch ($Item) {
        'extensionSettings' { Sync-ExtensionSettings $Ctx $State }
        'disableSafeMode' { Sync-DisableSafeMode $Ctx $State }
        default { Sync-Blocklist $Ctx $State $Item }
    }
}

# Each policy is repaired on its own, so one that fails never blocks the others.
# Repaired items are added to $Changed as they happen (the caller can still log them
# when this throws); failures are combined into one exception at the end.
function Sync-Policies {
    param([hashtable]$Ctx, $State, [System.Collections.ArrayList]$Changed = (New-Object System.Collections.ArrayList))
    $failures = @()
    foreach ($item in @($script:SyncItems.Keys)) {
        $label = $script:SyncItems[$item]
        try {
            if (Sync-PolicyItem $Ctx $State $item) { [void]$Changed.Add($label) }
        } catch {
            $failures += "$($label): $($_.Exception.Message)"
        }
    }
    if ($failures.Count -gt 0) { throw ('Repair failed for ' + ($failures -join '; ')) }
    return @($Changed)
}

#endregion

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
    $current = Get-RegValueSnapshot -KeyPath $key -Name 'ExtensionSettings' -AnyKind
    if ($current.present -and -not (Test-TextValue $current)) {
        # Switched to a non-string kind: nothing to merge, put the original back.
        Remove-ItemProperty -LiteralPath $key -Name 'ExtensionSettings'
        Restore-RegValue -KeyPath $key -Name 'ExtensionSettings' -Snapshot $original
        return
    }
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
            # Persist the originals snapshot before any policy write, so a failure
            # mid-run can never cause the guard's own values to be re-snapshotted.
            Save-State $Ctx $state
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
        $changed = New-Object System.Collections.ArrayList
        try {
            Sync-Policies $Ctx $state $changed | Out-Null
        } finally {
            # Persist and log partial sync progress (owned entries, created keys, the
            # policies that were repaired) even when another policy failed.
            try {
                Save-State $Ctx $state
            } finally {
                foreach ($item in $changed) { Write-GuardLog $Ctx "$verb $item" }
            }
        }
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

# The folder may have been pre-created by a standard user, who as owner keeps implicit
# WRITE_DAC and may have added explicit ACEs; files they pre-created keep their owner and
# ACEs through Copy-Item. So: Administrators take ownership of everything; the folder is
# reset (its explicit ACEs become inherited ones), then /inheritance:r strips all inherited
# ACEs and grants exactly the three below (/grant:r alone would keep any other explicit
# ACE); every child is reset to inherit only. No /C: with it icacls exits 0 even when
# items fail.
function Get-GuardAclArguments {
    param([string]$Path)
    @(
        , @($Path, '/setowner', '*S-1-5-32-544', '/T')
        , @($Path, '/reset')
        , @($Path, '/inheritance:r', '/grant:r', '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F', '*S-1-5-32-545:(OI)(CI)RX')
        , @("$Path\*", '/reset', '/T')
    )
}

function Get-PathOwnerSid {
    param([string]$Path)
    # .NET rather than Get-Acl, which needs Microsoft.PowerShell.Security to autoload.
    $sections = [System.Security.AccessControl.AccessControlSections]::Owner
    if ([System.IO.Directory]::Exists($Path)) {
        $security = [System.IO.Directory]::GetAccessControl($Path, $sections)
    } else {
        $security = [System.IO.File]::GetAccessControl($Path, $sections)
    }
    $security.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
}

# The path's own attributes (a link is not followed), or $null when nothing is there.
# Unlike Test-Path, this also sees a junction whose target is gone.
function Get-PathAttributes {
    param([string]$Path)
    try { return [System.IO.File]::GetAttributes($Path) }
    catch [System.IO.FileNotFoundException], [System.IO.DirectoryNotFoundException] { return $null }
}

function Test-ReparsePoint {
    param([string]$Path)
    $attributes = Get-PathAttributes $Path
    return ($null -ne $attributes -and [bool]($attributes -band [System.IO.FileAttributes]::ReparsePoint))
}

# Deletes a file or folder tree without ever following a junction or symbolic link: a
# link (at any depth) is removed as a link, so its target is never touched. A standard
# user can plant one (mklink /J needs no privilege) to make the elevated install delete
# a folder of their choosing.
function Remove-PathWithoutFollowingLinks {
    param([string]$Path)
    $attributes = [System.IO.File]::GetAttributes($Path)
    $isDirectory = [bool]($attributes -band [System.IO.FileAttributes]::Directory)
    if ($attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        if ($isDirectory) { [System.IO.Directory]::Delete($Path) } else { [System.IO.File]::Delete($Path) }
        return
    }
    if ($attributes -band [System.IO.FileAttributes]::ReadOnly) {
        [System.IO.File]::SetAttributes($Path, ($attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)))
    }
    if ($isDirectory) {
        foreach ($child in [System.IO.Directory]::GetFileSystemEntries($Path)) { Remove-PathWithoutFollowingLinks $child }
        [System.IO.Directory]::Delete($Path)
    } else {
        [System.IO.File]::Delete($Path)
    }
}

# install.ps1 calls this again right before copying files and before registering the task.
function Assert-InstallDirectoryNotLink {
    param([hashtable]$Ctx)
    $dir = $Ctx.InstallDir
    $attributes = Get-PathAttributes $dir
    if ($null -eq $attributes -or -not ($attributes -band [System.IO.FileAttributes]::Directory)) {
        throw "$dir is missing or is not a folder."
    }
    if ($attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        throw "$dir is a junction or symbolic link, not a real folder; refusing to install into it."
    }
}

# SYSTEM, Administrators, or the account running install. A standard user cannot make
# any of these the owner of a folder they create.
function Test-TrustedOwner {
    param([string]$Path)
    $trusted = @('S-1-5-18', 'S-1-5-32-544', [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value)
    return ($trusted -contains (Get-PathOwnerSid $Path))
}

# The folder is created with a protected ACL, so it is never writable by Users, not even
# before Set-GuardAcl runs. The installing account is granted too (Set-GuardAcl strips it):
# without it a non-elevated test run could not use the folder.
function New-InstallDirectorySecurity {
    $security = New-Object System.Security.AccessControl.DirectorySecurity
    $security.SetAccessRuleProtection($true, $false)
    $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    foreach ($grant in @(('S-1-5-18', 'FullControl'), ('S-1-5-32-544', 'FullControl'), ('S-1-5-32-545', 'ReadAndExecute'), ($currentSid, 'FullControl'))) {
        $identity = New-Object System.Security.Principal.SecurityIdentifier $grant[0]
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, $grant[1], 'ContainerInherit, ObjectInherit', 'None', 'Allow')
        $security.AddAccessRule($rule)
    }
    return $security
}

# Install never reuses an existing folder: a standard user may have pre-created it, added
# ACEs, or kept a write handle open on a file in it, and handles survive any ACL change.
# So the folder is deleted (a file held open without delete sharing aborts the install)
# and created again, the ACL is applied while it is empty, and nothing else may have
# appeared in it meanwhile. A junction or symbolic link at the path, or inside the folder,
# is removed as a link and never followed. On a reinstall, state.json is kept in memory
# and written back last, but only when both the folder and the file itself are owned by
# SYSTEM, Administrators or the installer (and neither is a link); if anything fails it
# is put back, or saved to TEMP when the folder is no longer safe to write to.
function Initialize-InstallDirectory {
    [CmdletBinding()]
    param([hashtable]$Ctx)
    Use-StateLock $Ctx {
        $dir = $Ctx.InstallDir
        $statePath = Get-StatePath $Ctx
        $stateBytes = $null
        $dirIsLink = Test-ReparsePoint $dir
        if (-not $dirIsLink -and (Get-PathAttributes $statePath)) {
            if (-not (Test-TrustedOwner $dir)) {
                Write-Warning "Ignoring $statePath`: $dir is not owned by SYSTEM, Administrators or you, so it is not an existing install."
            } elseif ((Test-ReparsePoint $statePath) -or -not (Test-TrustedOwner $statePath)) {
                Write-Warning "Discarding $statePath`: it is a link or is not owned by SYSTEM, Administrators or you, so it did not come from the guard."
            } else {
                $stateBytes = [System.IO.File]::ReadAllBytes($statePath)
            }
        }
        try {
            if ($dirIsLink) {
                Write-Warning "$dir is a junction or symbolic link; removing the link only (its target is not touched)."
                Remove-PathWithoutFollowingLinks $dir
            } elseif (Get-PathAttributes $dir) {
                # state.json last, so a failed delete leaves a reinstall's state where it was.
                foreach ($child in [System.IO.Directory]::GetFileSystemEntries($dir)) {
                    if ($child -ne $statePath) { Remove-PathWithoutFollowingLinks $child }
                }
                if (Get-PathAttributes $statePath) { Remove-PathWithoutFollowingLinks $statePath }
                Remove-PathWithoutFollowingLinks $dir
            }
            if (Get-PathAttributes $dir) { throw "$dir still exists after deleting it." }
            # CreateDirectory does not fail on an existing folder or junction; the link and
            # owner checks catch one that another account put there after the delete.
            $null = [System.IO.Directory]::CreateDirectory($dir, (New-InstallDirectorySecurity))
            Assert-InstallDirectoryNotLink $Ctx
            if (-not (Test-TrustedOwner $dir)) { throw "$dir was created again by another account during install." }
            Set-GuardAcl -Path $dir
            $stray = @(Get-ChildItem -LiteralPath $dir -Force | ForEach-Object Name)
            if ($stray.Count) { throw "Unexpected items appeared in $dir during install: $($stray -join ', ')." }
            if ($stateBytes) { [System.IO.File]::WriteAllBytes($statePath, $stateBytes) }
        } catch {
            $saved = ''
            if ($stateBytes -and -not (Test-Path -LiteralPath $statePath)) {
                try {
                    if ((Test-Path -LiteralPath $dir) -and -not (Test-ReparsePoint $dir) -and (Test-TrustedOwner $dir)) {
                        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
                        $saved = ' state.json was put back.'
                    }
                } catch { }
                if (-not $saved) {
                    $backup = Join-Path ([System.IO.Path]::GetTempPath()) ('ChessKeyGuard-state-{0}.json' -f (Get-Date).ToString('yyyyMMdd-HHmmss-fff'))
                    [System.IO.File]::WriteAllBytes($backup, $stateBytes)
                    $saved = " The existing state.json was saved to $backup. Copy it to $statePath before running install again, or the reinstall starts with fresh state."
                }
            }
            throw "Could not prepare $dir`: $($_.Exception.Message)$saved Close any program using files in it (or restart Windows) and run install again."
        }
    }
}

function Set-GuardAcl {
    param([string]$Path)
    foreach ($arguments in (Get-GuardAclArguments $Path)) {
        & icacls.exe @arguments | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "icacls $($arguments -join ' ') failed (exit $LASTEXITCODE)" }
    }
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
    # Status is read-only and must still report when the value is corrupt or the wrong kind.
    $extensionSettings = Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings' -AnyKind
    $settings = $null
    $corrupt = $extensionSettings.present -and -not (Test-TextValue $extensionSettings)
    if (-not $corrupt) {
        try { $settings = ConvertFrom-ExtensionSettingsText (Get-RegValueText $extensionSettings) } catch { $corrupt = $true }
    }
    $safe = Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode' -AnyKind
    $status = [ordered]@{
        Installed                = [bool]$state
        Phase                    = $null
        FirefoxVersion           = (Get-FirefoxVersion $Ctx)
        ExtensionForced          = ((-not $corrupt) -and (Test-ExtensionEntry $settings[$Ctx.Config.extensionId] (New-ExtensionEntry $Ctx)))
        ExtensionSettingsCorrupt = [bool]$corrupt
        SafeModeDisabled         = [bool]($safe.present -and $safe.kind -eq 'DWord' -and [int]$safe.data -eq 1)
        UnlockPending            = $false
        UnlockRemainingHours     = $null
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
