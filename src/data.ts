import { debugLog } from "./util";

export class ChessKeyData {
    targetScore: number;
    expireTime: number;
    disableBlitz: boolean;
    currentScore: number;

    constructor(
        targetScore?: number,
        expireTime?: number,
        disableBlitz?: boolean,
        currentScore?: number,
    ) {
        this.targetScore = targetScore ?? 40;
        this.expireTime = expireTime ?? 0;
        this.disableBlitz = disableBlitz ?? false;
        this.currentScore = currentScore ?? 0;
    }

    dumpToLog() {
        debugLog(`[dumpToLog] targetScore [${this.targetScore}]`);
        debugLog(`[dumpToLog] expireTime [${this.expireTime}]`);
        debugLog(`[dumpToLog] disableBlitz [${this.disableBlitz}]`);
    }
};