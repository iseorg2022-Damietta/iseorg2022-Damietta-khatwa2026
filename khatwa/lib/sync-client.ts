// lib/sync-client.ts - page-side sync (iOS fallback for Background Sync)
import { listOutbox, delOutbox } from "./idb";

let inFlight = false;
export const isOnline = (): boolean =>
  typeof navigator === "undefined" ? true : navigator.onLine;

function emit(detail: Record<string, unknown>): void {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("khatwa-sync", { detail }));
}

export async function registerSync(): Promise<{ via?: string; queued?: boolean }> {
  if (!isOnline()) return { queued: true };
  try {
    const reg: any = await navigator.serviceWorker?.ready;
    if (reg?.sync) { await reg.sync.register("khatwa-sync"); return { via: "background-sync" }; }
  } catch { /* fall to page sync */ }
  void runPageSync();
  return { via: "page" };
}

export async function runPageSync(): Promise<void> {
  if (inFlight || !isOnline()) return;
  inFlight = true;
  emit({ phase: "start" });
  try {
    const entries = await listOutbox();
    let done = 0, failed = 0;
    for (const en of entries) {
      try {
        const res = await fetch(en.url, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: en.body,
        });
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          await delOutbox(en.id);
          res.ok ? done++ : failed++;
          emit({ phase: "item", localId: en.localId, ok: res.ok, status: res.status });
        } else { failed++; break; }
      } catch { failed++; break; }
    }
    const remaining = (await listOutbox()).length;
    emit({ phase: "done", done, failed, remaining });
  } finally { inFlight = false; }
}

export function startSyncLifecycle(): void {
  window.addEventListener("online", () => { void registerSync(); });
  void registerSync().catch(() => {});
}