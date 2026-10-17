/**
 * Serialized read-modify-write over a browser storage area.
 *
 * Writers used to save a whole object they had read earlier, so whichever save
 * landed last put back every field the others had just changed -- including a
 * freshly awarded unlock. Here every change reads fresh data, applies itself and
 * waits for its save before the next change starts.
 *
 * No browser imports on purpose: the node test runner drives this module directly
 * with a fake storage area whose calls are slow enough to overlap.
 */

export interface StorageArea {
    get(key: string): Promise<{ [key: string]: any }>;
    set(items: { [key: string]: any }): Promise<void>;
    remove(key: string): Promise<void>;
}

/**
 * Runs jobs one at a time, in the order they were queued. A job that fails rejects
 * its own promise but does not stop the jobs queued after it.
 */
export function createQueue() {
    let tail: Promise<unknown> = Promise.resolve();

    return function enqueue<R>(job: () => Promise<R>): Promise<R> {
        let result = tail.then(job);
        tail = result.catch(() => {});
        return result;
    };
}

/**
 * Runs `job` up to `attempts` times, waiting `delayMillis` between tries, and returns
 * the first success. Rejects with the last error once the attempts run out.
 */
export async function retry<R>(job: () => Promise<R>, attempts: number, delayMillis: number): Promise<R> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await job();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMillis));
            }
        }
    }
    throw lastError;
}

export function createDataStore<T extends object>(area: StorageArea, key: string, makeDefault: () => T) {
    const enqueue = createQueue();

    // Fields added since the object was stored (paidRung, for data saved by 2.1.1)
    // come from the defaults instead of reading as undefined, and so does a stored
    // null -- a NaN saved from an empty Options field comes back as null.
    async function read(): Promise<T> {
        let stored = await area.get(key);
        let data: any = makeDefault();
        for (let [field, value] of Object.entries(stored?.[key] ?? {})) {
            if (value != null) {
                data[field] = value;
            }
        }
        return data;
    }

    // A failed read rejects before anything is written, so defaults can never be
    // saved over real data.
    function update(mutate: (data: T) => void): Promise<T> {
        return enqueue(async () => {
            let data = await read();
            mutate(data);
            await area.set({ [key]: data });
            return data;
        });
    }

    return { read, update };
}

export interface LogEntry {
    time: number;
    page: string;
    msg: string;
}

export function createLogStore(area: StorageArea, key: string, maxEntries: number) {
    const enqueue = createQueue();

    async function read(): Promise<LogEntry[]> {
        let stored = await area.get(key);
        return stored?.[key] ?? [];
    }

    function append(entry: LogEntry): Promise<void> {
        return enqueue(async () => {
            let entries = await read();
            entries.push(entry);
            if (entries.length > maxEntries) {
                entries = entries.slice(-maxEntries);
            }
            await area.set({ [key]: entries });
        });
    }

    // Queued like a write, so an append already in flight cannot land after the
    // clear and bring the old entries back.
    function clear(): Promise<void> {
        return enqueue(() => area.remove(key));
    }

    return { read, append, clear };
}
