import { browser } from 'webextension-polyfill-ts';
import { debugLog } from './util';
import { ChessKeyData } from './data';

export function setData(data: ChessKeyData) {
    //debugLog(`[setData]`);
    //data.dumpToLog();
    browser.storage.sync.set({"chessKeyData" : data});
}

export async function getData() {
    return new Promise<ChessKeyData> (async function(resolve) {
        //debugLog(`[getData]`);
        let chessKeyData: ChessKeyData = new ChessKeyData();
        try {
            let chessKeyDataStore = await browser.storage.sync.get("chessKeyData");
            //let str = JSON.stringify(chessKeyDataStore);
            //debugLog(str);
            if (chessKeyDataStore?.chessKeyData != null) {
                //debugLog('data retrived');
                chessKeyData = chessKeyDataStore.chessKeyData;
            }
        } catch (e) {
            console.error(e);
        }
        resolve(chessKeyData);
    });
}

export async function getTargetScore() {
    return new Promise<number> (async function(resolve) {
        let chessKeyData = await getData();
        let targetScore = chessKeyData.targetScore;
        return resolve(targetScore);
    });
}

export async function getDisableBlitz() {
    return new Promise<boolean> (async function(resolve) {
        let chessKeyData = await getData();
        let disableBlitz = chessKeyData.disableBlitz;
        return resolve(disableBlitz);
    });
}

export function addActiveMinutes(minutes: number) {
    let curTime = Date.now();
    let expireTime = curTime + (minutes * 60 * 1000);
    debugLog(`[addActiveMinutes] Adding ${minutes} minutes`);
    getData().then((chessKeyData) => {
        chessKeyData.expireTime = expireTime;
        setData(chessKeyData);
    });
}

export async function checkHasActiveTime() {
    return new Promise<boolean> (async function(resolve) {
        let hasActiveTime = false;
        try {
            //let expireTimeStore = await browser.storage.sync.get("expireTime") || 0;
            let chessKeyData = await getData();
            let expireTime = chessKeyData.expireTime;

            let curTime = Date.now();
            debugLog(`[checkHasActiveTime] expireTime [${expireTime}] >= curTime [${curTime}]`);
            hasActiveTime = expireTime >= curTime;
        } catch (e) {
            console.error(e);
        }
        return resolve(hasActiveTime);
    });
}