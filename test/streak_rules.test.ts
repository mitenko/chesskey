import test from 'node:test';
import assert from 'node:assert/strict';

import { StreakSession, parseScore, BAD_BEAT_MINUTES, TARGET_MINUTES } from '../src/streak_rules.ts';

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
