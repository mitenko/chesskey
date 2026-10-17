import { getInputElement } from './util';
import { ChessKeyData } from './data';
import { getData, updateData, addActiveMinutes } from './storage';
import { debugLog } from './util';
import { readEventLog, clearEventLog, formatTime, logEvent } from './event_log';

async function showEventLog() {
    let entries = await readEventLog();
    let lines = entries.slice().reverse().map((e) => `${formatTime(e.time)}  ${e.page}  ${e.msg}`);
    document.getElementById('event-log')!.textContent = lines.length > 0 ? lines.join('\n') : '(empty)';
}

function initEventLogView() {
    showEventLog();
    getInputElement('event-log-refresh').addEventListener('click', showEventLog);
    getInputElement('event-log-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('event-log')!.textContent ?? '');
    });
    getInputElement('event-log-clear').addEventListener('click', async () => {
        await clearEventLog();
        showEventLog();
    });
}

async function saveOptions() {
    try {
        debugLog('[saveOptions]');

        let targetPuzzle = parseInt(getInputElement('target-puzzle').value);
        let disableBlitz = getInputElement('disable-blitz').checked;

        // An empty or non-numeric target would be saved as null, and a null target
        // pays on every new streak page.
        if (!Number.isInteger(targetPuzzle) || targetPuzzle < 1) {
            logEvent(`options NOT saved: target "${getInputElement('target-puzzle').value}" is not a whole number of at least 1`);
            return;
        }

        await updateData((data) => {
            logEvent(`options saved: target ${data.targetScore} -> ${targetPuzzle}, disableBlitz ${data.disableBlitz} -> ${disableBlitz}`);
            data.targetScore = targetPuzzle;
            data.disableBlitz = disableBlitz;
        });
    } catch (e) {
        debugLog(e);
    }
}

async function loadOptions() {
    try {
        debugLog('[loadOptions]');

        let data: ChessKeyData = await getData();

        getInputElement('target-puzzle').value = data.targetScore.toString();
        getInputElement('disable-blitz').checked = data.disableBlitz;
    } catch (e) {
        debugLog(e);
    }
}

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

export function initOptionsIfAble() {
    debugLog('[initOptions]');
    if (document.getElementById('target-puzzle') != null && document.getElementById('disable-blitz') != null) {
        loadOptions();
        getInputElement('save').addEventListener('click', saveOptions);
        getInputElement('break').addEventListener('click', breakOptions);
        initEventLogView();
    } else {
        debugLog('[initOptions] no options to init');
    }
}

