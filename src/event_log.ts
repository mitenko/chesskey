import { browser } from 'webextension-polyfill-ts';
import { createLogStore, LogEntry } from './storage_queue';

/**
 * A persistent record of what the extension saw and decided, for working out after
 * the fact why games did or did not unlock.
 *
 * The console is no use for that: it is cleared on every page load, and a missed
 * unlock is exactly what triggers one -- the active time check bounces the game page
 * back to /streak. This log lives in storage.local and survives reloads. Read it from
 * the Options page.
 */
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

export function logError(where: string, error: any) {
    console.error(`[${where}] ${error}`);
    logEvent(`ERROR in ${where}: ${error?.stack ?? error}`);
}

/**
 * Records every change to the unlock expiry and the target, whoever made it, with the
 * value before and after. An award that is written and then quietly put back shows
 * up here as an expiry that moves forward and then straight back.
 */
export function watchStorageChanges() {
    browser.storage.onChanged.addListener((changes, area) => {
        let change = changes['chessKeyData'];
        if (area != 'sync' || change == null) {
            return;
        }
        let before = change.oldValue ?? {};
        let after = change.newValue ?? {};
        if (before.expireTime != after.expireTime) {
            let direction = (after.expireTime ?? 0) < (before.expireTime ?? 0) ? ' (MOVED BACKWARDS)' : '';
            logEvent(`stored unlock changed ${formatTime(before.expireTime ?? 0)} -> ${formatTime(after.expireTime ?? 0)}${direction}`);
        }
        if (before.targetScore != after.targetScore) {
            logEvent(`stored target changed ${before.targetScore} -> ${after.targetScore}`);
        }
    });
}

export function readEventLog(): Promise<LogEntry[]> {
    return logStore.read();
}

export function clearEventLog(): Promise<void> {
    return logStore.clear();
}

export function formatTime(millis: number): string {
    return millis > 0 ? new Date(millis).toLocaleString() : 'never';
}
