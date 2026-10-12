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

    It 'restores the original ExtensionSettings when it was switched to <Kind>' -TestCases @(
        @{ Kind = 'DWord'; Data = 1 }
        @{ Kind = 'Binary'; Data = [byte[]](1, 2) }
    ) {
        Set-RegValue -KeyPath $ff -Name 'ExtensionSettings' -Kind 'MultiString' -Data @($originalJson)
        $s = Initialize-Enforced $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings'
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType $Kind -Value $Data | Out-Null
        Invoke-Teardown $ctx $s
        $v = Get-Value $ff 'ExtensionSettings'
        $v.kind | Should -Be 'MultiString'
        @($v.data) | Should -Be @($originalJson)
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
    }

    It 'removes an ExtensionSettings switched to Binary when there was no original' {
        $s = Initialize-Enforced $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings'
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType Binary -Value ([byte[]](1, 2)) | Out-Null
        Invoke-Teardown $ctx $s
        (Get-Value $ff 'ExtensionSettings').present | Should -BeFalse
    }

    It 'restores DisableSafeMode 0 with its DWORD type' {
        Set-RegValue -KeyPath $ff -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        Invoke-Teardown $ctx (Initialize-Enforced $ctx)
        $v = Get-Value $ff 'DisableSafeMode'
        $v.kind | Should -Be 'DWord'
        $v.data | Should -Be 0
    }

    It 'restores DisableSafeMode 0 when it was switched to Binary' {
        Set-RegValue -KeyPath $ff -Name 'DisableSafeMode' -Kind 'DWord' -Data 0
        $s = Initialize-Enforced $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode'
        New-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode' -PropertyType Binary -Value ([byte[]](1, 0, 0, 0)) | Out-Null
        Invoke-Teardown $ctx $s
        $v = Get-Value $ff 'DisableSafeMode'
        $v.kind | Should -Be 'DWord'
        $v.data | Should -Be 0
        Test-Path -LiteralPath $ctx.InstallDir | Should -BeFalse
    }

    It 'removes a DisableSafeMode switched to Binary when there was no original' {
        $s = Initialize-Enforced $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode'
        New-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode' -PropertyType Binary -Value ([byte[]](1, 0, 0, 0)) | Out-Null
        Invoke-Teardown $ctx $s
        (Get-Value $ff 'DisableSafeMode').present | Should -BeFalse
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
