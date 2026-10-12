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

Describe 'Sync step isolation' {
    BeforeEach { $ctx = New-TestContext; $edge = Get-BlocklistKey $ctx 'edge' }
    AfterEach { Remove-TestContext $ctx }

    It 'repairs the other policies when one step throws, then reports the failure' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        Remove-Item -LiteralPath (Get-BlocklistKey $ctx 'chrome') -Recurse
        Mock -ModuleName ChessKeyGuard Sync-DisableSafeMode { throw 'injected safe mode failure' }
        $changed = New-Object System.Collections.ArrayList
        { Sync-Policies $ctx $state $changed } | Should -Throw '*Firefox DisableSafeMode*injected safe mode failure*'
        @($changed) | Should -Be @('edge URLBlocklist', 'chrome URLBlocklist')
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        (Get-BlocklistEntries (Get-BlocklistKey $ctx 'chrome'))['1'] | Should -Be 'lichess.org'
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

Describe 'Tampered ExtensionSettings' {
    BeforeEach { $ctx = New-TestContext; $edge = Get-BlocklistKey $ctx 'edge' }
    AfterEach { Remove-TestContext $ctx }

    It 'repairs a corrupt value from the original snapshot' {
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"*":{"installation_mode":"allowed"}}'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{broken'
        @(Sync-Policies $ctx $state) | Should -Contain 'Firefox ExtensionSettings'
        $settings = Get-ExtensionSettings $ctx
        $settings['*'].installation_mode | Should -Be 'allowed'
        $settings['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }

    It 'still repairs other policies in the same pass' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{broken'
        Remove-Item -LiteralPath $edge -Recurse
        $changed = @(Sync-Policies $ctx $state)
        $changed | Should -Contain 'Firefox ExtensionSettings'
        $changed | Should -Contain 'edge URLBlocklist'
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
    }

    It 'rewrites a corrupt value even when the original already had the ChessKey entry' {
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"altersonic@yahoo.com":{"installation_mode":"force_installed","install_url":"https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi","private_browsing":true}}'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{broken'
        @(Sync-Policies $ctx $state) | Should -Contain 'Firefox ExtensionSettings'
        (Get-ExtensionSettings $ctx)['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }

    It 'rebuilds a corrupt value when there was no original value' {
        $state = New-GuardState $ctx
        $state.originals.extensionSettings.present | Should -BeFalse
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{broken'
        @(Sync-Policies $ctx $state) | Should -Contain 'Firefox ExtensionSettings'
        (Get-ExtensionSettings $ctx)['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }

    It 'rewrites a value switched to <Kind> as MultiString and still repairs Edge' -TestCases @(
        @{ Kind = 'DWord'; Data = 1 }
        @{ Kind = 'Binary'; Data = [byte[]](1, 2) }
    ) {
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"*":{"installation_mode":"allowed"}}'
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        $ff = Get-FirefoxPolicyKey $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings'
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType $Kind -Value $Data | Out-Null
        Remove-Item -LiteralPath $edge -Recurse
        $changed = @(Sync-Policies $ctx $state)
        $changed | Should -Contain 'Firefox ExtensionSettings'
        $changed | Should -Contain 'edge URLBlocklist'
        (Get-BlocklistEntries $edge)['1'] | Should -Be 'lichess.org'
        (Get-RegValueSnapshot -KeyPath $ff -Name 'ExtensionSettings').kind | Should -Be 'MultiString'
        $settings = Get-ExtensionSettings $ctx
        $settings['*'].installation_mode | Should -Be 'allowed'
        $settings['altersonic@yahoo.com'].installation_mode | Should -Be 'force_installed'
    }

    It 'repairs private_browsing given as a string' {
        $state = New-GuardState $ctx
        Sync-Policies $ctx $state | Out-Null
        Set-ExtensionSettingsRaw $ctx 'MultiString' '{"altersonic@yahoo.com":{"installation_mode":"force_installed","install_url":"https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi","private_browsing":"true"}}'
        @(Sync-Policies $ctx $state) | Should -Be @('Firefox ExtensionSettings')
        (Get-ExtensionSettings $ctx)['altersonic@yahoo.com'].private_browsing | Should -BeTrue
        (Get-ExtensionSettings $ctx)['altersonic@yahoo.com'].private_browsing | Should -BeOfType [bool]
    }
}
