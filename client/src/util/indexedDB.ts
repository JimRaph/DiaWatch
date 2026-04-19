
import { openDB, DBSchema } from "idb";
import {CheckupEntry} from '../types/index'



const DB_NAME = "DiaWatch";
const STORE_NAME = "checkups";
const SYNC_QUEUE_STORE = "syncQueue";
const MAX_ENTRIES = 50;

interface DiaWatchDB extends DBSchema {
  checkups: {
    key: string;
    value: CheckupEntry;
    indexes: {
      "by-timestamp": string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      predictionId: string;
      payload: any;
      retries: number;
      createdAt: number;
    };
  };
}

export async function getDB() {
  return openDB<DiaWatchDB>(DB_NAME, 2, {
    // <-- Changed from 1 to 2
    upgrade(db, oldVersion) {
      // Create checkups store (version 1)
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "prediction_id",
        });
        store.createIndex("by-timestamp", "timestamp");
      }

      // Create syncQueue store (version 2)
      if (oldVersion < 2) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "predictionId" });
      }
    },
  });
}

export function getConfidence( scores: CheckupEntry["confidence_scores"],
  label: CheckupEntry["prediction_label"]
): number {
  const map = {
    Healthy: "healthy",
    Prediabetes: "prediabetes",
    Diabetes: "diabetes",
  } as const;
  console.log("get confidence: ", scores, label)
  return scores[map[label]];
}

export async function addCheckup(
  entry: CheckupEntry,
  syncPending: boolean = false
) {
  console.log("Adding checkup to IndexedDB:", entry);
  const db = await getDB();

  const count = await db.count(STORE_NAME);
  if (count >= MAX_ENTRIES) {
    const allEntries = await db.getAll(STORE_NAME);
    allEntries.sort((a, b) => (a._accessedAt || 0) - (b._accessedAt || 0));
    const toDelete = allEntries.slice(0, count - MAX_ENTRIES + 1);
    await Promise.all(
      toDelete.map((e) => db.delete(STORE_NAME, e.prediction_id))
    );
  }

  console.log("add to db")
  await db.put(STORE_NAME, {
    ...entry,
    _accessedAt: Date.now(),
    _syncPending: syncPending,
  });

  console.log("data added to db")
  if (syncPending) {
    await db.put(SYNC_QUEUE_STORE, {
      predictionId: entry.prediction_id,
      payload: entry,
      retries: 0,
      createdAt: Date.now(),
    });
  }
}

export async function getAllCheckups(): Promise<CheckupEntry[]> {
  const db = await getDB();
  const entries = await db.getAll(STORE_NAME);

  await Promise.all(
    entries.map((e) => db.put(STORE_NAME, { ...e, _accessedAt: Date.now() }))
  );

  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getPendingSyncs() {
  const db = await getDB();
  try {
    return db.getAll(SYNC_QUEUE_STORE);
  } catch (err) {
    console.warn("syncQueue store not found, returning empty array");
    return [];
  }
}

export async function markAsSynced(predictionId: string) {
  const db = await getDB();
  try {
    await db.delete(SYNC_QUEUE_STORE, predictionId);

    const entry = await db.get(STORE_NAME, predictionId);
    if (entry) {
      delete entry._syncPending;
      await db.put(STORE_NAME, entry);
    }
  } catch (err) {
    console.warn("Could not mark as synced:", err);
  }
}

export async function clearCheckups() {
  const db = await getDB();
  await db.clear(STORE_NAME);
  await db.clear(SYNC_QUEUE_STORE);
}


export async function syncPendingEntries(api: any) {
  try {
    const pending = await getPendingSyncs();

    for (const item of pending) {
      try {
        await api.submitFeedback(item.predictionId, item.payload.actual_class);
        await markAsSynced(item.predictionId);
      } catch (err) {
        console.error("Sync failed for", item.predictionId, err);

        const db = await getDB();
        const retries = item.retries + 1;

        if (retries >= 3) {
          try {
            await db.delete(SYNC_QUEUE_STORE, item.predictionId);
          } catch (e) {
            console.warn(
              "Could not delete from syncQueue - store may not exist yet: ",
              e
            );
          }
          console.log(
            "Max retries reached, removed from queue:",
            item.predictionId
          );
        } else {
          try {
            await db.put(SYNC_QUEUE_STORE, {
              ...item,
              retries: retries,
            });
          } catch (e) {
            console.warn("Could not update retry count in syncQueue: ", e);
          }
        }
      }
    }
  } catch (err) {
    console.error("Sync process failed:", err);
  }
}