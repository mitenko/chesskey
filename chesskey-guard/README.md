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

The countdown counts only uptime, and sleep counts as uptime. Restarts pause the countdown; with
Fast Startup (Windows default), Shut down counts like sleep. When it
matures, the guard puts back any browser policies that existed before it was installed, then
deletes `C:\ProgramData\ChessKeyGuard` and its scheduled task. It leaves
`C:\ProgramData\ChessKeyGuard-unlocked.log` as a record.

## Tests

```
powershell.exe -NoProfile -Command "Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -Force -SkipPublisherCheck"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File chesskey-guard\run-tests.ps1
```
