import { getInputElement } from './util';
import { ChessKeyData } from './data';
import { getData, setData } from './storage';
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

export function initOptionsIfAble() {
    debugLog('[initOptions]');
    if (document.getElementById('target-puzzle') != null && document.getElementById('disable-blitz') != null) {
        loadOptions();
        getInputElement('save').addEventListener('click', saveOptions);
    } else {
        debugLog('[initOptions] no options to init');
    }
}

