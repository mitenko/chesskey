import { Mode, debugLog, getMode } from './util';
import { initStreakTracker } from './streak_tracker';
import { checkActiveTime } from './active_time_check';
import './styles/main.scss';
import { getDisableBlitz } from './storage';
import { initOptionsIfAble } from './options';
import { initBlitzControl } from './blitz_control';
import { logEvent } from './event_log';
import { browser } from 'webextension-polyfill-ts';

try {
    console.log('TODO: time of day as an option');

    let mode = getMode();
    debugLog(`mode [${mode}]`);
    logEvent(`ChessKey ${browser.runtime.getManifest().version} loaded, mode ${mode}`);
    switch (mode as Mode) {
        case Mode.TRACK_STREAK:
            initStreakTracker();
            break;
        case Mode.CHECK_ACTIVE_TIME:
            checkActiveTime();
            break;
        case Mode.OPTIONS:
            initOptionsIfAble();
            break;
    }

    getDisableBlitz().then((disableBlitz) => {
        if (disableBlitz) {
            initBlitzControl();
        }
    });

} catch (error) {
    console.error(error);
}