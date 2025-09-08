import { Mode, debugLog, getMode } from './util';
import { initStreakTracker } from './streak_tracker';
import { checkActiveTime } from './active_time_check';
import './styles/main.scss';
import { getDisableBlitz } from './storage';
import { initOptionsIfAble } from './options';
import { initBlitzControl } from './blitz_control';

try {
    console.log('TODO: curScore storage');
    console.log('TODO: time of day as an option');

    let mode = getMode();
    debugLog(`mode [${mode}]`);
    switch (mode as Mode) {
        case Mode.TRACK_STREAK:
            initStreakTracker();
            break;
        case Mode.CHECK_ACTIVE_TIME:
            checkActiveTime();
            break;
    }

    initOptionsIfAble();

    getDisableBlitz().then((disableBlitz) => {
        if (disableBlitz) {
            initBlitzControl();
        }
    });

} catch (error) {
    console.error(error);
}