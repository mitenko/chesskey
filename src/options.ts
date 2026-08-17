import { getInputElement } from './util';
import { ChessKeyData } from './data';
import { getData, setData, addActiveMinutes } from './storage';
import { debugLog } from './util';

async function saveOptions() {
    try {
        debugLog('[saveOptions]');

        let targetPuzzle = parseInt(getInputElement('target-puzzle').value);
        let disableBlitz = getInputElement('disable-blitz').checked;

        let data: ChessKeyData = await getData();

        data.targetScore = targetPuzzle;
        data.disableBlitz = disableBlitz;

        setData(data);
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
        let data: ChessKeyData = await getData();

        let expireTime = data.expireTime;
        let curTime = Date.now();

        // if the expiretime was more than 90 minutes ago
        if (curTime - expireTime > 90 * 60 * 1000) {
             addActiveMinutes(5);
        } else {
            let timeToBreak = 90 - Math.round((curTime - expireTime)/60000);
            console.log(`[breakOptions] time to next break [${timeToBreak}m]`);
        }

        setData(data);
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
    } else {
        debugLog('[initOptions] no options to init');
    }
}

