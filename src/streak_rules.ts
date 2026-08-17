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
    targetAwarded: boolean;

    constructor(startingScore: number, targetScore: number) {
        this.prevScore = startingScore;
        this.targetScore = targetScore;
        this.targetAwarded = false;
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

        if (curScore == this.targetScore && !this.targetAwarded) {
            if (TARGET_MINUTES >= minutes) {
                minutes = TARGET_MINUTES;
                reason = 'HIT TARGET! KEEP GOING!';
            }
            this.targetAwarded = true;
        }

        if (curScore >= this.targetScore && curScore % BONUS_INTERVAL == 0) {
            if (TARGET_MINUTES > minutes) {
                minutes = TARGET_MINUTES;
                reason = 'GO FOR GOLD!';
            }
        }

        this.prevScore = curScore;
        return { streakEnded: streakEnded, minutes: minutes, reason: reason };
    }
}
