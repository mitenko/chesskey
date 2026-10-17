import { readData, saveStreakState } from './storage';
import { debugLog } from './util';
import { StreakSession, parseScore } from './streak_rules';
import { logEvent, logError, formatTime, watchStorageChanges } from './event_log';

const scoreDivName = "puzzle__side__streak__score text";
var activeScore = -1;
const scoreCheckDelayMillis = 800;
let session: StreakSession | null = null;

// How the score was read while it sat on its current value, reported with the next
// change: many unreadable reads around a skipped score point at the panel rebuild.
let readStats = { since: Date.now(), reads: 0, unreadable: 0 };
let lastUnparseable: string | null = null;

// region Active Score Tracker
async function onScoreChange(curScore: number) {
    //debugLog("[onScoreChange] START");
    try {
        console.log(`[onScoreChange] Current Score [${curScore}]`);

        // A jump of more than one means a score was never read -- if the skipped
        // score was an award rung, that is a missed unlock.
        let prevScore = session!.prevScore;
        let paidBefore = session!.paidRung;
        let skipped = curScore > prevScore + 1 ? ` (JUMP: ${curScore - prevScore - 1} score(s) never read)` : '';
        let award = session!.onScore(curScore);
        let decision = award.minutes > 0 ? `award +${award.minutes}m "${award.reason}"` : 'no award';
        let secondsOnScore = Math.round((Date.now() - readStats.since) / 1000);
        logEvent(`score ${prevScore} -> ${curScore}${skipped}: ${decision}${award.streakEnded ? ', STREAK ENDED' : ''}` +
            ` [${secondsOnScore}s on previous score, ${readStats.reads} reads, ${readStats.unreadable} unreadable]`);
        readStats = { since: Date.now(), reads: 0, unreadable: 0 };

        if (award.streakEnded) {
            console.log("[onScoreChange] STREAK OVER :(");
        }
        if (award.minutes > 0) {
            console.log(`[onScoreChange] ${award.reason}`);
        }

        // Score, paid rung and award go out in one write, so none of them can put
        // another back to an old value.
        let paidAfter = session!.paidRung;
        await saveStreakState(curScore, paidAfter, award.minutes).catch((error) => {
            // The award never reached storage: let the next reading pay it again.
            if (award.minutes > 0) {
                session!.undoAward(paidBefore, paidAfter);
            }
            throw error;
        });

    } catch (error) {
        logError('onScoreChange', error);
    }
    //debugLog("[onScoreChange] DONE");
}

function getScoreContainer() {
   // debugLog('[getScoreContainer] START');
    let scoreDiv = null;
    try {
        //scoreDiv = document.getElementsByClassName(scoreDivContainer)[0];
        scoreDiv = document.getElementById('main-wrap');
    } catch (error) {
        console.log('[getScoreContainer] ' + error.toString());
    }
    let isNotNull = scoreDiv != null;
    //debugLog('[getScoreContainer] DONE [' + isNotNull + ']');
    return scoreDiv;
}

function getScoreDiv() {
    //debugLog('[getScoreDiv] START');
    let scoreDiv = null;
    try {
        scoreDiv = document.getElementsByClassName(scoreDivName);
        if (scoreDiv != null) {
            scoreDiv = scoreDiv[0];
        }
    } catch (error) {
       // console.log('[getScoreDiv] ' + error.toString());
    }
    let isNotNull = scoreDiv != null;
    //debugLog('[getScoreDiv] DONE [' + isNotNull + ']');
    return scoreDiv;
}

// null means the score panel could not be read right now, which is not the same
// thing as a score of 0 -- see parseScore
function getCurScore(): number | null {
    //debugLog('[getCurScore] START');
    try {
        let curValueString = (getScoreDiv() as HTMLElement)?.innerHTML;
        //console.log(`[getCurScore] ${curValueString}`);
        let score = parseScore(curValueString);
        // Text that is there but is not a number means Lichess changed the panel's
        // markup -- every read would fail the same way, so say so once.
        if (score == null && curValueString != null && curValueString != lastUnparseable) {
            lastUnparseable = curValueString;
            logEvent(`score panel text not a number: ${JSON.stringify(curValueString.slice(0, 200))}`);
        }
        return score;
    } catch (error) {
        console.error('[getCurScore] ERROR ' + error.toString());
        return null;
    }
}

// Callback function to execute when mutations are observed
const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            setTimeout(
                function() {
                    let mutatedScore = getCurScore();
                    readStats.reads++;
                    if (mutatedScore == null) {
                        readStats.unreadable++;
                    }
                    //debugLog('[' + mutatedScore + '] [' + activeScore + ']');
                    if (mutatedScore != null && mutatedScore != activeScore) {
                        //debugLog('mutatedScore [' + mutatedScore + ']');
                        //debugLog('activeScore [' + activeScore + ']');
                        activeScore = mutatedScore;
                        onScoreChange(mutatedScore);
                    }
                },
                scoreCheckDelayMillis
            );
        }
    }
}

const targetNode = getScoreContainer();

const config = { attributes: true, childList: true, subtree: true };
// endregion

export async function initStreakTracker() {
    debugLog("[initStreakTracker] START");

    // Baseline off the score this page is actually showing. A streak lives and dies
    // inside one page session, so a score carried over from an earlier session says
    // nothing about whether this streak is still alive.
    let stored;
    try {
        stored = await readData();
    } catch (error) {
        // Running on defaults would pay at the default target and forget the paid
        // rung, so this page does not track the score at all. A reload tries again.
        logEvent('ERROR: settings could not be read, score not tracked on this page -- reload to retry');
        return;
    }
    let targetScore = stored.targetScore;
    let openingScore = getCurScore();
    activeScore = openingScore ?? 0;

    // The paid rung comes from storage so that reopening the page on the restored
    // streak -- a reload, or the redirect from a locked game page -- does not pay it
    // again. An unreadable opening score is passed as null, not 0: see StreakSession.
    session = new StreakSession(openingScore, targetScore, stored.paidRung);

    // The observer only ever fires on a score *change*, so a session that opens with
    // the streak already restored past the target has no later event to pay it out.
    let opening = session.openingAward();
    logEvent(`streak page opened: score ${openingScore ?? 'unreadable'}, target ${targetScore}, ` +
        `paid rung ${stored.paidRung} -> ${session.paidRung}, unlocked until ${formatTime(stored.expireTime)}, ` +
        (opening.minutes > 0 ? `opening award +${opening.minutes}m "${opening.reason}"` : 'no opening award'));

    // Saved even without an award: a new streak resets the stored rung.
    if (openingScore != null) {
        if (opening.minutes > 0) {
            console.log(`[initStreakTracker] ${opening.reason}`);
        }
        let openingSession = session;
        let paidAfter = session.paidRung;
        saveStreakState(openingScore, paidAfter, opening.minutes).catch((error) => {
            // The award never reached storage: let the next reading pay it again.
            if (opening.minutes > 0) {
                openingSession.undoAward(stored.paidRung, paidAfter);
            }
            logError('initStreakTracker', error);
        });
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    if (targetNode == null) {
        logEvent('ERROR: #main-wrap not found, score will not be tracked on this page');
        return;
    }

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    watchStorageChanges();
    window.addEventListener('pagehide', () => {
        logEvent(`leaving streak page at score ${activeScore}`);
    });

    debugLog(`[initStreakTracker] DONE activeScore [${activeScore}] targetScore [${targetScore}]`);
}

