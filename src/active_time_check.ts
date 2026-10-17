import { debugLog } from "./util";
import { checkHasActiveTime } from "./storage";
import { ChessKeyData } from "./data";
import { getData } from './storage';
import { logEvent, logError, formatTime } from './event_log';

export async function checkActiveTime() {
    try {
        debugLog('[checkActiveTime] START');

        let now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let data : ChessKeyData = await getData();

        if (hours >= 6 && hours < 17) {
            let hasActiveTime: boolean = await checkHasActiveTime();
            console.log('[checkActiveTime] hasActiveTime [' + hasActiveTime + ']');

            let tournamentUrlRegex = new RegExp('.*tournament.*');

            // if is tournament page redirect always
            if (!hasActiveTime ||
                (data.disableBlitz && tournamentUrlRegex.test(window.location.href))
            ) {
                logEvent(`game page LOCKED, redirecting to /streak: unlocked until ${formatTime(data.expireTime)}` +
                    `, hasActiveTime ${hasActiveTime}, last stored score ${data.currentScore}`);
                debugLog('[checkActiveTime] redirecting');
                window.location.replace("https://lichess.org/streak");
            } else {
                logEvent(`game page unlocked until ${formatTime(data.expireTime)}`);
                debugLog('[checkActiveTime] proceed');
            }

        } else {
            logEvent(`game page open outside locked hours (6:00-17:00)`);
        }

    } catch (error) {
        logError('checkActiveTime', error);
    } finally {
        debugLog('[checkActiveTime] DONE');
    }
}