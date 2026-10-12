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

    It 'repairs Edge and an ExtensionSettings switched to <Kind> in one run' -TestCases @(
        @{ Kind = 'DWord'; Data = 1 }
        @{ Kind = 'Binary'; Data = [byte[]](1, 2) }
    ) {
        Invoke-GuardMain $ctx | Out-Null
        $ff = Get-FirefoxPolicyKey $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings'
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType $Kind -Value $Data | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        $es = Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings'
        $es.kind | Should -Be 'MultiString'
        (ConvertFrom-ExtensionSettingsText (Get-RegValueText $es))['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
        @((Get-LogLines $ctx) -match 'REPAIRED edge URLBlocklist$').Count | Should -Be 1
        @((Get-LogLines $ctx) -match 'REPAIRED Firefox ExtensionSettings$').Count | Should -Be 1
    }

    It 'rewrites a DisableSafeMode switched to <Kind> as DWORD 1 in one run' -TestCases @(
        @{ Kind = 'Binary'; Data = [byte[]](1, 0, 0, 0) }
        @{ Kind = 'String'; Data = '1' }
    ) {
        Invoke-GuardMain $ctx | Out-Null
        $ff = Get-FirefoxPolicyKey $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode'
        New-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode' -PropertyType $Kind -Value $Data | Out-Null
        Invoke-GuardMain $ctx | Should -Be 0
        $safe = Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode'
        $safe.kind | Should -Be 'DWord'
        $safe.data | Should -Be 1
        @((Get-LogLines $ctx) -match 'REPAIRED Firefox DisableSafeMode$').Count | Should -Be 1
        @((Get-LogLines $ctx) -match 'ERROR').Count | Should -Be 0
    }

    It 'still repairs, logs and saves the other policies when one step fails, and exits 1' {
        Invoke-GuardMain $ctx | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        Mock -ModuleName ChessKeyGuard Sync-DisableSafeMode { throw 'injected safe mode failure' }
        Invoke-GuardMain $ctx | Should -Be 1
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        (Read-State $ctx).blocklists.edge.owned | Should -BeTrue
        @((Get-LogLines $ctx) -match 'REPAIRED edge URLBlocklist$').Count | Should -Be 1
        @((Get-LogLines $ctx) -match 'ERROR .*injected safe mode failure').Count | Should -Be 1
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

Describe 'Failed runs keep state consistent' {
    BeforeEach { $ctx = New-TestContext; $ff = Get-FirefoxPolicyKey $ctx; $edge = Get-BlocklistKey $ctx 'edge' }
    AfterEach { Remove-TestContext $ctx }

    It 'keeps the original snapshot when the first run fails after a policy write' {
        Set-RegValue -KeyPath $ff -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        $global:GuardRealInit = & (Get-Module ChessKeyGuard) { Get-Command Initialize-PolicyKey }
        Mock -ModuleName ChessKeyGuard Initialize-PolicyKey { & $global:GuardRealInit @PesterBoundParameters }
        Mock -ModuleName ChessKeyGuard Initialize-PolicyKey {
            $global:GuardFailedOnce = $true
            throw 'injected sync failure'
        } -ParameterFilter { $KeyPath -like '*Edge*' -and -not $global:GuardFailedOnce }
        $global:GuardFailedOnce = $false
        try {
            Invoke-GuardMain $ctx | Should -Be 1
            Invoke-GuardMain $ctx | Should -Be 0
        } finally { Remove-Variable GuardFailedOnce, GuardRealInit -Scope Global -ErrorAction SilentlyContinue }
        $state = Read-State $ctx
        $state.originals.disableSafeMode.data | Should -Be 0
        $state.originals.extensionSettings.present | Should -BeFalse

        Request-Unlock $ctx | Out-Null
        $ctx.Test.Clock.Tick += 24 * 3600000
        Invoke-GuardMain $ctx | Should -Be 0
        (Get-RegValueSnapshot -KeyPath $ff -Name 'DisableSafeMode').data | Should -Be 0
        Test-Path -LiteralPath (Get-BlocklistKey $ctx 'edge') | Should -BeFalse
        Test-Path -LiteralPath (Get-BlocklistKey $ctx 'chrome') | Should -BeFalse
    }

    It 'keeps ownership of a new blocklist entry when the save after writing it fails' {
        Invoke-GuardMain $ctx | Out-Null
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'example.com'
        $global:GuardRealSave = & (Get-Module ChessKeyGuard) { Get-Command Save-State }
        $global:GuardRealSet = & (Get-Module ChessKeyGuard) { Get-Command Set-RegValue }
        $global:GuardEdgeWritten = $false
        $global:GuardSaveFailed = $false
        Mock -ModuleName ChessKeyGuard Set-RegValue {
            & $global:GuardRealSet @PesterBoundParameters
            if ($KeyPath -like '*Edge*') { $global:GuardEdgeWritten = $true }
        }
        Mock -ModuleName ChessKeyGuard Save-State {
            if ($global:GuardEdgeWritten -and -not $global:GuardSaveFailed) {
                $global:GuardSaveFailed = $true
                throw 'injected save failure'
            }
            & $global:GuardRealSave @PesterBoundParameters
        }
        try {
            Invoke-GuardMain $ctx | Should -Be 1
            $global:GuardSaveFailed | Should -BeTrue
            (Get-BlocklistEntries $edge)['2'] | Should -Be 'lichess.org'
            Invoke-GuardMain $ctx | Should -Be 0
            $record = (Read-State $ctx).blocklists.edge
            $record.name | Should -Be '2'
            $record.owned | Should -BeTrue

            Request-Unlock $ctx | Out-Null
            $ctx.Test.Clock.Tick += 24 * 3600000
            Invoke-GuardMain $ctx | Should -Be 0
            $entries = Get-BlocklistEntries $edge
            @($entries.Keys) | Should -Be @('1')
            $entries['1'] | Should -Be 'example.com'
        } finally {
            Remove-Variable GuardRealSave, GuardRealSet, GuardEdgeWritten, GuardSaveFailed -Scope Global -ErrorAction SilentlyContinue
        }
    }

    It 'leaves only the overwriting entry after teardown when state.json was locked during the repair' {
        Invoke-GuardMain $ctx | Out-Null
        Set-RegValue -KeyPath $edge -Name '1' -Kind 'String' -Data 'example.com'
        # A reader without delete sharing makes every Save-State fail for this run.
        $handle = [System.IO.File]::Open((Join-Path $ctx.InstallDir 'state.json'), 'Open', 'Read', 'Read')
        try { Invoke-GuardMain $ctx | Should -Be 1 } finally { $handle.Dispose() }
        Invoke-GuardMain $ctx | Should -Be 0
        $record = (Read-State $ctx).blocklists.edge
        $record.owned | Should -BeTrue
        (Get-BlocklistEntries $edge)[[string]$record.name] | Should -Be 'lichess.org'

        Request-Unlock $ctx | Out-Null
        $ctx.Test.Clock.Tick += 24 * 3600000
        Invoke-GuardMain $ctx | Should -Be 0
        $entries = Get-BlocklistEntries $edge
        @($entries.Keys) | Should -Be @('1')
        $entries['1'] | Should -Be 'example.com'
    }

    It 'records an owned blocklist entry even when a later sync step throws' {
        $global:GuardRealInit = & (Get-Module ChessKeyGuard) { Get-Command Initialize-PolicyKey }
        Mock -ModuleName ChessKeyGuard Initialize-PolicyKey { & $global:GuardRealInit @PesterBoundParameters }
        Mock -ModuleName ChessKeyGuard Initialize-PolicyKey {
            $global:GuardFailedOnce = $true
            throw 'injected sync failure'
        } -ParameterFilter { $KeyPath -like '*Chrome*' -and -not $global:GuardFailedOnce }
        $global:GuardFailedOnce = $false
        try {
            Invoke-GuardMain $ctx | Should -Be 1
            (Read-State $ctx).blocklists.edge.owned | Should -BeTrue
            Invoke-GuardMain $ctx | Should -Be 0
            (Read-State $ctx).blocklists.edge.owned | Should -BeTrue
        } finally { Remove-Variable GuardFailedOnce, GuardRealInit -Scope Global -ErrorAction SilentlyContinue }
    }
}
