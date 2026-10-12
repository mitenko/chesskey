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
