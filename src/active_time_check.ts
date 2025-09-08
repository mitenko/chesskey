import { debugLog } from "./util";
import { checkHasActiveTime } from "./storage";

export async function checkActiveTime() {
    try {
        debugLog('[checkActiveTime] START');

        let now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();

        if (hours >= 6 && hours < 17) {
            let hasActiveTime: boolean = await checkHasActiveTime();
            console.log('[checkActiveTime] hasActiveTime [' + hasActiveTime + ']');

            let tournamentUrlRegex = new RegExp('.*tournament.*');

            // if is tournament page redirect always
            if (!hasActiveTime || tournamentUrlRegex.test(window.location.href)) {
                debugLog('[checkActiveTime] redirecting');
                window.location.replace("https://lichess.org/streak");
            } else {
                debugLog('[checkActiveTime] proceed');
            }

        }

    } catch (error) {
        console.error(`[checkActiveTime] ${error.toString()}`);
    } finally {
        debugLog('[checkActiveTime] DONE');
    }
}