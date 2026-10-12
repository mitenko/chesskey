# ChessKey Guard — Design

Date: 2026-10-09
Status: Draft, awaiting review

## Problem

ChessKey gates lichess games behind puzzle streak goals, but only while the
extension is enabled. Disabling it in Firefox takes one click, and Edge (built
into Windows) has no ChessKey at all. In practice the gate gets bypassed on
impulse to play blitz.

## Goal

Make bypassing ChessKey a deliberate, next-day decision instead of a one-click
impulse — without locking the owner out of their own PC permanently.

Success looks like:

- In Firefox, ChessKey cannot be disabled or removed from `about:addons`, and
  does not disappear in private windows or Troubleshoot Mode.
- In Edge and Chrome, lichess.org does not load at all.
- Deleting the policies by hand gets them put back within about a minute.
- The only supported off-switch is a request that takes effect after a
  cooling-off delay (default 24h of machine uptime). After that, everything removes itself cleanly.

## Non-goals

- **Security against a determined admin.** The owner is an administrator and can
  always disable a scheduled task or boot into safe mode. This is friction, not
  security.
- Network-level filtering or per-minute time quotas. ChessKey's own unlock
  window stays the only game-time limit.
- Other browsers (Brave, Opera, Waterfox, portable Firefox builds) and the
  lichess mobile apps.
- Changes to the ChessKey extension itself.

## Prerequisite

Firefox force-installs only signed add-ons. ChessKey is public on AMO
(id `altersonic@yahoo.com`, slug `chesskey`), but AMO has **2.0.2** and the repo is at
**2.1.1**. Publish 2.1.1 to AMO so the forced install includes the recent
fixes. The guard always installs the AMO `latest` URL, so it does not need
changing after that.

## Approach

A PowerShell reconcile script runs as SYSTEM from a Windows scheduled task. It
is triggered at boot and every minute. Each run converges the machine to the
desired state: policies present, or (once an unlock has matured) everything
removed.

Alternatives considered: a C# .NET worker service (proper `services.msc` entry,
but needs a toolchain and more code for the same loop) and a Node service via
`node-windows` (needs a Node runtime plus a third-party wrapper; most fragile).
Both were rejected because the logic is a small registry reconcile, which is
native PowerShell work.

## Components

All in a new `chesskey-guard/` folder in this repo.

| File | Purpose |
|---|---|
| `guard.ps1` | Reconcile script. Run by the scheduled task. |
| `install.ps1` | One-time elevated install: copies files, sets ACLs, registers task, runs first reconcile. |
| `request-unlock.ps1` | Starts the cooling-off countdown. |
| `cancel-unlock.ps1` | Cancels a pending unlock request. |
| `status.ps1` | Prints the current state: policies applied, unlock pending, time remaining. |
| `config.json` | `unlockDelayHours` (default 24), extension id, install URL, blocked hosts. |
| `tests/guard.Tests.ps1` | Pester tests. |

Install location: `C:\ProgramData\ChessKeyGuard\`. ACLs: SYSTEM and Administrators
get full control, Users get read only. Owner-editable state (the unlock request) sits
here too, so changing it needs elevation.

Scheduled task: `\ChessKeyGuard`, runs as `SYSTEM`, highest privileges. Triggers
are at startup and every 1 minute indefinitely. If the task is already running,
a new instance is not started. The task action does not call `guard.ps1` directly.
It runs a short inline command:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command
  "if (Test-Path 'C:\ProgramData\ChessKeyGuard\guard.ps1') { & 'C:\ProgramData\ChessKeyGuard\guard.ps1' }
   else { Unregister-ScheduledTask -TaskName ChessKeyGuard -Confirm:$false }"
```

With this, a task left behind after its files are gone removes itself on the next
run. That covers the last teardown step (see *Teardown*).

### State file safety

`state.json` is changed by `guard.ps1`, `request-unlock.ps1` and
`cancel-unlock.ps1`. The scheduled task's single-instance setting doesn't
coordinate those three, so:

- **Lock.** Every script that modifies state holds the named mutex
  `Global\ChessKeyGuardState` across its whole read-modify-write. `guard.ps1` holds
  it for the entire run. The commands wait up to 30s for it, then fail with a
  clear message. `status.ps1` only reads, so it takes no lock.
- **Atomic save.** State is written to `state.json.tmp`, flushed, then swapped in
  with `[IO.File]::Replace` (or `Move` when no `state.json` exists yet). An
  interrupted write leaves the previous `state.json` intact. A leftover `.tmp` is
  ignored and overwritten on the next save.
- **Unreadable state.** If `state.json` exists but can't be parsed, `guard.ps1`
  logs an error and exits 1 **without changing policy**. It doesn't re-snapshot, so
  it can never record the guard's own values as "originals". It keeps enforcing on
  the next run once the file is fixed. `install.ps1` also stops if it finds an
  unreadable state file.

## Policies applied

All are machine-wide under `HKLM\SOFTWARE\Policies`, so they apply to every user and
survive browser updates (unlike `policies.json` in the install directory).

**Firefox** (`HKLM\SOFTWARE\Policies\Mozilla\Firefox`):

- `ExtensionSettings` (REG_MULTI_SZ, JSON):
  ```json
  {
    "altersonic@yahoo.com": {
      "installation_mode": "force_installed",
      "install_url": "https://addons.mozilla.org/firefox/downloads/latest/chesskey/latest.xpi",
      "private_browsing": true
    }
  }
  ```
  `force_installed` removes the Disable/Remove buttons. `private_browsing` keeps it
  active in private windows.
- `DisableSafeMode` = 1. Troubleshoot Mode would otherwise turn off all extensions.

**Edge** (`HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist`) and **Chrome**
(`HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist`):

- Value `1` = `lichess.org`, which blocks the domain and its subdomains. Chrome's key is
  written even if Chrome is not installed (harmless, and it covers a later install).

### Policy ownership and pre-existing values

The guard must leave pre-existing policy exactly as it found it. On the
**first run** (no `state.json` yet), before writing anything, it snapshots
`originals` into `state.json`. For each value it will touch, that records
presence or absence, the registry type, and the raw data. Teardown restores
from this snapshot. It never just deletes.

| Value | How the guard writes it | How teardown restores it |
|---|---|---|
| Firefox `ExtensionSettings` | **Merge:** parse the existing JSON (if any) and set only the `altersonic@yahoo.com` key. All other keys, including `*`, are kept. If the existing value cannot be parsed as JSON, install aborts (conflict) without changing anything. | Remove only the `altersonic@yahoo.com` key from the current JSON. If the snapshot had that key, put the original entry back. If the result is `{}` and the snapshot was absent, delete the value. |
| Firefox `DisableSafeMode` | Set to DWORD 1. | Restore the snapshot: the original type and data, or delete if it was absent. |
| Edge/Chrome `URLBlocklist` entry | If any existing entry already equals `lichess.org`, reuse it and record `ownsBlocklistEntry=false`. Otherwise write to the **lowest unused numeric name** and record that name in `state.json`. | Delete only the recorded name, and only if `ownsBlocklistEntry=true`. Remove the `URLBlocklist` key only if the guard created it and it is now empty. |

Reconcile repairs only the guard's own entries. For example, if a merged
`ExtensionSettings` loses the ChessKey key, the key is re-merged; other keys are never
reset.

**Blocklist repair.** Each run checks that the recorded entry (owned or reused)
still exists and equals `lichess.org`. If it does not (it was deleted, or its name
now holds a different URL), the guard:

1. reuses any other existing entry equal to `lichess.org`, keeping
   `ownsBlocklistEntry=false`. Otherwise it
2. writes `lichess.org` to the lowest unused numeric name and sets
   `ownsBlocklistEntry=true`.

Either way it records the new name and logs `REPAIRED`. A deleted reused entry
therefore becomes an owned entry, which teardown later removes. That is correct,
because the original was already gone.

### Minimum Firefox version

`private_browsing` in `ExtensionSettings` requires **Firefox 136+ or ESR 128.8+**.
`install.ps1` reads the installed version from
`HKLM\SOFTWARE\Mozilla\Mozilla Firefox\CurrentVersion`. It **refuses to install**
below the minimum and asks the user to update Firefox first. Firefox auto-updates
and is not expected to downgrade, so `guard.ps1` re-checks each run. If it ever
sees an older version, it logs `CHESSKEY-GUARD WARN firefox-version <v>` and keeps
enforcing the rest. There is no fallback policy.

## Reconcile logic (`guard.ps1`)

Each run:

1. Take the `Global\ChessKeyGuardState` mutex. Load `config.json` and `state.json`
   (`state.json` is created, with the `originals` snapshot, only if it is missing
   and no teardown marker exists).
2. **Unlock accounting (monotonic, same boot only).** The wall clock is never used
   to measure progress. Each run reads:
   - `bootId`: a GUID stored in a **volatile** registry key
     (`HKLM\SOFTWARE\ChessKeyGuard\Volatile`, created with
     `RegistryOptions.Volatile`). Windows discards it at reboot, so a fresh GUID
     means a new boot session.
   - `tick`: `[Environment]::TickCount64`, in milliseconds since boot. It is monotonic
     and unaffected by clock changes.

   The accounting baseline (`unlockBaseBootId`, `unlockBaseTick`) exists **only
   while an unlock is pending**. `request-unlock.ps1` sets it to the current
   bootId and tick at the moment of the request, so time before the request is
   never counted. `cancel-unlock.ps1` and teardown clear it. Runs with no pending
   unlock never read or write it.

   When an unlock is pending:
   - if `bootId == unlockBaseBootId` **and** `tick > unlockBaseTick`, it adds
     `tick - unlockBaseTick` to `state.unlockElapsedMs`;
   - in every other case (a new boot session, or a non-increasing tick), it credits
     **zero**;
   - either way, it then resets the baseline to the current bootId and tick.

   As a result, clock jumps have no effect, and downtime and reboots credit
   nothing. Rapid reboots only lose time, so the countdown is never shorter than
   24h of real uptime. A restart pauses the countdown, it doesn't advance it. Time
   spent in sleep does count (TickCount64 includes it). That is real elapsed time
   and can't be faked.
3. **If teardown is under way, or `unlockElapsedMs >= unlockDelayHours * 3600000`**,
   run *Teardown* (below) and exit. Teardown is under way when `state.phase ==
   "teardown"` **or** the marker file `C:\ProgramData\ChessKeyGuard-unlocked.log`
   exists. The marker covers the case where `state.json` has already been
   deleted.
4. Otherwise, **ensure** each owned policy value equals its desired value. Write only
   when it differs. Log each repair as `CHESSKEY-GUARD REPAIRED <path>`, which
   records tampering.
5. Save state atomically, release the mutex, and exit 0. Any exception is logged with
   `CHESSKEY-GUARD ERROR <message>` and exits 1. The next minute's run retries.

The registry root (`HKLM:\SOFTWARE\Policies`) and the install directory are
parameters with production defaults. Tests point them at a scratch `HKCU:` key and
a temp directory.

### Teardown

Teardown is a sequence of idempotent steps. The scheduled task stays registered
until every earlier step has succeeded, so any failure is retried on the next
minute's run. Each step skips work that is already done.

1. **Enter teardown.** Set `state.phase = "teardown"` (atomic save). From then on,
   runs never re-apply policy. They only continue teardown.
2. **Restore policies** from `originals`, one value at a time. After each value,
   record `restored.<value> = true` in state, so a retry skips completed values.
   Delete the volatile key.
3. **Write the marker.** Append `CHESSKEY-GUARD UNLOCKED` to
   `C:\ProgramData\ChessKeyGuard-unlocked.log`, unless the marker already exists.
   This happens only after every restore has succeeded. Later runs use the marker to
   recognise teardown even if `state.json` is gone, and no policy work is left by
   then.
4. **Delete the install directory**, removing `guard.ps1` last. If this fails
   partway, the task is still registered. Next run:
   - if `guard.ps1` still exists, the marker routes it straight back to this step;
   - if only `guard.ps1` is gone, the task's action unregisters the task.
5. **Unregister the task.** If this fails, the next run's action finds no
   `guard.ps1` and unregisters the task, retrying every minute until it succeeds.

The marker log stays behind as a deliberate record. `install.ps1` renames an
existing marker to `ChessKeyGuard-unlocked.<yyyyMMdd-HHmmss>.log` before
installing, so a later reinstall isn't mistaken for a teardown in progress.

## Unlock flow

- `request-unlock.ps1` (elevated, holding the state lock) sets
  `unlockRequestedAt = now` (shown to the user only, never used for timing) and
  `unlockElapsedMs = 0`. It also sets the accounting baseline to the current bootId
  and tick. Repeat requests change nothing while an unlock is pending. It prints the
  remaining uptime needed, not a clock time, because restarts pause the
  countdown.
- Restarts pause the countdown; with Fast Startup (the Windows default), Shut down
  hibernates the kernel, so the volatile bootId survives and TickCount64 includes
  the powered-off time: Shut down counts like sleep.
- `cancel-unlock.ps1` (holding the state lock) clears the request, the elapsed
  time and the baseline. It refuses once `phase == "teardown"`, since teardown
  can't be cancelled after it starts.
- `status.ps1` shows remaining uptime.
- While an unlock is pending, policies stay fully enforced until the moment of
  teardown.

## Logging

`C:\ProgramData\ChessKeyGuard\guard.log`. Every line is prefixed with an ISO
timestamp and `CHESSKEY-GUARD`. When it passes 1 MB, it is rotated to `guard.log.1`.
Normal "no change" runs log nothing, so the log only shows events.

## Install

`install.ps1` (must run elevated):

1. Copy the scripts and `config.json` to `C:\ProgramData\ChessKeyGuard\`.
2. Apply the ACLs.
3. Register the scheduled task.
4. Run `guard.ps1` once, synchronously, and print `status.ps1` output.
5. Tell the user to restart Firefox and check `about:policies` and `about:addons`.

There is deliberately no `uninstall.ps1`. The unlock request is the uninstall.

## Testing

**Pester (automated)**, against a scratch registry root and temp directory:

- fresh state → all owned values written, `originals` snapshot recorded;
- a tampered value (deleted or changed) → repaired and logged;
- an unrelated sibling policy value → left untouched;
- an existing `ExtensionSettings` with other extensions and `*` → merged, the
  others are preserved; teardown restores the original JSON byte-for-byte;
- `ExtensionSettings` that can't be parsed → install aborts, the registry is unchanged;
- an existing `DisableSafeMode` = 0 (DWORD) → set to 1, teardown restores 0 with
  the original type;
- an existing `URLBlocklist` with `1` = `example.com` → lichess written to `2`;
  teardown removes only `2`, and `1` survives;
- an existing `URLBlocklist` entry already `lichess.org` → reused, and teardown leaves
  it in place;
- an unlock request → still enforced before the delay;
- the clock jumps forward 48h between two runs (same bootId, small tick delta) →
  only the tick delta is credited;
- **rapid restart:** 100 runs, each with a new bootId → zero credited;
- a non-increasing tick with the same bootId → zero credited;
- **request between runs:** the last run is at tick T, the request at T+50s, the
  next run at T+60s → only 10s is credited;
- runs with no pending unlock → the baseline is never written;
- a reused `lichess.org` entry is deleted while active → the next run writes it to
  an unused name with `ownsBlocklistEntry=true`, and teardown removes it;
- a reused entry is overwritten with another URL → that URL is kept, and lichess
  goes to a new name;
- **overlapping updates:** while a test holds the state mutex (simulating a
  guard run), `request-unlock.ps1` waits and the request survives the guard's
  save. With the mutex held past the timeout, the command fails cleanly and
  the state is unchanged;
- **interrupted write:** a truncated `state.json.tmp` next to a valid
  `state.json` → the guard loads the valid one and runs normally;
- an unreadable `state.json` → exit code 1, no registry changes, no re-snapshot;
- elapsed time ≥ the delay → originals restored, full teardown sequence run;
- **teardown failure injection:** for each step 2–5, make it throw once
  (mocked), then run again → teardown completes, and no step's work is repeated
  incorrectly (e.g. a restored value isn't restored twice from stale
  originals);
- the marker exists and `state.json` is gone → the run goes straight to directory
  deletion;
- `guard.ps1` is gone and the task is still registered → the task action
  unregisters the task (tested by invoking the action command with a mocked
  `Unregister-ScheduledTask`);
- cancel during teardown → refused;
- Firefox version below 136 (and ESR below 128.8) → install refuses; 136 and 128.8 pass;
- cancel → elapsed time cleared, enforcement continues;
- invalid `config.json` → exit code 1 and an error line in the log.

The bootId and tick sources, the registry root and the install directory are
injectable, so tests don't depend on real reboots or the real clock.

**Manual (on the real machine)**, after install:

- `install.ps1` prints the detected Firefox version and refuses below the
  minimum (check by faking `CurrentVersion` under the test root);
- reboot with an unlock pending → `status.ps1` shows no progress credited across
  the reboot;

- Firefox `about:policies` shows ExtensionSettings and DisableSafeMode as Active;
- `about:addons` shows ChessKey with no Disable/Remove option, including in a
  private window;
- Edge: lichess.org shows the "blocked by your organization" page;
- delete the Edge `URLBlocklist` key → it's back within about 60s, and a `REPAIRED` line
  appears in the log;
- set `unlockDelayHours` to 0.05 temporarily, request an unlock → within a few
  minutes the policies, the task and the folder are all gone.

## Review findings (2026-10-10) — resolved

All three are addressed above: (1) *Policy ownership and pre-existing values*;
(2) *Reconcile logic* step 2 (monotonic, same-boot-only accounting) plus the
rapid-restart test; (3) *Minimum Firefox version*. Original findings kept for
reference:

1. **[High] Preserve pre-existing browser policies.** The guard writes a whole
   Firefox `ExtensionSettings` value and a fixed `URLBlocklist` value named
   `1`, then removes those values during teardown. If either is already in use,
   this overwrites existing extension settings or a blocked-URL entry; teardown
   then deletes the prior policy. `DisableSafeMode` can likewise overwrite and
   later remove an existing setting. This conflicts with the promise to leave
   other policies untouched. Merge and restore the original values (including
   the prior absence/presence and registry type), or detect conflicts and stop
   before changing machine policy; for numbered URL blocklist entries, select
   an unused name and track it explicitly.

2. **[Medium] The unlock delay can be accelerated by repeated boots.** The
   five-minute cap is applied per reconciliation, not per unit of elapsed
   runtime. Each startup-triggered run can therefore add five minutes even if
   the previous run was seconds ago (or the machine was powered off in between).
   Repeating startup can mature a 24-hour request much sooner than 24 hours.
   The clock-jump test does not cover this. Track elapsed time in a way that
   grants no more than the measured interval and does not credit downtime or
   repeated startup invocations; add a rapid-restart test.

3. **[Medium] Define the minimum supported Firefox version.** The
   `private_browsing` field in `ExtensionSettings` is supported starting with
   Firefox 136 (and ESR 128.8). On earlier versions the policy cannot ensure
   ChessKey is enabled in private windows, despite that being a success
   criterion. State and enforce a minimum version or provide a compatible
   fallback, and include the minimum-version case in manual testing.

## Additional review findings (2026-10-10) — resolved

All four are addressed above: (1) *Reconcile logic* step 2 — the baseline is set by
`request-unlock.ps1` and exists only while pending; (2) *State file safety*
(mutex + atomic save); (3) *Blocklist repair*; (4) *Teardown* (idempotent steps,
marker file, self-unregistering task action). Original findings kept for
reference:

1. **[Medium] Start unlock accounting at the request, not the previous reconcile.**
   `guard.ps1` stores `lastBootId` and `lastTick` on every run, including while no
   unlock is pending. If `request-unlock.ps1` only sets `unlockElapsedMs = 0` and
   marks the request pending, the first subsequent run has the same boot ID and a
   larger tick, so it credits the interval *before* the request (up to the
   reconciliation interval). This contradicts the claim that the first run after
   a request credits zero. Record a fresh boot/tick baseline when creating a
   request, or explicitly detect the transition to pending and initialize the
   baseline without crediting time. Add a test where a request is made between
   reconciliations.

2. **[Medium] Serialize state updates across the guard and unlock commands.**
   The scheduled task's "do not start a new instance" setting does not serialize
   `guard.ps1` with `request-unlock.ps1` or `cancel-unlock.ps1`. A command can
   update `state.json` after the guard reads it but before the guard saves its
   stale copy, losing a new request or cancellation. Use a shared lock for all
   state readers/writers that modify state, and save state atomically so an
   interruption cannot leave truncated JSON. Add tests for overlapping updates
   and interrupted writes.

3. **[Medium] Recreate a blocklist entry if a reused entry disappears.**
   When an existing `lichess.org` blocklist value is reused,
   `ownsBlocklistEntry=false` means teardown must preserve it. However, if that
   value is deleted while the guard is active, the design does not say to choose
   a new unused name and claim ownership; this can leave Edge or Chrome
   unblocked, contrary to the repair guarantee. Reconcile should check that the
   recorded reused entry still exists and equals `lichess.org`; if not, find an
   unused numeric name, create the entry, and update ownership state. Add a test
   for deletion of a reused entry.

4. **[Medium] Make matured-unlock cleanup retryable after task unregistration.**
   Teardown unregisters the scheduled task before appending the external unlock
   log and deleting the install directory. If either later operation fails, the
   task is gone and no scheduled retry remains; the folder or log can be left in
   a partial state. Make cleanup resumable/idempotent across failures, or arrange
   a retry mechanism that remains active until all cleanup steps have succeeded.
   Add failure-injection tests at each teardown step.
