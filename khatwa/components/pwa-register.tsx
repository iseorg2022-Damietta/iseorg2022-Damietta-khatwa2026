"use client";
import { useEffect } from "react";
import { startSyncLifecycle } from "@/lib/sync-client";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) { startSyncLifecycle(); return; }
    navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.controller?.postMessage({ type: "RUN_SYNC" }))
      .catch(() => {});
    startSyncLifecycle();
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "SYNC_ITEM" || e.data?.type === "SYNC_DONE")
        window.dispatchEvent(new CustomEvent("khatwa-sync", { detail: { ...e.data } }));
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);
  return null;
}