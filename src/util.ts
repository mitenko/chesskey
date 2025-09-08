export enum Mode {
    TRACK_STREAK = "TRACK_STREAK",
    CHECK_ACTIVE_TIME = "CHECK_ACTIVE_TIME",
}

export function getMode() {
    let url = window.location.href;
    debugLog(`[getMode] for ${url}`);
    let determinedMode = Mode.CHECK_ACTIVE_TIME; // default

    let streakRegEx = new RegExp('.*streak.*');
    let timeCheckRegEx = new RegExp('.*(pool|any|tournament).*');

    if(streakRegEx.test(url)) {
        determinedMode = Mode.TRACK_STREAK;
    } else {
        determinedMode = Mode.CHECK_ACTIVE_TIME;
    } 

    return determinedMode;
}

export function getInputElement(id: string) {
    let element = document.getElementById(id);
    return (<HTMLInputElement>element!);
}

export function debugLog(msg: string) {
    // disable for production release
    //console.log(msg);
    
    let htmlLog = document.getElementById("debug-log-output");
    if (htmlLog != null) {
        htmlLog.innerHTML = htmlLog.innerHTML + " | " + msg;
    }
}
