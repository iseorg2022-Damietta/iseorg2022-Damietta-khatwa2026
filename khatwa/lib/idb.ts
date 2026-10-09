// lib/idb.ts — مخزنان: outbox (طابور المزامنة) + provisional (التقييمات المبدئية دون اتصال)
const DB = "khatwa";
export const OUTBOX = "outbox";
export const PROVISIONAL = "provisional";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "id" });
      if (!db.objectStoreNames.contains(PROVISIONAL)) db.createObjectStore(PROVISIONAL, { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const p = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function store(name: string, mode: IDBTransactionMode) {
  const db = await open();
  return db.transaction(name, mode).objectStore(name);
}

/* ---------------- Outbox ---------------- */
export interface OutboxEntry {
  id: string;
  kind: "CHECKPOINT";
  childId: number;
  localId: string;
  url: string;
  body: string;
  createdAt: number;
}
export async function putOutbox(e: OutboxEntry) { const s = await store(OUTBOX, "readwrite"); await p(s.put(e)); }
export async function listOutbox(): Promise<OutboxEntry[]> { const s = await store(OUTBOX, "readonly"); return p(s.getAll()); }
export async function delOutbox(id: string) { const s = await store(OUTBOX, "readwrite"); await p(s.delete(id)); }

/* ---------------- التقييمات المبدئية ---------------- */
export interface ProvisionalAssessment {
  id: string; childId: number; checkpoint: number;
  chronoAge: number; devAge: number;
  index: number; level: number;
  delayScore: number; redFlagScore: number; rfScore: number;
  domainScores: Record<string, { pct: number; due: number }>;
  redFlags: unknown[]; narrative: string; overrides: string[];
  createdAt: string; synced: boolean; serverAssessmentId?: number;
}
export async function putProvisional(a: ProvisionalAssessment) { const s = await store(PROVISIONAL, "readwrite"); await p(s.put(a)); }
export async function getProvisional(id: string) {
  const s = await store(PROVISIONAL, "readonly");
  return p(s.get(id) as IDBRequest<ProvisionalAssessment | undefined>);
}
export async function delProvisional(id: string) { const s = await store(PROVISIONAL, "readwrite"); await p(s.delete(id)); }