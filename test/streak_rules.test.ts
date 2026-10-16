import test from 'node:test';
import assert from 'node:assert/strict';

import { StreakSession, parseScore, BAD_BEAT_MINUTES, TARGET_MINUTES, NO_RUNG_PAID } from '../src/streak_rules.ts';

const TARGET = 40;

test('an unreadable score panel reads as null, not as a score of zero', () => {
    assert.equal(parseScore(undefined), null, 'panel missing between puzzles');
    assert.equal(parseScore(null), null);
    assert.equal(parseScore(''), null);
    assert.equal(parseScore('   '), null);
    assert.equal(parseScore('&nbsp;'), null);
});

test('a readable score panel parses to its number', () => {
    assert.equal(parseScore('0'), 0);
    assert.equal(parseScore('7'), 7);
    assert.equal(parseScore('40'), 40);
    assert.equal(parseScore(' 12 '), 12);
});

// The bug this suite was written for: game time was handed out for solving a single
// easy puzzle at the start of a new streak, because the "did the streak just end?"
// check compared the live score against a score persisted from an earlier page session.
test('a fresh page session does not treat the first solved puzzle as a lost streak', () => {
    // A new streak page always renders score 0, whatever the user scored yesterday.
    const session = new StreakSession(0, TARGET);

    const award = session.onScore(1);

    assert.equal(award.streakEnded, false);
    assert.equal(award.minutes, 0, 'solving one low-level puzzle must not unlock games');
});

test('a whole new streak stays locked until the target is reached', () => {
    const session = new StreakSession(0, TARGET);

    for (let score = 1; score < TARGET; score++) {
        assert.equal(session.onScore(score).minutes, 0, `unexpected award at score ${score}`);
    }
});

test('losing the streak within five of the target is a bad beat', () => {
    const session = new StreakSession(0, TARGET);
    for (const score of [1, 2, 35, 36]) session.onScore(score);

    const award = session.onScore(0); // streak collapses, board resets to 0

    assert.equal(award.streakEnded, true);
    assert.equal(award.minutes, BAD_BEAT_MINUTES);
});

test('losing the streak far from the target awards nothing', () => {
    const session = new StreakSession(0, TARGET);
    for (const score of [1, 2, 10]) session.onScore(score);

    const award = session.onScore(0);

    assert.equal(award.streakEnded, true);
    assert.equal(award.minutes, 0);
});

test('reaching the target awards time exactly once', () => {
    const session = new StreakSession(0, TARGET);
    for (let score = 1; score < TARGET; score++) session.onScore(score);

    assert.equal(session.onScore(TARGET).minutes, TARGET_MINUTES);
    // score can be re-read as the same value when the page re-renders
    assert.equal(session.onScore(TARGET).minutes, 0);
});

test('every five puzzles past the target awards more time', () => {
    const session = new StreakSession(TARGET, TARGET);
    // Opening on the target owes the target award, and settling it here is what makes
    // the scores that follow bonus-interval territory rather than a second payout.
    assert.equal(session.openingAward().minutes, TARGET_MINUTES);

    assert.equal(session.onScore(41).minutes, 0);
    assert.equal(session.onScore(44).minutes, 0);
    assert.equal(session.onScore(45).minutes, TARGET_MINUTES);
});

test('a bad beat is awarded once, not on every score change afterwards', () => {
    const session = new StreakSession(0, TARGET);
    for (const score of [1, 36]) session.onScore(score);

    assert.equal(session.onScore(0).minutes, BAD_BEAT_MINUTES);
    assert.equal(session.onScore(1).minutes, 0, 'new streak after a bad beat must start locked');
});

// Guards the exact sequence from the field report: earn time, leave to play a game,
// come back to a fresh streak page, solve one puzzle.
test('returning to the streak page after a successful streak starts locked', () => {
    const first = new StreakSession(0, TARGET);
    for (let score = 1; score <= TARGET; score++) first.onScore(score);
    assert.equal(first.prevScore, TARGET);

    // User leaves and comes back; the page is re-rendered from scratch at score 0.
    const second = new StreakSession(0, TARGET);

    assert.equal(second.onScore(1).minutes, 0);
    assert.equal(second.onScore(2).minutes, 0);
});

// The bug this block was written for: a streak that is demonstrably past the target
// left games locked, because the target award only fired on an exact match with the
// target score and only ever ran on a score *change*.
test('a score reading that jumps over the target still unlocks games', () => {
    const session = new StreakSession(0, TARGET);
    for (let score = 1; score < TARGET; score++) session.onScore(score);

    // The observer is debounced, so a fast solve can be read after the panel has
    // already moved past the target -- the reading at exactly TARGET never happens.
    assert.equal(session.onScore(TARGET + 1).minutes, TARGET_MINUTES);
});

test('a page session that opens past the target unlocks games', () => {
    // Lichess restores an in-progress streak across a page load, so the extension can
    // start up with the score already showing 41. Those puzzles were solved.
    const session = new StreakSession(41, TARGET);

    assert.equal(session.openingAward().minutes, TARGET_MINUTES);
});

test('a page session that opens below the target stays locked', () => {
    const session = new StreakSession(12, TARGET);

    assert.equal(session.openingAward().minutes, 0);
    assert.equal(session.openingAward().streakEnded, false);
});

test('an opening award is not paid a second time by a later score change', () => {
    const session = new StreakSession(41, TARGET);
    assert.equal(session.openingAward().minutes, TARGET_MINUTES);

    assert.equal(session.onScore(42).minutes, 0, 'target already paid for this session');
    assert.equal(session.onScore(45).minutes, TARGET_MINUTES, 'bonus interval still applies');
});

// The award ladder is the target and then every BONUS_INTERVAL puzzles past it:
// 40, 45, 50, 55. Each rung pays when it is *crossed*, because the debounced score
// panel can be read once the streak has already moved past the exact number.
test('a score reading that jumps over a bonus rung still unlocks games', () => {
    const session = new StreakSession(0, TARGET);
    for (let score = 1; score <= 44; score++) session.onScore(score);

    assert.equal(session.onScore(46).minutes, TARGET_MINUTES, 'the 45 rung was crossed');
});

test('time is awarded on the target and every fifth puzzle past it, and nowhere else', () => {
    const session = new StreakSession(0, TARGET);
    const paid: number[] = [];

    for (let score = 1; score <= 57; score++) {
        if (session.onScore(score).minutes > 0) paid.push(score);
    }

    assert.deepEqual(paid, [40, 45, 50, 55]);
});

test('a page session opening several rungs past the target pays once', () => {
    const session = new StreakSession(52, TARGET);

    assert.equal(session.openingAward().minutes, TARGET_MINUTES);
    assert.equal(session.onScore(53).minutes, 0);
    assert.equal(session.onScore(54).minutes, 0);
    assert.equal(session.onScore(55).minutes, TARGET_MINUTES, 'next rung up still pays');
});

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

// Review fix: a rung is advanced in memory before its save. If that save fails and
// the rung stays advanced, the next reading writes the paid rung without the unlock
// and the award is lost for good.
test('an award whose save failed is paid again on the next reading', () => {
    const session = new StreakSession(39, TARGET);
    const before = session.paidRung;
    assert.equal(session.onScore(40).minutes, TARGET_MINUTES);

    session.undoAward(before, 40);

    assert.equal(session.paidRung, before);
    assert.equal(session.onScore(41).minutes, TARGET_MINUTES);
});

test('undoing a failed award leaves a rung set by a later reading alone', () => {
    const session = new StreakSession(39, TARGET);
    session.onScore(40);
    session.onScore(46);

    session.undoAward(NO_RUNG_PAID, 40);

    assert.equal(session.paidRung, 45, 'the later reading paid 45; its save decides');
});
