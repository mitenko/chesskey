import { getTargetScore, addActiveMinutes } from './storage';
import { debugLog } from './util';

const scoreDivName = "puzzle__side__streak__score text";
var activeScore = -1;
const scoreCheckDelayMillis = 800;
let targetScore = 30;
let targetTimeAdded = false;

// region Active Score Tracker
function onScoreChange() {
    //debugLog("[onScoreChange] START");
    try {
        let curScore = getCurScore();
        console.log(`[onScoreChange] Current Score [${curScore}]`);
        let runningScore = curScore;

        if (curScore == targetScore && targetTimeAdded == false) {
            addActiveMinutes(10);
            console.log("[onScoreChange] HIT TARGET! KEEP GOING!");
            targetTimeAdded = true;
        }

        if (curScore >= targetScore && curScore % 5 == 0) {
            addActiveMinutes(10);
            console.log("[onScoreChange] GO FOR GOLD!");
        }

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

function getCurScore() {
    //debugLog('[getCurScore] START');
    let getCurScoreResult = 0;
    try {
        let curValueString = (getScoreDiv() as HTMLElement)?.innerHTML;
        //console.log(`[getCurScore] ${curValueString}`);
        getCurScoreResult = parseInt(curValueString);
    } catch (error) {
        console.error('[getCurScore] ' + error.toString());
    }
    //debugLog('[getCurScore] DONE [' + getCurScoreResult + ']');
    return getCurScoreResult;
}

// Callback function to execute when mutations are observed
const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            setTimeout(
                function() {
                    let mutatedScore = getCurScore();
                    //debugLog('[' + mutatedScore + '] [' + activeScore + ']');
                    if (mutatedScore != activeScore) {
                        //debugLog('mutatedScore [' + mutatedScore + ']');
                        //debugLog('activeScore [' + activeScore + ']');
                        activeScore = mutatedScore;
                        onScoreChange();
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

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    activeScore = getCurScore();
    targetScore = await getTargetScore();

    debugLog(`[initStreakTracker] DONE activeScore [${activeScore}] targetScore [${targetScore}]`);
}

