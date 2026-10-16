import { browser } from 'webextension-polyfill-ts';
import { debugLog } from './util';
import { ChessKeyData } from './data';
import { createDataStore, retry } from './storage_queue';
import { logEvent, logError, formatTime } from './event_log';

const AWARD_VERIFY_DELAY_MILLIS = 3000;
const READ_ATTEMPTS = 3;
const READ_RETRY_DELAY_MILLIS = 500;

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
 * For decisions that feed a write, such as the streak page's target and paid rung.
 * Retries a failing read, then rejects: falling back to the defaults here would pay
 * at the default target and forget the paid rung.
 */
export async function readData(): Promise<ChessKeyData> {
    try {
        return await retry(() => dataStore.read(), READ_ATTEMPTS, READ_RETRY_DELAY_MILLIS);
    } catch (error) {
        logError('readData', error);
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
