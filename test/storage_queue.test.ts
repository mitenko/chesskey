import test from 'node:test';
import assert from 'node:assert/strict';

import { createDataStore, createLogStore, retry } from '../src/storage_queue.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A storage area whose every call takes a few milliseconds, like the real one, so
// that overlapping reads and writes really do overlap.
function slowArea() {
    const items: { [key: string]: any } = {};
    const area = {
        items,
        failNextGet: false,
        failNextSet: false,
        async get(key: string) {
            await sleep(5);
            if (area.failNextGet) {
                area.failNextGet = false;
                throw new Error('get failed');
            }
            return items[key] === undefined ? {} : { [key]: structuredClone(items[key]) };
        },
        async set(values: { [key: string]: any }) {
            await sleep(5);
            if (area.failNextSet) {
                area.failNextSet = false;
                throw new Error('set failed');
            }
            for (const k of Object.keys(values)) {
                items[k] = structuredClone(values[k]);
            }
        },
        async remove(key: string) {
            await sleep(5);
            delete items[key];
        },
    };
    return area;
}

class Data {
    expireTime = 0;
    currentScore = 0;
    paidRung = -1;
}

// The bug this suite was written for: the award save and the score save each read
// the whole object, changed one field and wrote the whole object back, so whichever
// landed last put the other's field back to its old value -- erasing the unlock.
test('two writes issued back to back both survive', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    await Promise.all([
        store.update((d) => { d.expireTime = 1000; }),
        store.update((d) => { d.currentScore = 41; }),
    ]);

    const saved = await store.read();
    assert.equal(saved.expireTime, 1000, 'the award is still there');
    assert.equal(saved.currentScore, 41);
});

test('updates apply in call order', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    await Promise.all([
        store.update((d) => { d.paidRung = 40; d.currentScore = 41; }),
        store.update((d) => { d.paidRung = -1; d.currentScore = 0; }),
        store.update((d) => { d.paidRung = 45; d.currentScore = 46; }),
    ]);

    const saved = await store.read();
    assert.equal(saved.paidRung, 45);
    assert.equal(saved.currentScore, 46);
});

test('data saved by an older version gets defaults for fields it never had', async () => {
    const area = slowArea();
    area.items.data = { expireTime: 5, currentScore: 3 };
    const store = createDataStore(area, 'data', () => new Data());

    const saved = await store.read();
    assert.equal(saved.paidRung, -1);
    assert.equal(saved.expireTime, 5);
    assert.equal(saved.currentScore, 3);
});

test('nothing stored yet reads as the defaults', async () => {
    const store = createDataStore(slowArea(), 'data', () => new Data());

    assert.deepEqual({ ...(await store.read()) }, { expireTime: 0, currentScore: 0, paidRung: -1 });
});

test('a failed read rejects and writes nothing', async () => {
    const area = slowArea();
    area.items.data = { expireTime: 5, currentScore: 3, paidRung: 40 };
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextGet = true;
    await assert.rejects(store.update((d) => { d.currentScore = 4; }), /get failed/);
    assert.equal(area.items.data.expireTime, 5, 'defaults were not written over the real data');
    assert.equal(area.items.data.paidRung, 40);
});

test('a failed write rejects', async () => {
    const area = slowArea();
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextSet = true;
    await assert.rejects(store.update((d) => { d.expireTime = 9; }), /set failed/);
});

test('a failed update does not block the next one', async () => {
    const area = slowArea();
    const store = createDataStore(area, 'data', () => new Data());

    area.failNextSet = true;
    const failing = store.update((d) => { d.expireTime = 1; });
    const next = store.update((d) => { d.expireTime = 7; });

    await assert.rejects(failing);
    await next;
    assert.equal((await store.read()).expireTime, 7);
});

const entry = (msg: string) => ({ time: 0, page: '/streak', msg: msg });

test('Clear issued while a log write is in flight leaves only later entries', async () => {
    const store = createLogStore(slowArea(), 'log', 10);

    const before = store.append(entry('before'));
    const cleared = store.clear();
    const after = store.append(entry('after'));
    await Promise.all([before, cleared, after]);

    assert.deepEqual((await store.read()).map((e) => e.msg), ['after']);
});

test('the log keeps only the newest entries', async () => {
    const store = createLogStore(slowArea(), 'log', 3);

    await Promise.all(['a', 'b', 'c', 'd', 'e'].map((m) => store.append(entry(m))));

    assert.deepEqual((await store.read()).map((e) => e.msg), ['c', 'd', 'e']);
});

// Review fix: a stored null (an empty target saved from Options serializes NaN as
// null) used to override the default, and a null target pays on every new streak.
test('a stored null field reads as its default', async () => {
    const area = slowArea();
    area.items.data = { expireTime: null, currentScore: 3, paidRung: null };
    const store = createDataStore(area, 'data', () => new Data());

    const saved = await store.read();
    assert.equal(saved.expireTime, 0);
    assert.equal(saved.paidRung, -1);
    assert.equal(saved.currentScore, 3);
});

// Review fix: the streak page must not decide its target and paid rung from fallback
// defaults when a read fails, so it retries a real read instead.
test('retry returns the first success', async () => {
    let calls = 0;
    const result = await retry(async () => {
        calls++;
        if (calls < 3) throw new Error('transient');
        return 'ok';
    }, 3, 1);

    assert.equal(result, 'ok');
    assert.equal(calls, 3);
});

test('retry rejects with the last error once attempts run out', async () => {
    let calls = 0;
    await assert.rejects(retry(async () => {
        calls++;
        throw new Error(`fail ${calls}`);
    }, 3, 1), /fail 3/);
    assert.equal(calls, 3);
});
