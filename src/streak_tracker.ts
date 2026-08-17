import { getTargetScore, addActiveMinutes } from './storage';
import { debugLog } from './util';
import { getData, setData } from './storage';
import { ChessKeyData } from './data';
import { StreakSession, parseScore } from './streak_rules';

const scoreDivName = "puzzle__side__streak__score text";
var activeScore = -1;
const scoreCheckDelayMillis = 800;
let session: StreakSession | null = null;

// region Active Score Tracker
async function onScoreChange(curScore: number) {
    //debugLog("[onScoreChange] START");
    try {
        console.log(`[onScoreChange] Current Score [${curScore}]`);

        let award = session!.onScore(curScore);
        if (award.streakEnded) {
            console.log("[onScoreChange] STREAK OVER :(");
        }
        if (award.minutes > 0) {
            console.log(`[onScoreChange] ${award.reason}`);
            addActiveMinutes(award.minutes);
        }

        // keep the stored score in step with the page for the options/debug view
        let data: ChessKeyData = await getData();
        data.currentScore = curScore;
        await setData(data);

    } catch (error) {
        console.log(`[onScoreChange] ${error.toString()}`);
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
        return parseScore(curValueString);
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
    let targetScore = await getTargetScore();
    activeScore = getCurScore() ?? 0;
    session = new StreakSession(activeScore, targetScore);

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    debugLog(`[initStreakTracker] DONE activeScore [${activeScore}] targetScore [${targetScore}]`);
}

