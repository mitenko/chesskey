import { debugLog } from "./util";
import { NO_RUNG_PAID } from "./streak_rules";

export class ChessKeyData {
    targetScore: number;
    expireTime: number;
    disableBlitz: boolean;
    currentScore: number;
    paidRung: number;

    constructor(
        targetScore?: number,
        expireTime?: number,
        disableBlitz?: boolean,
        currentScore?: number,
        paidRung?: number,
    ) {
        this.targetScore = targetScore ?? 40;
        this.expireTime = expireTime ?? 0;
        this.disableBlitz = disableBlitz ?? false;
        this.currentScore = currentScore ?? 0;
        this.paidRung = paidRung ?? NO_RUNG_PAID;
    }

    dumpToLog() {
        debugLog(`[dumpToLog] currentScore [${this.currentScore}]`);
        debugLog(`[dumpToLog] paidRung [${this.paidRung}]`);
        debugLog(`[dumpToLog] targetScore [${this.targetScore}]`);
        debugLog(`[dumpToLog] expireTime [${this.expireTime}]`);
        debugLog(`[dumpToLog] disableBlitz [${this.disableBlitz}]`);
    }
};