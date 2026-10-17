export interface StreakAward {
    streakEnded: boolean;
    minutes: number;
    reason: string;
}

/**
 * Reads the score out of the streak panel's text.
 *
 * Returns null when there is nothing to read: the panel is torn down and rebuilt
 * between puzzles, and treating that gap as a score of 0 looks exactly like a
 * collapsed streak.
 */
export function parseScore(raw: string | null | undefined): number | null {
    if (raw == null) {
        return null;
    }
    let parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
}

export const BAD_BEAT_WINDOW = 5;
export const BAD_BEAT_MINUTES = 5;
export const TARGET_MINUTES = 10;
export const BONUS_INTERVAL = 5;

/** No rung of the award ladder has been paid for the current streak. */
export const NO_RUNG_PAID = -1;

/**
 * Scoring rules for one continuous run of the Lichess streak page.
 *
 * The previous score is held per session on purpose. A score lower than the one
 * before it only means "the streak just ended" when both readings come from the
 * same page session: a new streak page always renders 0, so comparing against a
 * score carried over from an earlier session made the first puzzle of a new
 * streak look like a collapse and handed out bad beat time for solving one easy
 * puzzle.
 */
export class StreakSession {
    prevScore: number;
    targetScore: number;
    /**
     * The highest rung already paid for the streak on screen. Stored with the award,
     * so that a reload on a paid rung -- the page reopens on the restored streak --
     * does not pay it again.
     */
    paidRung: number;
    private openingScoreKnown: boolean;

    /**
     * startingScore is null when the score panel could not be read as the page
     * opened. That is not a score of 0: a 0 would look like a new streak and wipe
     * the stored paidRung. The first real reading then decides.
     */
    constructor(startingScore: number | null, targetScore: number, paidRung: number = NO_RUNG_PAID) {
        this.openingScoreKnown = startingScore != null;
        this.prevScore = startingScore ?? 0;
        this.targetScore = targetScore;
        this.paidRung = paidRung;
    }

    /**
     * Puts the paid rung back after the save of the award for `awardedRung` failed, so
     * the next reading pays it again. Left alone if a later reading already moved the
     * paid rung on: that reading's own save decides what is stored.
     */
    undoAward(previousPaidRung: number, awardedRung: number) {
        if (this.paidRung == awardedRung) {
            this.paidRung = previousPaidRung;
        }
    }

    /**
     * A streak only climbs or ends, so a reading below the paid rung means the streak
     * that earned it is over, and a new streak must be able to earn it again.
     */
    private forgetEndedStreak(score: number) {
        if (score < this.paidRung) {
            this.paidRung = NO_RUNG_PAID;
        }
    }

    /**
     * The highest rung of the award ladder a score has reached -- the target, then
     * every BONUS_INTERVAL puzzles past it: 40, 45, 50, 55. Scores between two rungs
     * belong to the lower one, so 41 through 44 all sit on the 40 rung.
     *
     * A rung is paid for being *reached*, not for being read exactly. The score panel
     * is only sampled after a debounce and is torn down between puzzles, so a fast
     * solve is regularly read once the streak has already moved past the rung's
     * number; a page session can also open with the streak restored past several. An
     * exact-match check left those puzzles unpaid and the games locked.
     */
    private rungFor(score: number): number {
        if (score < this.targetScore) {
            return NO_RUNG_PAID;
        }
        let rungsPast = Math.floor((score - this.targetScore) / BONUS_INTERVAL);
        return this.targetScore + (rungsPast * BONUS_INTERVAL);
    }

    /**
     * The award owed for the score the page opened on.
     *
     * A session can start with the target already passed, and no later score change
     * will pay those puzzles out, so the opening reading is settled once here. No bad
     * beat check: with a single reading there is nothing to have dropped from.
     */
    openingAward(): StreakAward {
        if (!this.openingScoreKnown) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.forgetEndedStreak(this.prevScore);

        let rung = this.rungFor(this.prevScore);
        if (rung <= this.paidRung) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.paidRung = rung;
        return { streakEnded: false, minutes: TARGET_MINUTES, reason: `ALREADY PAST ${rung}! KEEP GOING!` };
    }

    onScore(curScore: number): StreakAward {
        // The page re-renders the score panel between puzzles, so the same score
        // gets read back more than once. Only an actual change can earn time.
        if (curScore == this.prevScore) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }

        let streakEnded = curScore < this.prevScore;
        let minutes = 0;
        let reason = '';

        if (streakEnded && this.prevScore >= this.targetScore - BAD_BEAT_WINDOW) {
            minutes = BAD_BEAT_MINUTES;
            reason = 'BAD BEAT. Take a break';
        }

        this.forgetEndedStreak(curScore);

        // One award per reading: a jump over several rungs pays once, for the highest.
        // Awards reset the unlock rather than add to it, so paying each skipped rung
        // would grant no more time.
        let rung = this.rungFor(curScore);
        if (rung > this.paidRung) {
            if (TARGET_MINUTES >= minutes) {
                minutes = TARGET_MINUTES;
                reason = rung == this.targetScore ? 'HIT TARGET! KEEP GOING!' : 'GO FOR GOLD!';
            }
            this.paidRung = rung;
        }

        this.prevScore = curScore;
        return { streakEnded: streakEnded, minutes: minutes, reason: reason };
    }
}
