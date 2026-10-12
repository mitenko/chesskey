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

    It 'refuses a pre-existing ExtensionSettings of an unsupported registry type' {
        $ff = Get-FirefoxPolicyKey $ctx
        New-RegKeyTree $ff
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType Binary -Value ([byte[]](1, 2)) | Out-Null
        { Test-InstallPreflight $ctx } | Should -Throw '*Unsupported registry type Binary*'
    }

    It 'refuses a pre-existing DisableSafeMode of an unsupported registry type' {
        $ff = Get-FirefoxPolicyKey $ctx
        New-RegKeyTree $ff
        New-ItemProperty -LiteralPath $ff -Name 'DisableSafeMode' -PropertyType Binary -Value ([byte[]](1, 0, 0, 0)) | Out-Null
        { Test-InstallPreflight $ctx } | Should -Throw '*Unsupported registry type Binary*'
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

# Set-GuardAcl itself needs elevation (icacls /setowner to Administrators), so only the
# argument lists it runs are tested here.
Describe 'Get-GuardAclArguments' {
    It 'takes ownership, resets the folder, sets its ACL, then resets the children to inherit' {
        $commands = @(Get-GuardAclArguments 'C:\X\ChessKeyGuard')
        $commands.Count | Should -Be 4
        ($commands[0] -join ' ') | Should -Be 'C:\X\ChessKeyGuard /setowner *S-1-5-32-544 /T'
        ($commands[1] -join ' ') | Should -Be 'C:\X\ChessKeyGuard /reset'
        ($commands[2] -join ' ') | Should -Be 'C:\X\ChessKeyGuard /inheritance:r /grant:r *S-1-5-18:(OI)(CI)F *S-1-5-32-544:(OI)(CI)F *S-1-5-32-545:(OI)(CI)RX'
        ($commands[3] -join ' ') | Should -Be 'C:\X\ChessKeyGuard\* /reset /T'
    }

    It 'never uses /C, which makes icacls exit 0 even when items fail' {
        foreach ($c in @(Get-GuardAclArguments 'C:\X\ChessKeyGuard')) { $c | Should -Not -Contain '/C' }
    }
}

# Set-GuardAcl is mocked (it needs elevation); the mock records what the folder held
# when the ACL was applied, so the tests can check it ran on an empty, fresh folder.
Describe 'Initialize-InstallDirectory' {
    BeforeEach {
        $ctx = New-TestContext
        $dir = $ctx.InstallDir
        $statePath = Join-Path $dir 'state.json'
        $stateBytes = (New-Object System.Text.UTF8Encoding $false).GetBytes('{"phase":"active","note":"caf' + [char]0xE9 + '"}')
        $aclLog = New-Object System.Collections.ArrayList
        Mock -ModuleName ChessKeyGuard Set-GuardAcl {
            $null = $aclLog.Add([pscustomobject]@{ Path = $Path; Items = @(Get-ChildItem -LiteralPath $Path -Force).Count })
        }
        $foreignSid = 'S-1-5-21-1111111111-2222222222-3333333333-1001'
        $mySid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        $handles = New-Object System.Collections.ArrayList
        $links = New-Object System.Collections.ArrayList
        # A folder of decoy files that a junction may point at; it must survive untouched.
        $decoy = Join-Path $ctx.Test.TempDir 'decoy'
        $null = New-Item -ItemType Directory -Path "$decoy\sub"
        Set-Content -LiteralPath "$decoy\precious.txt" -Value 'keep'
        Set-Content -LiteralPath "$decoy\sub\more.txt" -Value 'keep'
        [System.IO.File]::WriteAllBytes("$decoy\state.json", $stateBytes)
        function New-TestJunction([string]$Link) {
            $null = New-Item -ItemType Junction -Path $Link -Value $decoy
            $null = $links.Add($Link)
        }
        function Get-DecoyCount { @(Get-ChildItem -LiteralPath $decoy -Recurse -Force).Count }
        function Test-IsLink([string]$p) { [bool]([System.IO.File]::GetAttributes($p) -band [System.IO.FileAttributes]::ReparsePoint) }
    }
    AfterEach {
        foreach ($h in $handles) { $h.Dispose() }
        # Remove junctions as links first, so cleanup never recurses into their targets.
        foreach ($l in $links) { if (Test-Path -LiteralPath $l) { [System.IO.Directory]::Delete($l) } }
        Remove-TestContext $ctx
    }

    It 'creates a missing folder and applies the ACL to it' {
        Remove-Item -LiteralPath $dir -Recurse -Force
        Initialize-InstallDirectory $ctx
        Test-Path -LiteralPath $dir -PathType Container | Should -BeTrue
        $aclLog.Count | Should -Be 1
        $aclLog[0].Path | Should -Be $dir
    }

    It 'recreates a pre-created folder empty, applying the ACL before anything is in it' {
        Set-Content -LiteralPath (Join-Path $dir 'guard.ps1') -Value 'planted'
        $null = New-Item -ItemType Directory -Path (Join-Path $dir 'sub')
        Initialize-InstallDirectory $ctx
        @(Get-ChildItem -LiteralPath $dir -Force).Count | Should -Be 0
        $aclLog.Count | Should -Be 1
        $aclLog[0].Items | Should -Be 0
    }

    It 'keeps state.json byte for byte on reinstall, drops everything else, and writes it after the ACL' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        Set-Content -LiteralPath (Join-Path $dir 'stray.txt') -Value 'planted'
        Initialize-InstallDirectory $ctx
        @(Get-ChildItem -LiteralPath $dir -Force | ForEach-Object Name) | Should -Be @('state.json')
        [System.IO.File]::ReadAllBytes($statePath) | Should -Be $stateBytes
        $aclLog.Count | Should -Be 1
        $aclLog[0].Items | Should -Be 0
    }

    It 'leaves a handle held open on an old file pointing at nothing in the new folder' {
        $planted = Join-Path $dir 'guard.ps1'
        Set-Content -LiteralPath $planted -Value 'planted'
        $share = [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete
        $h = [System.IO.File]::Open($planted, 'Open', 'ReadWrite', $share)
        $null = $handles.Add($h)
        Initialize-InstallDirectory $ctx
        $bytes = [System.Text.Encoding]::ASCII.GetBytes('evil')
        $h.Write($bytes, 0, $bytes.Length)
        $h.Flush()
        Test-Path -LiteralPath $planted | Should -BeFalse
        @(Get-ChildItem -LiteralPath $dir -Force).Count | Should -Be 0
    }

    It 'aborts, applying no ACL and keeping state.json, when a file cannot be deleted' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        $locked = Join-Path $dir 'locked.txt'
        Set-Content -LiteralPath $locked -Value 'planted'
        $null = $handles.Add([System.IO.File]::Open($locked, 'Open', 'Read', 'Read'))
        { Initialize-InstallDirectory $ctx } | Should -Throw "*Could not prepare $dir*run install again*"
        $aclLog.Count | Should -Be 0
        [System.IO.File]::ReadAllBytes($statePath) | Should -Be $stateBytes
    }

    It 'ignores state.json in a folder owned by another account' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        $calls = @{ N = 0 }
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $mySid }
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $calls.N++; if ($calls.N -eq 1) { $foreignSid } else { 'S-1-5-32-544' } } -ParameterFilter { $Path -eq $dir }
        Initialize-InstallDirectory $ctx -WarningAction SilentlyContinue
        @(Get-ChildItem -LiteralPath $dir -Force).Count | Should -Be 0
        $aclLog.Count | Should -Be 1
    }

    It 'aborts before the ACL when the recreated folder belongs to another account' {
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $foreignSid }
        { Initialize-InstallDirectory $ctx } | Should -Throw '*another account*'
        $aclLog.Count | Should -Be 0
    }

    It 'aborts when files appear while the ACL is applied, putting state.json back' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        Mock -ModuleName ChessKeyGuard Set-GuardAcl { Set-Content -LiteralPath (Join-Path $Path 'raced.txt') -Value 'x' }
        { Initialize-InstallDirectory $ctx } | Should -Throw '*raced.txt*'
        [System.IO.File]::ReadAllBytes($statePath) | Should -Be $stateBytes
    }

    It 'saves state.json to TEMP when it cannot be put back in the folder' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        $calls = @{ N = 0 }
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $mySid }
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $calls.N++; if ($calls.N -eq 1) { 'S-1-5-32-544' } else { $foreignSid } } -ParameterFilter { $Path -eq $dir }
        $err = $null
        try { Initialize-InstallDirectory $ctx } catch { $err = $_.Exception.Message }
        $backup = $null
        if ($err -match 'saved to (\S+\.json)') { $backup = $Matches[1] }
        try {
            $err | Should -BeLike '*another account*'
            $backup | Should -Not -BeNullOrEmpty
            $err | Should -BeLike "*Copy it to $statePath before running install again*"
            [System.IO.File]::ReadAllBytes($backup) | Should -Be $stateBytes
        } finally { if ($backup) { Remove-Item -LiteralPath $backup -Force -ErrorAction SilentlyContinue } }
        Test-Path -LiteralPath $statePath | Should -BeFalse
    }

    It 'removes a junction at the install path without touching its target, and creates a real folder' {
        Remove-Item -LiteralPath $dir -Recurse -Force
        New-TestJunction $dir
        $before = Get-DecoyCount
        Initialize-InstallDirectory $ctx -WarningAction SilentlyContinue
        Get-DecoyCount | Should -Be $before
        Test-IsLink $dir | Should -BeFalse
        @(Get-ChildItem -LiteralPath $dir -Force).Count | Should -Be 0
        $aclLog.Count | Should -Be 1
    }

    It 'never keeps a state.json reached through a junction at the install path' {
        Remove-Item -LiteralPath $dir -Recurse -Force
        New-TestJunction $dir
        Initialize-InstallDirectory $ctx -WarningAction SilentlyContinue
        Test-Path -LiteralPath $statePath | Should -BeFalse
        [System.IO.File]::ReadAllBytes("$decoy\state.json") | Should -Be $stateBytes
    }

    It 'removes junctions inside the folder (also one named state.json) as links only' {
        New-TestJunction (Join-Path $dir 'link')
        New-TestJunction $statePath
        $before = Get-DecoyCount
        Initialize-InstallDirectory $ctx -WarningAction SilentlyContinue
        Get-DecoyCount | Should -Be $before
        @(Get-ChildItem -LiteralPath $dir -Force).Count | Should -Be 0
    }

    It 'aborts before the ACL when a junction is at the install path at create time' {
        # The security object is built just before CreateDirectory: plant the junction there.
        Mock -ModuleName ChessKeyGuard New-InstallDirectorySecurity {
            $null = New-Item -ItemType Junction -Path $dir -Value $decoy
            , (New-Object System.Security.AccessControl.DirectorySecurity)
        }
        $null = $links.Add($dir)
        $before = Get-DecoyCount
        { Initialize-InstallDirectory $ctx } | Should -Throw '*junction or symbolic link*'
        $aclLog.Count | Should -Be 0
        Get-DecoyCount | Should -Be $before
    }

    It 'discards a state.json whose own owner is not trusted, in a trusted folder' {
        [System.IO.File]::WriteAllBytes($statePath, $stateBytes)
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $mySid }
        Mock -ModuleName ChessKeyGuard Get-PathOwnerSid { $foreignSid } -ParameterFilter { $Path -eq $statePath }
        $warnings = $null
        Initialize-InstallDirectory $ctx -WarningVariable warnings -WarningAction SilentlyContinue
        Test-Path -LiteralPath $statePath | Should -BeFalse
        ($warnings -join ' ') | Should -BeLike '*Discarding*state.json*'
        $aclLog.Count | Should -Be 1
    }
}

Describe 'Assert-InstallDirectoryNotLink' {
    BeforeEach { $ctx = New-TestContext }
    AfterEach {
        $d = $ctx.InstallDir
        if ((Test-Path -LiteralPath $d) -and ([System.IO.File]::GetAttributes($d) -band [System.IO.FileAttributes]::ReparsePoint)) {
            [System.IO.Directory]::Delete($d)
        }
        Remove-TestContext $ctx
    }

    It 'passes for a real folder' {
        { Assert-InstallDirectoryNotLink $ctx } | Should -Not -Throw
    }

    It 'refuses a junction at the install path' {
        $target = Join-Path $ctx.Test.TempDir 'target'
        $null = New-Item -ItemType Directory -Path $target
        Remove-Item -LiteralPath $ctx.InstallDir -Recurse -Force
        $null = New-Item -ItemType Junction -Path $ctx.InstallDir -Value $target
        { Assert-InstallDirectoryNotLink $ctx } | Should -Throw '*junction or symbolic link*'
    }

    It 'refuses a missing folder' {
        Remove-Item -LiteralPath $ctx.InstallDir -Recurse -Force
        { Assert-InstallDirectoryNotLink $ctx } | Should -Throw '*missing*'
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

    It 'reports a corrupt ExtensionSettings (<Kind>) instead of throwing' -TestCases @(
        @{ Kind = 'String'; Data = '{broken' }
        @{ Kind = 'DWord'; Data = 1 }
        @{ Kind = 'Binary'; Data = [byte[]](1, 2) }
    ) {
        Invoke-GuardMain $ctx | Out-Null
        $ff = Get-FirefoxPolicyKey $ctx
        Remove-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings'
        New-ItemProperty -LiteralPath $ff -Name 'ExtensionSettings' -PropertyType $Kind -Value $Data | Out-Null
        $s = Get-GuardStatus $ctx
        $s.ExtensionForced | Should -BeFalse
        $s.ExtensionSettingsCorrupt | Should -BeTrue
        $s.edgeBlocked | Should -BeTrue
    }

    It 'reports enforcement and remaining unlock time' {
        Invoke-GuardMain $ctx | Out-Null
        Request-Unlock $ctx | Out-Null
        $s = Get-GuardStatus $ctx
        $s.Installed | Should -BeTrue
        $s.Phase | Should -Be 'active'
        $s.ExtensionForced | Should -BeTrue
        $s.ExtensionSettingsCorrupt | Should -BeFalse
        $s.SafeModeDisabled | Should -BeTrue
        $s.edgeBlocked | Should -BeTrue
        $s.chromeBlocked | Should -BeTrue
        $s.UnlockPending | Should -BeTrue
        $s.UnlockRemainingHours | Should -Be 24
    }
}
