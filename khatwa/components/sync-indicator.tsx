"use client";
import { useEffect, useState } from "react";
import { isOnline } from "@/lib/sync-client";

export default function SyncIndicator() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const refresh = async () => {
      const { listOutbox } = await import("@/lib/idb");
      setPending((await listOutbox()).length);
    };
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.phase === "start") setSyncing(true);
      if (d.phase === "item" || d.phase === "done") {
        setPending(d.remaining ?? 0);
        if (d.phase === "done") setSyncing(false);
      }
    };
    window.addEventListener("khatwa-sync", onSync);
    void refresh();
    const t = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("khatwa-sync", onSync);
      clearInterval(t);
    };
  }, []);

  if (online && !syncing && !pending) return null;

  const [cls, text] = !online
    ? ["bg-stone-600", pending ? `\u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644 \u2014 ${pending} \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629` : "\u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644"]
    : syncing ? ["bg-l3", "\u062c\u0627\u0631\u064d \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629..."]
    : ["bg-l4", `${pending} \u062a\u0642\u064a\u064a\u0645 \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629`];

  return (
    <div className={`fixed bottom-3 left-3 z-50 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow ${cls}`}>
      {text}
    </div>
  );
}