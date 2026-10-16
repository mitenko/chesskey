# Streak Unlock Reliability — Design

Date: 2026-10-16
Status: Draft, awaiting review

## Problem

On 2026-10-16 a puzzle streak went past the target of 40 and games stayed locked.
Evidence gathered the same day:

- Firefox runs ChessKey 2.1.1 from AMO (force-installed by ChessKey Guard, `.xpi`
  dated 2026-10-11). Its award rule is `curScore == targetScore`, evaluated only
  when the score *changes* within one page load.
- The screenshot's page load opened at 41
  (`[initStreakTracker] DONE activeScore [41] targetScore [40]`). It got there by
  redirect: opening a game page with no unlock time sends the browser back to
  `/streak` (`checkActiveTime`), and Lichess restores the streak. A page that opens
  at 41 can never see a change to exactly 40.
- Stored data showed the last unlock expired 2026-09-30 14:31, so the earlier page
  load that took the streak through 40 did not leave an unlock behind either. Its
  console was cleared by the redirect, so it cannot be inspected.

Reading the code turned up three defects, any of which loses an earned unlock:

1. **Exact-match award.** The score is read 800 ms after a DOM mutation, and the
   score panel is torn down between puzzles. A read that misses 40 (panel absent, or
   already showing 41) skips the award for good. Bonus rungs (45, 50, ...) have the
   same exact-match problem (`curScore % 5 == 0`).
2. **No award for a page that opens past the target.** The observer fires only on
   changes, so a streak restored past 40 (after a reload or the lockout redirect) is
   never paid.
3. **Lost-update race in storage.** `onScoreChange` calls `addActiveMinutes`, which
   reads `ChessKeyData`, sets `expireTime` and writes the whole object; then
   `onScoreChange` itself reads `ChessKeyData`, sets `currentScore` and writes the
   whole object. Both reads start before either write lands, so whichever write
   finishes last wins. When it is the score save, the old `expireTime` goes back and
   the award vanishes, while the console still says "HIT TARGET". Present since
   2025-09-26 (`06cd5e5`); timing-dependent, which fits awards that sometimes work.

Which of these hit on 2026-10-16 is not known. The debug logging below exists so
the next miss can be attributed.

## Goal

Solving to the target, and every five puzzles past it, reliably unlocks games, and
the unlock is not undone by the extension's own writes.

Success looks like:

- A streak that passes 40 unlocks games whether or not the score was read at
  exactly 40, and whether the page was open from the start or reloaded mid-streak.
- An award, once written, is still in storage afterwards.
- Reloading `/streak` while parked on a score does **not** hand out fresh time.
- When something goes wrong, the Options page event log shows which step failed.
- The fix reaches the PC through AMO as 2.1.2 and ChessKey Guard keeps it installed.

## Non-goals

- Changing the rules: 10 minutes at the target, 10 at each 5 past it, bad beat 5
  minutes when the streak ends within 5 of the target. Time-of-day window unchanged.
- Cross-tab coordination. Two lichess tabs writing at the same instant can still
  race; one streak tab at a time is the normal case.
- Changes to ChessKey Guard.

## Design

### 1. Award on reaching a rung (implemented, uncommitted)

The award ladder is the target, then every `BONUS_INTERVAL` past it: 40, 45, 50,
55. `rungFor(score)` maps a score to the highest rung it has reached (41-44 → 40).
A rung pays when the score reaches it and it is above the highest rung already paid.
Jumping 39 → 41 pays the 40 rung; 44 → 46 pays the 45 rung.

### 2. Opening award, guarded by a stored paid rung

`StreakSession.openingAward()` settles the score the page opened on: if it has
reached a rung that has not been paid, pay it once.

The paid rung must outlive the page. Kept only in memory (as the uncommitted code
does), every reload at 41 pays 40 again, and since an award sets the unlock to
*now + 10 minutes*, reloading becomes unlimited game time. So:

- `ChessKeyData` gains `paidRung: number` (default `-1`, none).
- `StreakSession` is constructed with the stored `paidRung` and exposes the updated
  value after each award. It stays pure; the tracker loads and saves the field.
- **Reset rule:** any score reading below the stored `paidRung` means that streak is
  over (a streak only climbs or ends), so `paidRung` resets to `-1` before the
  reading is evaluated. This applies to every reading, the opening one *and*
  `onScore()` within a page: a collapse to 0 and a re-climb to 40 on the same page
  pays 40 again. A new streak climbing to 40 therefore always pays again.
- **One award per reading.** A reading that crosses several unpaid rungs (39 → 51,
  or a page opening at 52) pays one `TARGET_MINUTES` award and records the highest
  rung crossed (50). Paying each skipped rung separately would change nothing: an
  award sets the unlock to *now + minutes*, it does not add to the time left, so
  three awards in the same instant still unlock for 10 minutes. The next award is
  at the next rung up (55).
- `paidRung` is written in the same save as `expireTime` (see 3), so a paid rung
  can never be recorded without its unlock.

Behaviour table:

| Situation | Stored `paidRung` | Result |
|---|---|---|
| Page opens at 41, rung 40 never paid | -1 | +10m, `paidRung` 40 |
| Reload at 41 after that | 40 | nothing |
| Reload at 46 (45 missed earlier) | 40 | +10m, `paidRung` 45 |
| New streak page opens at 0 | 40 | reset to -1, nothing |
| New streak reaches 40 | -1 | +10m, `paidRung` 40 |
| Same page: paid 40, collapses to 0, re-climbs to 40 | 40 → -1 at the 0 | +10m at the second 40 |
| Reading jumps 39 → 51 | -1 | one +10m, `paidRung` 50 |

### 3. One serialized read-modify-write for `ChessKeyData`

`storage.ts` gets `updateData(mutate: (data: ChessKeyData) => void): Promise<ChessKeyData>`.
Calls are chained on one module-level promise, and each one reads fresh data,
applies `mutate` and awaits the write before the next starts. Every writer moves to
it:

- `addActiveMinutes(minutes, paidRung?)`: sets `expireTime` (and `paidRung`).
- `onScoreChange`: sets `currentScore`.
- Options save and Take A Break: set `targetScore` / `disableBlitz`, and the break
  minutes go through `addActiveMinutes` instead of a separate stale `setData(data)`.

`setData` stays for compatibility but nothing in the extension calls it with a copy
read earlier. Take A Break no longer writes the object it read at the start.

**Storage failures propagate.** Today `getData()` swallows a read error and returns
default `ChessKeyData`, and `setData()` swallows a write error and resolves. A
caller can then write defaults (target 40, no unlock) over real settings, and
`AWARD WRITTEN` is logged after a save that failed. Instead:

- a failed read or write is logged (`logError`) and **rethrown**;
- `updateData` does not write when its read failed, and its promise rejects;
- a rejected `updateData` does not break the queue for later calls;
- `AWARD WRITTEN` is logged only after the write resolved; a failed award write
  logs `AWARD WRITE FAILED`;
- display-only readers (`checkHasActiveTime`, options load) may still fall back to
  defaults, since they write nothing. `checkHasActiveTime` falling back means
  "locked", which is the safe side. To keep it unit-testable without a browser, the queue and
read-modify-write logic live in a function that takes a `{ get, set }` storage area;
`storage.ts` wires it to `browser.storage.sync`.

### 4. Persistent event log (implemented, uncommitted)

`src/event_log.ts` keeps the last 1000 events in `storage.local` (survives reloads
and the lockout redirect), shown newest first on the Options page with Refresh /
Copy / Clear. It records:

- extension version and mode on every page load;
- streak page open: opening score, target, stored unlock, opening award;
- each score change: old → new, `JUMP: N score(s) never read` when scores were
  skipped, the award decision, seconds on the previous score, and how many reads
  (and unreadable reads) happened in that time;
- score panel text that is present but not a number (once per distinct value);
- `AWARD WRITTEN`, then a read-back 3 s later: `award verified` or `AWARD LOST`;
- every change to the stored unlock or target, old → new, flagged
  `MOVED BACKWARDS` when the unlock goes back;
- the score save's `expireTime`, leaving the streak page, game page locked
  (redirect) / unlocked / outside locked hours, options saved, take a break;
- errors from storage reads/writes, `onScoreChange` and `checkActiveTime`.

It ships in 2.1.2 and stays on: the size cap bounds it, and the next miss needs it.

`clearEventLog()` goes through the same `pending` queue as `logEvent()`, so a write
queued before Clear cannot land after it and bring the old entries back. Entries
logged after Clear is pressed are kept.

### 5. Cleanup

The `NO_RUNG_AWARDED` constant was inserted between `StreakSession`'s doc comment
and the class; move it above the comment so the comment documents the class again.

## Testing

Automated (`npm test`, node test runner):

- Existing 17 `streak_rules` tests stay green.
- New `streak_rules` tests: session built with a stored `paidRung` pays nothing at
  that rung; pays the next rung; resets on a reading below the stored rung; every
  row of the behaviour table above.
- New `updateData` tests against a fake storage area whose `get`/`set` resolve with
  a delay: an `expireTime` update and a `currentScore` update issued back to back
  both survive (fails against the current read-then-write pattern); updates apply in
  call order; a failed read rejects without writing; a failed write rejects; the
  call after a rejected one still runs.
- `streak_rules` tests for the collapse-and-re-climb sequence on one session, a
  39 → 51 jump (one award, next pays at 55) and an opening at 52.
- Event log tests against a fake `storage.local`: Clear issued while a delayed
  `logEvent` write is in flight leaves only entries logged after the Clear. To make
  this testable, the queue logic takes the storage area as a parameter, as
  `updateData` does.

Manual, after 2.1.2 is installed from AMO (`about:addons` shows 2.1.2):

1. Run a streak past 40 with the page open throughout. Event log: `score 39 -> 40`
   (or a `JUMP` over it), `AWARD WRITTEN`, `award verified`, no `AWARD LOST`, no
   `MOVED BACKWARDS`. A game page opens.
2. Reload `/streak` at 41+: `no opening award`; unlock time unchanged.
3. Reach 45: award, verified.
4. Start a fresh streak: `paidRung` resets, reaching 40 pays again.

## Release

1. Bump `manifest.json` 2.1.1 → 2.1.2.
2. `npm test`, `npm run build`, package the extension (`manifest.json`, `dist/`,
   `icons/`) as a `.zip` into the scratchpad.
3. On a branch, squash to one commit, PR per the GitHub protocol (identity
   `mitenko`).
4. Upload to AMO (the user, at addons.mozilla.org, or `web-ext sign` if AMO API keys
   are provided). Uploading publishes to every ChessKey user, so it waits for
   explicit go-ahead.
5. After AMO approval, Firefox updates the force-installed add-on on its next update
   check; `about:addons` → "Check for Updates" forces it. ChessKey Guard's policy
   points at `latest.xpi`, so no Guard change is needed.

## Decision taken without explicit confirmation

Section 2 uses a stored paid rung (option 1 of the three offered on 2026-10-16:
stored rung / no opening award / keep the reload loophole). The alternative "no
opening award" is simpler but leaves the exact 2026-10-16 case (page opens at 41)
locked until 45.

## Review findings (2026-10-16) — resolved

Findings below compare the design with the current working tree and assess the
award/storage behavior. The implementation is not ready to release until the
high-priority items are resolved.

Resolution:

1. Implementation gap, already specified in section 2; covered by the plan.
2. Implementation gap, already specified in section 3; covered by the plan,
   including Take A Break's stale write and the fake-area tests.
3. Section 2 reset rule now applies to every reading within a page, with a
   behaviour-table row and a test.
4. Section 2: one award per reading, recording the highest rung crossed. Awards
   reset the unlock rather than add to it, so per-rung payment would not change the
   time granted. Behaviour-table row and tests added.
5. Section 3: write-path failures are logged and rethrown, `updateData` never
   writes after a failed read, `AWARD WRITTEN` only after a successful write.
6. Section 4: `clearEventLog()` joins the `pending` queue; test added.

1. **High — opening awards are not persisted, so reloads repeatedly grant time.**
   `src/streak_rules.ts` initializes `awardedRung` to `-1` for every new session
   (constructor, lines 40-47); `src/streak_tracker.ts` constructs the session
   without loading a paid rung and does not save one (lines 144-157). Therefore
   every reload at score 41 pays the target again, contrary to section 2 and its
   reload behavior table. Add `paidRung` to persisted data and only award rungs
   above the saved value.

2. **High — the lost-update race remains in all whole-object writers.**
   The specified `updateData` helper is absent. `src/streak_tracker.ts` starts
   `addActiveMinutes()` and then independently reads and writes a stale
   `ChessKeyData` object (`src/storage.ts` lines 50-57 and tracker lines 38-46).
   `src/options.ts` also saves an object previously read, and Take A Break calls
   `addActiveMinutes()` before unconditionally writing that stale object (lines
   60-74). Any of these writes can restore an old `expireTime`; the new fake-area
   serialization tests described in Testing are not present. Move every writer
   to the serialized read-modify-write path before relying on the award.

3. **High — a new streak on the same page cannot earn an already-paid rung again.**
   `src/streak_rules.ts` never lowers `awardedRung` when `onScore()` observes a
   drop below it (lines 90-113). For example, after paying rung 40, a collapse to
   0 and a later climb back to 40 leaves `rung == awardedRung`, so no new target
   award is issued. Reset the paid rung when the score demonstrates the prior
   streak ended, and cover the collapse-and-reclimb sequence in tests.

4. **Medium — multi-rung score jumps have an unspecified and underpaying outcome.**
   The current ladder records only the highest rung reached and emits one
   `TARGET_MINUTES` award (`src/streak_rules.ts` lines 106-113). A read jumping
   from 39 to 51 thus pays 10 minutes total, not 10 minutes for each of 40, 45,
   and 50. Clarify whether skipped rungs are all owed: the non-goal says 10
   minutes at each five-puzzle rung, while the design's “pay it once” wording
   could be read as paying only the highest newly reached rung. Add a test for
   the chosen policy, including an opening score several rungs past target.

5. **Medium — storage failures can look successful and can overwrite valid data.**
   `src/storage.ts` catches read errors and returns a default `ChessKeyData`
   (lines 15-28), and `setData()` catches write errors and resolves normally
   (lines 8-12). A caller can consequently write defaults over valid settings or
   an unlock after a failed read; `addActiveMinutes()` then logs `AWARD WRITTEN`
   after a failed save because that error was swallowed (lines 50-57). Propagate
   failures to callers (while logging them) and only report an award written
   after the storage write succeeds.

6. **Low — clearing the event log can race with queued log writes.**
   `src/event_log.ts` serializes `logEvent()` writes through `pending` (lines
   24-44), but `clearEventLog()` removes the key independently (lines 78-80).
   If a queued write finishes after the remove, it restores the pre-clear entries.
   Serialize clear with the same queue and test clear while a delayed write is in
   flight.
