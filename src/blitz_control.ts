import { debugLog } from "./util";

function hideQuickPairingButtons() {
    debugLog('[hideQuickPairingButtons]');
    
    // remove quick pairing buttons
    document.querySelector('[data-id="1+0"]')?.remove();
    document.querySelector('[data-id="2+1"]')?.remove();
    document.querySelector('[data-id="3+0"]')?.remove();
    document.querySelector('[data-id="3+2"]')?.remove();
    document.querySelector('[data-id="5+0"]')?.remove();
}

function addCustomButtonEventHandler() {
    debugLog('[addCustomButtonEventHandler]');
    let customButton = document.querySelector('[data-id="custom"]');
    if (customButton != null) {
        customButton.addEventListener('click', (e:Event) => {
            setTimeout(adjustTimeSliders, 500);
        });
    }
}

const timeDivName = "time-choice range";
const incDivName = "increment-choice range";
function adjustTimeSliders() {
    debugLog('[adjustTimeSliders]');
    let timeDiv = document.getElementsByClassName(timeDivName)[0];
    if (timeDiv != null && timeDiv instanceof HTMLDivElement) {
        //debugLog(`Found ${timeDiv} element`);
        let minutesRange = timeDiv.getElementsByClassName("range")[0];
        if (minutesRange != null && minutesRange instanceof HTMLInputElement) {
            //debugLog(`Found timeRange`);
            minutesRange.min = "9";
        }
    }

    let incDiv = document.getElementsByClassName(incDivName)[0];
    if (incDiv != null && incDiv instanceof HTMLDivElement) {
        //debugLog(`Found ${incDiv} element`);
        let minutesRange = incDiv.getElementsByClassName("range")[0];
        if (minutesRange != null && minutesRange instanceof HTMLInputElement) {
            //debugLog(`Found incrementRange`);
            minutesRange.min = "3";
        }
    }
}

export function initBlitzControl() {
    debugLog('[initBlitzControl]');

    try {
        hideQuickPairingButtons();
        addCustomButtonEventHandler();
        adjustTimeSliders(); // in case the dialog is already open
    } catch (e) {
        debugLog(e);
    }

}