import { openDB, DBSchema } from "idb";


export interface CheckupEntry {
  id?: number; 
  time: string;
  inputs: Record<string, string | number>; 
  habits: {
        EatingHabit: string;
        ExerciseFrequency: string;
        PerceivedStress: string;
    };
    healthNotes: string; 
    prediction: "Diabetic" | "Non-Diabetic";
    confidence: number;
    explanations?: { feature: string; value: number }[]; 
    recommendations?: string[];
}


interface MediAIDB extends DBSchema {
  checkups: {
    key: number;
    value: CheckupEntry;
    indexes: { "by-time": string };
  };
}

const DB_NAME = "MediAI_DB";
const STORE_NAME = "checkups";


export async function getDB() {
  return openDB<MediAIDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, 
            { keyPath: "id", autoIncrement: true });
        store.createIndex("by-time", "time");
      }
    },
  });
}

export async function addCheckup(entry: CheckupEntry) {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
}

export async function getAllCheckups(): Promise<CheckupEntry[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearCheckups() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
