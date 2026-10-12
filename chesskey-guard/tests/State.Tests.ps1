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

    It 'round-trips non-ASCII text exactly' {
        # Built from code points so this file's own encoding cannot affect the test.
        $text = 'Caf' + [char]0x00E9 + ' ' + [char]0x2014 + ' ' + [char]0x03A9 + ' ' + [char]0x2713 + ' ' + [char]0x65E5 + [char]0x672C
        Save-State $ctx ([ordered]@{ original = $text })
        (Read-State $ctx).original | Should -BeExactly $text
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
