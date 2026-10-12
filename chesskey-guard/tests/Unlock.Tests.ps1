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
