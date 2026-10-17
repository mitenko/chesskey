# Streak Unlock Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a streak past the target reliably unlock Lichess games, stop reloads from handing out fresh time, stop the extension's own saves from erasing an award, and ship it to AMO as 2.1.2.

**Architecture:** A new browser-free module, `src/storage_queue.ts`, serializes every read-modify-write of `ChessKeyData` (and of the event log) through one promise queue. `StreakSession` (pure rules) takes and exposes a `paidRung` that the tracker loads from and saves to `ChessKeyData` in the same write as the award. Everything browser-specific stays in `storage.ts`, `event_log.ts`, `streak_tracker.ts` and `options.ts`.

**Tech Stack:** TypeScript 5.9, webpack 5 + ts-loader (bundle), `webextension-polyfill-ts`, Node 22 test runner with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-10-16-streak-unlock-reliability-design.md`

## Global Constraints

- Award rules unchanged: `TARGET_MINUTES = 10` at the target and at every `BONUS_INTERVAL = 5` past it; bad beat `BAD_BEAT_MINUTES = 5` when the streak ends within `BAD_BEAT_WINDOW = 5` of the target. Locked hours 6:00-17:00 unchanged.
- An award sets the unlock to *now + minutes*; it never adds to the time left.
- One award per reading; the highest rung crossed is recorded.
- `paidRung` default and "none" value: `-1` (`NO_RUNG_PAID`).
- Every write to `ChessKeyData` goes through `updateData`; no code saves a `ChessKeyData` copy it read earlier.
- Modules imported by tests (`src/streak_rules.ts`, `src/storage_queue.ts`) must have **no runtime imports**: Node runs them directly with type stripping, and they are imported as `../src/<name>.ts`. Inside `src/`, imports stay extensionless (`'./storage_queue'`) for ts-loader.
- No TypeScript `enum`, `namespace` or parameter properties in those two modules (type stripping cannot erase them).
- Event log: `storage.local` key `chessKeyEventLog`, max 1000 entries, stays on in the release.
- GitHub identity `mitenko <mitenko@gmail.com>`; no Claude attribution in commits or PR text.
- Uploading to AMO publishes to every ChessKey user: it waits for the user's explicit go-ahead.

## Review Focus

1. **Data stored by 2.1.1 has no `paidRung`.** The first 2.1.2 read must treat it as `-1`, not `undefined` (which compares false against every rung and would block all awards). Test: Task 1 "data saved by an older version gets defaults".
2. **Score panel unreadable when the page opens.** Today that reads as 0, which would wrongly reset the stored rung and reopen the reload loophole. Expected: no opening award, no reset; the first real reading decides. Tests: Task 2 "an unreadable opening score …" (two tests).
3. **Target changed in Options after a rung was paid.** Readings are judged against the new target; a stored rung above the score resets. Test: Task 2 "a stored rung above a lowered target is forgotten".
4. **Score changes arriving faster than saves complete.** Saves must land in call order so the stored `paidRung`/`currentScore` end on the latest reading. Test: Task 1 "updates apply in call order".
5. **A failed award write.** Logs `AWARD WRITE FAILED`, not `AWARD WRITTEN`, and later writes still run. Test: Task 1 "a failed update does not block the next one" (queue); the logging is in Task 3's `writeAward`.

---

### Task 0: Commit the work in progress as a baseline

The working tree on branch `mitenko/streak-unlock-reliability` already holds the rung-crossing award, the in-memory opening award and the persistent event log (spec sections 1 and 4). Commit it so each later task has a clean diff. Everything is squashed into one commit in Task 5.

**Files:** all currently modified/untracked files under `src/`, `test/`, `dist/`.

- [ ] **Step 1: Verify it builds and tests pass**

Run: `npm test` then `npm run build`
Expected: `# pass 17`, `# fail 0`; webpack `compiled successfully`.

- [ ] **Step 2: Commit**

```bash
git add src test dist
git commit -m "WIP: award on reaching a rung, opening award, persistent event log"
```

---

### Task 1: Serialized storage queue (`src/storage_queue.ts`)

**Files:**
- Create: `src/storage_queue.ts`
- Create: `test/storage_queue.test.ts`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface StorageArea { get(key: string): Promise<{ [key: string]: any }>; set(items: { [key: string]: any }): Promise<void>; remove(key: string): Promise<void>; }`
  - `createQueue(): <R>(job: () => Promise<R>) => Promise<R>`
  - `createDataStore<T extends object>(area: StorageArea, key: string, makeDefault: () => T): { read(): Promise<T>; update(mutate: (data: T) => void): Promise<T> }`
  - `interface LogEntry { time: number; page: string; msg: string; }`
  - `createLogStore(area: StorageArea, key: string, maxEntries: number): { read(): Promise<LogEntry[]>; append(entry: LogEntry): Promise<void>; clear(): Promise<void> }`

- [ ] **Step 1: Add the new test file to the test script**

In `package.json`, change `scripts.test` to:

```json
"test": "node --experimental-strip-types --disable-warning=ExperimentalWarning --test test/streak_rules.test.ts test/storage_queue.test.ts"
```

- [ ] **Step 2: Write the failing tests**

Create `test/storage_queue.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { createDataStore, createLogStore } from '../src/storage_queue.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A storage area whose every call takes a few milliseconds, like the real one, so
// that overlapping reads and writes really do overlap.
function slowArea() {
    const items: { [key: string]: any } = {};
    const area = {
        items,
        failNextGet: false,
        failNextSet: false,
        async get(key: string) {
            await sleep(5);
            if (area.failNextGet) {
                area.failNextGet = false;
                throw new Error('get failed');
            }
            return items[key] === undefined ? {} : { [key]: structuredClone(items[key]) };
        },
        async set(values: { [key: string]: any }) {
            await sleep(5);
            if (area.failNextSet) {
                area.failNextSet = false;
                throw new Error('set failed');
            }
            for (const k of Object.keys(values)) {
                items[k] = structuredClone(values[k]);
            }
        },
        async remove(key: string) {
            await sleep(5);
            delete items[key];
        },
    };
    return area;
}

class Data {
    expireTime = 0;
    currentScore = 0;
    paidRung = -1;
}

// The bug this suite was written for: the award save and the score save each read
// the whole object, changed one field and wrote the whole object back, so whichever
// landed last put the other's field back to its old value -- erasing the unlock.
test('two writes issued back to back both survive', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    await Promise.all([
        store.update((d) => { d.expireTime = 1000; }),
        store.update((d) => { d.currentScore = 41; }),
    ]);

    const saved = await store.read();
    assert.equal(saved.expireTime, 1000, 'the award is still there');
    assert.equal(saved.currentScore, 41);
});

test('updates apply in call order', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    await Promise.all([
        store.update((d) => { d.paidRung = 40; d.currentScore = 41; }),
        store.update((d) => { d.paidRung = -1; d.currentScore = 0; }),
        store.update((d) => { d.paidRung = 45; d.currentScore = 46; }),
    ]);

    const saved = await store.read();
    assert.equal(saved.paidRung, 45);
    assert.equal(saved.currentScore, 46);
});

test('data saved by an older version gets defaults for fields it never had', async () => {
    const area = slowArea();
    area.items.data = { expireTime: 5, currentScore: 3 };
    const store = createDataStore(area, 'data', () => new Data());

    const saved = await store.read();
    assert.equal(saved.paidRung, -1);
    assert.equal(saved.expireTime, 5);
    assert.equal(saved.currentScore, 3);
});

test('nothing stored yet reads as the defaults', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    assert.deepEqual({ ...(await store.read()) }, { expireTime: 0, currentScore: 0, paidRung: -1 });
});

test('a failed read rejects and writes nothing', async () => {
    const area = slowArea();
    area.items.data = { expireTime: 5, currentScore: 3, paidRung: 40 };
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextGet = true;
    await assert.rejects(store.update((d) => { d.currentScore = 4; }), /get failed/);
    assert.equal(area.items.data.expireTime, 5, 'defaults were not written over the real data');
    assert.equal(area.items.data.paidRung, 40);
});

test('a failed write rejects', async () => {
    const area = slowArea();
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextSet = true;
    await assert.rejects(store.update((d) => { d.expireTime = 9; }), /set failed/);
});

test('a failed update does not block the next one', async () => {
    const area = slowArea();
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextSet = true;
    const failing = store.update((d) => { d.expireTime = 1; });
    const next = store.update((d) => { d.expireTime = 7; });

    await assert.rejects(failing);
    await next;
    assert.equal((await store.read()).expireTime, 7);
});

const entry = (msg: string) => ({ time: 0, page: '/streak', msg: msg });

test('Clear issued while a log write is in flight leaves only later entries', async () => {
    const store = createLogStore(slowArea(), 'log', 10);

    const before = store.append(entry('before'));
    const cleared = store.clear();
    const after = store.append(entry('after'));
    await Promise.all([before, cleared, after]);

    assert.deepEqual((await store.read()).map((e) => e.msg), ['after']);
});

test('the log keeps only the newest entries', async () => {
    const store = createLogStore(slowArea(), 'log', 3);

    await Promise.all(['a', 'b', 'c', 'd', 'e'].map((m) => store.append(entry(m))));

    assert.deepEqual((await store.read()).map((e) => e.msg), ['c', 'd', 'e']);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `test/storage_queue.test.ts` cannot resolve `../src/storage_queue.ts` (ERR_MODULE_NOT_FOUND). The 17 `streak_rules` tests still pass.

- [ ] **Step 4: Write the implementation**

Create `src/storage_queue.ts`:

```ts
/**
 * Serialized read-modify-write over a browser storage area.
 *
 * Writers used to save a whole object they had read earlier, so whichever save
 * landed last put back every field the others had just changed -- including a
 * freshly awarded unlock. Here every change reads fresh data, applies itself and
 * waits for its save before the next change starts.
 *
 * No browser imports on purpose: the node test runner drives this module directly
 * with a fake storage area whose calls are slow enough to overlap.
 */

export interface StorageArea {
    get(key: string): Promise<{ [key: string]: any }>;
    set(items: { [key: string]: any }): Promise<void>;
    remove(key: string): Promise<void>;
}

/**
 * Runs jobs one at a time, in the order they were queued. A job that fails rejects
 * its own promise but does not stop the jobs queued after it.
 */
export function createQueue() {
    let tail: Promise<unknown> = Promise.resolve();

    return function enqueue<R>(job: () => Promise<R>): Promise<R> {
        let result = tail.then(job);
        tail = result.catch(() => undefined);
        return result;
    };
}

export function createDataStore<T extends object>(area: StorageArea, key: string, makeDefault: () => T) {
    const enqueue = createQueue();

    // Fields added since the object was stored (paidRung, for data saved by 2.1.1)
    // come from the defaults instead of reading as undefined.
    async function read(): Promise<T> {
        let stored = await area.get(key);
        return Object.assign(makeDefault(), stored?.[key] ?? {});
    }

    // A failed read rejects before anything is written, so defaults can never be
    // saved over real data.
    function update(mutate: (data: T) => void): Promise<T> {
        return enqueue(async () => {
            let data = await read();
            mutate(data);
            await area.set({ [key]: data });
            return data;
        });
    }

    return { read, update };
}

export interface LogEntry {
    time: number;
    page: string;
    msg: string;
}

export function createLogStore(area: StorageArea, key: string, maxEntries: number) {
    const enqueue = createQueue();

    async function read(): Promise<LogEntry[]> {
        let stored = await area.get(key);
        return stored?.[key] ?? [];
    }

    function append(entry: LogEntry): Promise<void> {
        return enqueue(async () => {
            let entries = await read();
            entries.push(entry);
            if (entries.length > maxEntries) {
                entries = entries.slice(-maxEntries);
            }
            await area.set({ [key]: entries });
        });
    }

    // Queued like a write, so an append already in flight cannot land after the
    // clear and bring the old entries back.
    function clear(): Promise<void> {
        return enqueue(() => area.remove(key));
    }

    return { read, append, clear };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: `# pass 26`, `# fail 0`.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add package.json src/storage_queue.ts test/storage_queue.test.ts
git commit -m "Add serialized storage queue for ChessKeyData and the event log"
```

---

### Task 2: Stored paid rung in `StreakSession`

**Files:**
- Modify: `src/streak_rules.ts` (constant at line 37, class at lines 39-118)
- Test: `test/streak_rules.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const NO_RUNG_PAID = -1;` (replaces the unexported `NO_RUNG_AWARDED`)
  - `new StreakSession(startingScore: number | null, targetScore: number, paidRung: number = NO_RUNG_PAID)` — `null` means the score panel could not be read when the page opened.
  - `session.paidRung: number` — public; the tracker saves it after every reading. Replaces `awardedRung`.
  - `openingAward()` and `onScore()` keep their signatures.

- [ ] **Step 1: Write the failing tests**

In `test/streak_rules.test.ts`, change the import line to:

```ts
import { StreakSession, parseScore, BAD_BEAT_MINUTES, TARGET_MINUTES, NO_RUNG_PAID } from '../src/streak_rules.ts';
```

Append:

```ts
// The paid rung is stored across page loads, so a reload on a paid rung cannot hand
// out fresh time: an award resets the unlock to now + 10 minutes, so paying it on
// every reload would be unlimited game time. These follow the spec's behaviour table.
test('a reload on an already-paid rung pays nothing', () => {
    const session = new StreakSession(41, TARGET, 40);

    assert.equal(session.openingAward().minutes, 0);
    assert.equal(session.paidRung, 40);
});

test('a reload past an unpaid rung pays it', () => {
    // 45 was crossed but never read on the previous page load.
    const session = new StreakSession(46, TARGET, 40);

    assert.equal(session.openingAward().minutes, TARGET_MINUTES);
    assert.equal(session.paidRung, 45);
});

test('a new streak page forgets the rung paid to the last streak', () => {
    const session = new StreakSession(0, TARGET, 40);

    assert.equal(session.openingAward().minutes, 0);
    assert.equal(session.paidRung, NO_RUNG_PAID);

    for (let score = 1; score < TARGET; score++) session.onScore(score);
    assert.equal(session.onScore(TARGET).minutes, TARGET_MINUTES);
});

test('a streak that collapses and re-climbs on the same page pays the target again', () => {
    const session = new StreakSession(0, TARGET);
    for (let score = 1; score <= 41; score++) session.onScore(score);

    session.onScore(0);
    assert.equal(session.paidRung, NO_RUNG_PAID, 'the streak that earned 40 is over');

    for (let score = 1; score < TARGET; score++) session.onScore(score);
    assert.equal(session.onScore(TARGET).minutes, TARGET_MINUTES);
});

test('a reading that crosses several rungs pays once and records the highest', () => {
    const session = new StreakSession(0, TARGET);
    for (let score = 1; score < TARGET; score++) session.onScore(score);

    assert.equal(session.onScore(51).minutes, TARGET_MINUTES);
    assert.equal(session.paidRung, 50);
    assert.equal(session.onScore(52).minutes, 0);
    assert.equal(session.onScore(54).minutes, 0);
    assert.equal(session.onScore(55).minutes, TARGET_MINUTES, 'next rung up');
});

test('a page opening several rungs past the target records the highest rung', () => {
    const session = new StreakSession(52, TARGET);

    assert.equal(session.openingAward().minutes, TARGET_MINUTES);
    assert.equal(session.paidRung, 50);
});

test('an unreadable opening score neither pays nor forgets the paid rung', () => {
    // Reading the missing panel as 0 would look like a new streak and wipe the
    // stored rung -- and the next reading of 41 would pay the reload again.
    const session = new StreakSession(null, TARGET, 40);

    assert.equal(session.openingAward().minutes, 0);
    assert.equal(session.paidRung, 40);
    assert.equal(session.onScore(41).minutes, 0, 'paid before the reload');
});

test('an unreadable opening score still pays once the score is read', () => {
    const session = new StreakSession(null, TARGET);
    session.openingAward();

    assert.equal(session.onScore(41).minutes, TARGET_MINUTES);
    assert.equal(session.paidRung, 40);
});

test('a stored rung above a lowered target is forgotten', () => {
    // Target changed from 40 to 30 in Options after 40 was paid.
    const session = new StreakSession(32, 30, 40);

    assert.equal(session.openingAward().minutes, TARGET_MINUTES);
    assert.equal(session.paidRung, 30);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — the new tests fail (e.g. "a reload on an already-paid rung pays nothing": expected 0, actual 10; `paidRung` is `undefined`).

- [ ] **Step 3: Write the implementation**

In `src/streak_rules.ts`, delete line 37 (`const NO_RUNG_AWARDED = -1;`) and its following blank line, and insert directly above the `StreakSession` doc comment (the `/**` block that starts "Scoring rules for one continuous run…"), so the comment documents the class again:

```ts
/** No rung of the award ladder has been paid for the current streak. */
export const NO_RUNG_PAID = -1;

```

Replace the fields and constructor (old lines 39-48) with:

```ts
export class StreakSession {
    prevScore: number;
    targetScore: number;
    /**
     * The highest rung already paid for the streak on screen. Stored with the award,
     * so that a reload on a paid rung -- the page reopens on the restored streak --
     * does not pay it again.
     */
    paidRung: number;
    private openingScoreKnown: boolean;

    /**
     * startingScore is null when the score panel could not be read as the page
     * opened. That is not a score of 0: a 0 would look like a new streak and wipe
     * the stored paidRung. The first real reading then decides.
     */
    constructor(startingScore: number | null, targetScore: number, paidRung: number = NO_RUNG_PAID) {
        this.openingScoreKnown = startingScore != null;
        this.prevScore = startingScore ?? 0;
        this.targetScore = targetScore;
        this.paidRung = paidRung;
    }

    /**
     * A streak only climbs or ends, so a reading below the paid rung means the streak
     * that earned it is over, and a new streak must be able to earn it again.
     */
    private forgetEndedStreak(score: number) {
        if (score < this.paidRung) {
            this.paidRung = NO_RUNG_PAID;
        }
    }
```

In `rungFor`, replace `return NO_RUNG_AWARDED;` with `return NO_RUNG_PAID;`.

Replace `openingAward()` (body of old lines 76-88) with:

```ts
    openingAward(): StreakAward {
        if (!this.openingScoreKnown) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.forgetEndedStreak(this.prevScore);

        let rung = this.rungFor(this.prevScore);
        if (rung <= this.paidRung) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.paidRung = rung;
        return { streakEnded: false, minutes: TARGET_MINUTES, reason: `ALREADY PAST ${rung}! KEEP GOING!` };
    }
```

In `onScore()`, replace the block from `let rung = this.rungFor(curScore);` through the closing `}` of its `if` (old lines 106-113) with:

```ts
        this.forgetEndedStreak(curScore);

        // One award per reading: a jump over several rungs pays once, for the highest.
        // Awards reset the unlock rather than add to it, so paying each skipped rung
        // would grant no more time.
        let rung = this.rungFor(curScore);
        if (rung > this.paidRung) {
            if (TARGET_MINUTES >= minutes) {
                minutes = TARGET_MINUTES;
                reason = rung == this.targetScore ? 'HIT TARGET! KEEP GOING!' : 'GO FOR GOLD!';
            }
            this.paidRung = rung;
        }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: `# pass 35`, `# fail 0`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no output. (`streak_tracker.ts` still calls `new StreakSession(activeScore, targetScore)`, which remains valid.)

- [ ] **Step 6: Commit**

```bash
git add src/streak_rules.ts test/streak_rules.test.ts
git commit -m "Keep the paid rung across page loads and reset it when a streak ends"
```

---

### Task 3: Route every write through `updateData`

**Files:**
- Modify: `src/data.ts` (add `paidRung`)
- Modify: `src/storage.ts` (whole file)
- Modify: `src/event_log.ts` (use `createLogStore`)
- Modify: `src/options.ts` (`saveOptions`, `breakOptions`, imports)
- Modify: `src/streak_tracker.ts` (`onScoreChange` save, `initStreakTracker` award; imports)

**Interfaces:**
- Consumes: `createDataStore`, `createLogStore` (Task 1); `NO_RUNG_PAID`, `session.paidRung` (Task 2).
- Produces (from `storage.ts`):
  - `updateData(mutate: (data: ChessKeyData) => void): Promise<ChessKeyData>` — logs and rethrows failures.
  - `getData(): Promise<ChessKeyData>` — read-only use; falls back to defaults on failure.
  - `addActiveMinutes(minutes: number): Promise<void>`
  - `saveStreakState(score: number, paidRung: number, awardMinutes: number): Promise<void>` — one write of `currentScore`, `paidRung` and (when `awardMinutes > 0`) `expireTime`.
  - `setData` is removed: with every writer on `updateData` it has no callers (the spec allowed it to stay; dead code doesn't need to).

- [ ] **Step 1: Add `paidRung` to `ChessKeyData`**

In `src/data.ts`, add the import and field so the class reads:

```ts
import { debugLog } from "./util";
import { NO_RUNG_PAID } from "./streak_rules";

export class ChessKeyData {
    targetScore: number;
    expireTime: number;
    disableBlitz: boolean;
    currentScore: number;
    paidRung: number;

    constructor(
        targetScore?: number,
        expireTime?: number,
        disableBlitz?: boolean,
        currentScore?: number,
        paidRung?: number,
    ) {
        this.targetScore = targetScore ?? 40;
        this.expireTime = expireTime ?? 0;
        this.disableBlitz = disableBlitz ?? false;
        this.currentScore = currentScore ?? 0;
        this.paidRung = paidRung ?? NO_RUNG_PAID;
    }
```

In `dumpToLog()`, add `debugLog(\`[dumpToLog] paidRung [${this.paidRung}]\`);` after the `currentScore` line.

- [ ] **Step 2: Rewrite `src/storage.ts`**

Replace the whole file with:

```ts
import { browser } from 'webextension-polyfill-ts';
import { debugLog } from './util';
import { ChessKeyData } from './data';
import { createDataStore } from './storage_queue';
import { logEvent, logError, formatTime } from './event_log';

const AWARD_VERIFY_DELAY_MILLIS = 3000;

// Every write goes through this one queue -- see storage_queue.ts for the lost-update
// race it exists to prevent. Only this page's writes are ordered; two lichess tabs
// writing at the same instant can still race.
const dataStore = createDataStore<ChessKeyData>(browser.storage.sync, 'chessKeyData', () => new ChessKeyData());

export async function updateData(mutate: (data: ChessKeyData) => void): Promise<ChessKeyData> {
    try {
        return await dataStore.update(mutate);
    } catch (error) {
        logError('updateData', error);
        throw error;
    }
}

/**
 * For display and for decisions that write nothing. A failed read falls back to the
 * defaults, which reads as "locked" -- never base a write on the result, use
 * updateData.
 */
export async function getData(): Promise<ChessKeyData> {
    try {
        return await dataStore.read();
    } catch (error) {
        logError('getData', error);
        return new ChessKeyData();
    }
}

export async function getTargetScore(): Promise<number> {
    return (await getData()).targetScore;
}

export async function getDisableBlitz(): Promise<boolean> {
    return (await getData()).disableBlitz;
}

/**
 * Applies `mutate` and, when minutes > 0, unlocks games until now + minutes, all in
 * one write. "AWARD WRITTEN" is only logged once that write has succeeded.
 */
async function writeAward(minutes: number, mutate: (data: ChessKeyData) => void): Promise<void> {
    let expireTime = Date.now() + (minutes * 60 * 1000);
    try {
        await updateData((data) => {
            mutate(data);
            if (minutes > 0) {
                data.expireTime = expireTime;
            }
        });
    } catch (error) {
        if (minutes > 0) {
            logEvent(`AWARD WRITE FAILED +${minutes}m: ${error}`);
        }
        throw error;
    }

    if (minutes > 0) {
        logEvent(`AWARD WRITTEN +${minutes}m, games unlocked until ${formatTime(expireTime)}`);
        setTimeout(() => verifyAward(expireTime), AWARD_VERIFY_DELAY_MILLIS);
    }
}

// Kept from the investigation into lost awards: if anything still writes a stale
// expireTime back (another tab, a future writer), this says so.
async function verifyAward(expireTime: number) {
    let after = await getData();
    if (after.expireTime < expireTime) {
        logEvent(`AWARD LOST: expireTime was overwritten back to ${formatTime(after.expireTime)}`);
    } else {
        logEvent(`award verified, unlocked until ${formatTime(after.expireTime)}`);
    }
}

export function addActiveMinutes(minutes: number): Promise<void> {
    debugLog(`[addActiveMinutes] Adding ${minutes} minutes`);
    return writeAward(minutes, () => {});
}

/** One write for a score reading: the score, the paid rung and any award together. */
export function saveStreakState(score: number, paidRung: number, awardMinutes: number): Promise<void> {
    return writeAward(awardMinutes, (data) => {
        data.currentScore = score;
        data.paidRung = paidRung;
    });
}

export async function checkHasActiveTime(): Promise<boolean> {
    let expireTime = (await getData()).expireTime;
    let curTime = Date.now();
    debugLog(`[checkHasActiveTime] expireTime [${expireTime}] >= curTime [${curTime}]`);
    return expireTime >= curTime;
}
```

- [ ] **Step 3: Move `src/event_log.ts` onto `createLogStore`**

Replace everything from `const LOG_KEY` down to (not including) `export function logError` with:

```ts
const LOG_KEY = 'chessKeyEventLog';
const MAX_ENTRIES = 1000;

// Appends and Clear share one queue, so two events logged back to back cannot drop
// each other and a queued append cannot land after a Clear. Ordering is per page;
// two lichess tabs logging at the same instant can still lose an entry.
const logStore = createLogStore(browser.storage.local, LOG_KEY, MAX_ENTRIES);

export function logEvent(msg: string) {
    console.log(`[event] ${msg}`);
    let entry: LogEntry = { time: Date.now(), page: window.location.pathname, msg: msg };
    logStore.append(entry).catch((error) => console.error(`[logEvent] ${error}`));
}
```

Replace `readEventLog` and `clearEventLog` with:

```ts
export function readEventLog(): Promise<LogEntry[]> {
    return logStore.read();
}

export function clearEventLog(): Promise<void> {
    return logStore.clear();
}
```

Delete the local `export interface LogEntry { … }` and the `let pending …` declaration, and add to the imports at the top:

```ts
import { createLogStore, LogEntry } from './storage_queue';
```

Keep `logError`, `watchStorageChanges` and `formatTime` as they are.

- [ ] **Step 4: Move `src/options.ts` writers onto `updateData`**

Change the storage import to:

```ts
import { getData, updateData, addActiveMinutes } from './storage';
```

Replace `saveOptions` with:

```ts
async function saveOptions() {
    try {
        debugLog('[saveOptions]');

        let targetPuzzle = parseInt(getInputElement('target-puzzle').value);
        let disableBlitz = getInputElement('disable-blitz').checked;

        await updateData((data) => {
            logEvent(`options saved: target ${data.targetScore} -> ${targetPuzzle}, disableBlitz ${data.disableBlitz} -> ${disableBlitz}`);
            data.targetScore = targetPuzzle;
            data.disableBlitz = disableBlitz;
        });
    } catch (e) {
        debugLog(e);
    }
}
```

Replace `breakOptions` with (the decision only reads; the break goes through `addActiveMinutes` and nothing writes the copy read at the start):

```ts
async function breakOptions() {
    try {
        debugLog('[breakOptions]');
        let expireTime = (await getData()).expireTime;
        let curTime = Date.now();

        // if the expiretime was more than 90 minutes ago
        if (curTime - expireTime > 90 * 60 * 1000) {
            logEvent('take a break: +5m');
            await addActiveMinutes(5);
        } else {
            let timeToBreak = 90 - Math.round((curTime - expireTime)/60000);
            console.log(`[breakOptions] time to next break [${timeToBreak}m]`);
        }
    } catch (e) {
        debugLog(e);
    }
}
```

If `ChessKeyData` is no longer referenced in `options.ts` after this, remove its import.

- [ ] **Step 5: Move `src/streak_tracker.ts` writers onto `saveStreakState`**

Replace the three storage/data import lines (lines 1, 3, 4) with:

```ts
import { getTargetScore, getData, saveStreakState } from './storage';
```

In `onScoreChange`, replace everything from `if (award.minutes > 0) {` through the `logEvent(\`score save wrote …\`);` line with:

```ts
        if (award.minutes > 0) {
            console.log(`[onScoreChange] ${award.reason}`);
        }

        // Score, paid rung and award go out in one write, so none of them can put
        // another back to an old value.
        await saveStreakState(curScore, session!.paidRung, award.minutes);
```

In `initStreakTracker`, replace:

```ts
    if (opening.minutes > 0) {
        console.log(`[initStreakTracker] ${opening.reason}`);
        addActiveMinutes(opening.minutes);
    }
```

with:

```ts
    if (opening.minutes > 0) {
        console.log(`[initStreakTracker] ${opening.reason}`);
        saveStreakState(activeScore, session.paidRung, opening.minutes)
            .catch((error) => logError('initStreakTracker', error));
    }
```

(Task 4 replaces this block again once the stored rung is loaded.)

- [ ] **Step 6: Check no stale writer is left**

Run: `grep -rn "setData\|ChessKeyData = await getData" src`
Expected: no output.

- [ ] **Step 7: Typecheck, test, build**

Run: `npx tsc --noEmit -p .` then `npm test` then `npm run build`
Expected: no tsc output; `# pass 35`, `# fail 0`; webpack `compiled successfully`.

- [ ] **Step 8: Commit**

```bash
git add src/data.ts src/storage.ts src/event_log.ts src/options.ts src/streak_tracker.ts
git commit -m "Route every ChessKeyData write through one serialized updateData"
```

---

### Task 4: Load and save the paid rung in the tracker

**Files:**
- Modify: `src/streak_tracker.ts` (`initStreakTracker`)

**Interfaces:**
- Consumes: `new StreakSession(startingScore: number | null, targetScore, paidRung)`, `session.paidRung` (Task 2); `getData`, `saveStreakState` (Task 3); `ChessKeyData.paidRung` (Task 3).
- Produces: nothing new.

- [ ] **Step 1: Replace the session setup in `initStreakTracker`**

Replace everything from `let targetScore = await getTargetScore();` down to and including the `if (opening.minutes > 0) { … }` block with:

```ts
    let stored = await getData();
    let targetScore = stored.targetScore;
    let openingScore = getCurScore();
    activeScore = openingScore ?? 0;

    // The paid rung comes from storage so that reopening the page on the restored
    // streak -- a reload, or the redirect from a locked game page -- does not pay it
    // again. An unreadable opening score is passed as null, not 0: see StreakSession.
    session = new StreakSession(openingScore, targetScore, stored.paidRung);

    // The observer only ever fires on a score *change*, so a session that opens with
    // the streak already restored past the target has no later event to pay it out.
    let opening = session.openingAward();
    logEvent(`streak page opened: score ${openingScore ?? 'unreadable'}, target ${targetScore}, ` +
        `paid rung ${stored.paidRung} -> ${session.paidRung}, unlocked until ${formatTime(stored.expireTime)}, ` +
        (opening.minutes > 0 ? `opening award +${opening.minutes}m "${opening.reason}"` : 'no opening award'));

    // Saved even without an award: a new streak resets the stored rung.
    if (openingScore != null) {
        if (opening.minutes > 0) {
            console.log(`[initStreakTracker] ${opening.reason}`);
        }
        saveStreakState(openingScore, session.paidRung, opening.minutes)
            .catch((error) => logError('initStreakTracker', error));
    }
```

- [ ] **Step 2: Drop the now-unused import**

If `getTargetScore` is no longer used in `streak_tracker.ts`, remove it from the import. Then run `grep -rn "getTargetScore" src`; if only its definition in `storage.ts` remains, delete that function too.

- [ ] **Step 3: Typecheck, test, build**

Run: `npx tsc --noEmit -p .` then `npm test` then `npm run build`
Expected: no tsc output; `# pass 35`, `# fail 0`; webpack `compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add src/streak_tracker.ts src/storage.ts
git commit -m "Load the paid rung on page open so reloads cannot pay it twice"
```

---

### Task 5: Version 2.1.2, package, squash and PR

**Files:**
- Modify: `manifest.json` (`version`)
- Modify: `dist/` (rebuilt), `chesskey.zip` (repackaged)

- [ ] **Step 1: Bump the version**

In `manifest.json`, change `"version": "2.1.1"` to `"version": "2.1.2"`.

- [ ] **Step 2: Test and build**

Run: `npm test` then `npm run build`
Expected: `# pass 35`, `# fail 0`; webpack `compiled successfully`; `grep -c "ALREADY PAST" dist/bundle.js` prints `1`.

- [ ] **Step 3: Repackage `chesskey.zip`**

Same contents as the 2.1.1 package (source included because AMO reviews bundled code). Use Windows' `tar.exe`, which writes forward-slash zip paths as AMO requires:

```bash
rm -f chesskey.zip
/c/Windows/System32/tar.exe -a -c -f chesskey.zip .gitignore README.md dist icons manifest.json package.json package-lock.json src test tsconfig.json webpack.config.js
unzip -l chesskey.zip | grep -E "manifest.json|dist/bundle.js$|src/storage_queue.ts"
unzip -p chesskey.zip manifest.json | grep '"version"'
```

Expected: the three paths listed with forward slashes; `"version": "2.1.2"`.

- [ ] **Step 4: Commit**

```bash
git add manifest.json dist chesskey.zip
git commit -m "ChessKey 2.1.2"
```

- [ ] **Step 5: Squash and open the PR (GitHub protocol)**

```bash
git config user.email   # must print mitenko@gmail.com
git fetch
git checkout master && git pull --ff-only && git checkout mitenko/streak-unlock-reliability
git rebase master
git reset --soft $(git merge-base master HEAD)
git commit -m "Fix streak unlocks lost to missed reads, reloads and a save race (2.1.2)" \
  -m "- Award on reaching a rung (40, 45, 50, ...) instead of an exact score read
- Pay a page that opens past the target; store the paid rung so reloads pay nothing
- Serialize every ChessKeyData write through updateData so saves cannot erase an award
- Propagate storage failures instead of writing defaults over real data
- Persistent event log on the Options page for diagnosing missed unlocks
- Bump to 2.1.2"
git push --force-with-lease -u origin mitenko/streak-unlock-reliability
gh pr create --base master --title "Fix streak unlocks lost to missed reads, reloads and a save race (2.1.2)" \
  --body "Implements docs/superpowers/specs/2026-10-16-streak-unlock-reliability-design.md. See the commit message for the change list. Tests: npm test (35 pass)."
```

No Claude attribution in the commit or PR.

- [ ] **Step 6: Hand off the AMO upload**

Stop and ask the user for go-ahead. Uploading publishes to every ChessKey user. On go-ahead, either the user uploads `chesskey.zip` at addons.mozilla.org (Developer Hub → ChessKey → Upload New Version), or, if they provide AMO API keys, run `npx web-ext sign --channel=listed` with those keys.

---

### Task 6: Verify on the real install (after AMO approves 2.1.2)

No code. ChessKey Guard force-installs `latest.xpi`, so Firefox picks 2.1.2 up on its next update check.

- [ ] **Step 1:** `about:addons` → gear → Check for Updates. ChessKey shows 2.1.2.
- [ ] **Step 2:** Options page → Clear the event log. Run a streak past 40 with the page open throughout. Expect in the log: `score 39 -> 40` (or a `JUMP` over it) with `award +10m`, `AWARD WRITTEN`, `award verified`; no `AWARD LOST`, no `MOVED BACKWARDS`, no `AWARD WRITE FAILED`. A game page opens.
- [ ] **Step 3:** Reload `/streak` at 41-44. Expect `paid rung 40 -> 40 … no opening award`; the unlock time does not move.
- [ ] **Step 4:** Reach 45. Expect `award +10m "GO FOR GOLD!"`, `award verified`.
- [ ] **Step 5:** Start a fresh streak. Expect `paid rung 45 -> -1` on the page open at 0; reaching 40 pays again.
