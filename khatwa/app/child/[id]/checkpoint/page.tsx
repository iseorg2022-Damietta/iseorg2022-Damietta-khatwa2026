"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DOMAIN_NAMES } from "@/lib/levels";
import { buildFinalAnswers, computeRisk } from "@/lib/engine";
import { putProvisional, putOutbox } from "@/lib/idb";
import { registerSync, isOnline } from "@/lib/sync-client";

const ANSWERS = [
  { v: "ACHIEVED", l: "\u062a\u062d\u0642\u0651\u0642 \u2705", c: "bg-l1" },
  { v: "NOT_YET", l: "\u0644\u0645 \u064a\u062a\u062d\u0642\u0651\u0642 \u0628\u0639\u062f \u23f3", c: "bg-stone-400" },
  { v: "LOST", l: "\u062a\u0648\u0642\u0651\u0641 \u0639\u0646\u0647\u0627 \u26a0\ufe0f", c: "bg-l5" },
  { v: "REFUSED", l: "\u0644\u0627 \u0623\u0633\u062a\u0637\u064a\u0639 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0622\u0646", c: "bg-stone-300" },
];
const uid = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function Checkpoint() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [online, setOnline] = useState(true);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(isOnline());
    fetch(`/api/children/${id}/due-items`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setErr(
        "\u0644\u0645 \u062a\u064f\u062d\u0645\u0651\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0642\u064a\u064a\u0645. \u0627\u0641\u062a\u062d\u064a \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0623\u062b\u0646\u0627\u0621 \u0648\u062c\u0648\u062f \u0627\u062a\u0635\u0627\u0644 \u0644\u062a\u064f\u062e\u0632\u0651\u0646 \u0639\u0644\u0649 \u0627\u0644\u062c\u0647\u0627\u0632 \u2014 \u0628\u0639\u062f\u0647\u0627 \u064a\u0639\u0645\u0644 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0643\u0627\u0645\u0644\u0627\u064b \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644."));
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [id]);

  if (err) return <div className="card max-w-xl mx-auto mt-8 text-center text-stone-600">{err}</div>;
  if (!data) return <p className="text-center py-10">{"\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644..."}</p>;

  const items = data.items;
  const item = items[i];
  const live = items.filter((x: any) => !x.preAchieved);
  const progress = Math.round((live.filter((x: any) => answers[x.id]).length / Math.max(1, live.length)) * 100);

  async function submit() {
    setBusy(true);
    if (isOnline()) {
      try {
        const r = await fetch(`/api/children/${id}/checkpoint`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkpoint: data.checkpoint, answers }),
        });
        if (r.ok) {
          const j = await r.json();
          router.push(`/child/${id}/report/${j.assessmentId}`);
          return;
        }
        if (r.status >= 400 && r.status < 500) { setBusy(false); return; }
      } catch { /* fall through to local */ }
    }

    const preSet = new Set<string>(items.filter((x: any) => x.preAchieved).map((x: any) => x.id));
    const finalAnswers = buildFinalAnswers(items, answers, preSet);
    const result = computeRisk(
      { birthDate: new Date(data.childCore.birthDate), gaWeeks: data.childCore.gaWeeks },
      finalAnswers, items, data.rfWeightSum, preSet,
    );

    const localId = `local-${Date.now()}`;
    await putProvisional({
      id: localId, childId: Number(id), checkpoint: data.checkpoint,
      chronoAge: data.devAge, devAge: data.devAge,
      index: result.index, level: result.level,
      delayScore: result.delayScore, redFlagScore: result.redFlagScore, rfScore: result.rfScore,
      domainScores: result.domainScores, redFlags: result.redFlags,
      narrative: result.narrative, overrides: result.overrides,
      createdAt: new Date().toISOString(), synced: false,
    });
    await putOutbox({
      id: uid(), kind: "CHECKPOINT", childId: Number(id), localId,
      url: `/api/children/${id}/checkpoint`,
      body: JSON.stringify({ checkpoint: data.checkpoint, answers }),
      createdAt: Date.now(),
    });
    await registerSync();
    router.push(`/child/${id}/report/${localId}`);
  }

  return (
    <div className="max-w-xl mx-auto">
      {!online && (
        <div className="mb-4 rounded-xl bg-l3/15 border border-l3 px-3 py-2 text-sm text-stone-700">
          {"\ud83d\udcf4 \u0623\u0646\u062a\u0650 \u0627\u0644\u0622\u0646 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644 \u2014 \u0623\u062c\u064a\u0628\u064a \u0628\u062b\u0642\u0629\u061b \u0633\u064a\u064f\u062d\u0641\u0638 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0639\u0644\u0649 \u062c\u0647\u0627\u0632\u0643 \u0648\u064a\u062a\u0632\u0627\u0645\u0646 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0639\u0646\u062f \u0639\u0648\u062f\u0629 \u0627\u0644\u0634\u0628\u0643\u0629."}
        </div>
      )}

      <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-4">
        <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
      </div>

      {item.preAchieved ? (
        <div className="card text-center">
          <p className="text-stone-500">{"\u0645\u0647\u0627\u0631\u0629 \u0645\u0624\u0643\u0651\u062f\u0629 \u0633\u0627\u0628\u0642\u0627\u064b \u2014 \u062a\u0646\u062a\u0642\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b"}</p>
          <button className="btn-primary mt-4" onClick={() => setI(i + 1)}>{"\u0627\u0644\u062a\u0627\u0644\u064a"}</button>
        </div>
      ) : (
        <div className="card">
          {item.kind === "regression" && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 text-l5 text-sm font-bold">
              {"\u0633\u0624\u0627\u0644 \u0645\u0647\u0645 \u0644\u0643\u0644 \u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u2014 \u0623\u062c\u064a\u0628\u064a \u0628\u062f\u0642\u0629"}
            </div>
          )}
          <p className="text-xs text-stone-400 mb-1">
            {item.kind === "regression" ? "\u0641\u062d\u0635 \u0627\u0644\u0627\u0646\u062d\u062f\u0627\u0631" : DOMAIN_NAMES[item.domain]}{" \u00b7 \u0639\u0645\u0631 \u0637\u0641\u0644\u0643 \u0627\u0644\u0646\u0645\u0627\u0626\u064a: "}{data.devAge}{" \u0634\u0647\u0631\u0627\u064b"}
          </p>
          <h2 className="text-xl font-extrabold leading-relaxed">{item.stem}</h2>
          {item.guide && <p className="text-sm text-stone-600 mt-3 bg-stone-50 rounded-xl p-3">{item.guide}</p>}
          <div className="grid grid-cols-1 gap-2 mt-5">
            {ANSWERS.map(a => (
              <button key={a.v} onClick={() => { setAnswers({ ...answers, [item.id]: a.v }); if (i < items.length - 1) setI(i + 1); }}
                className={`btn text-white ${a.c} ${answers[item.id] === a.v ? "ring-4 ring-stone-300" : ""}`}>
                {a.l}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button className="btn bg-stone-200" disabled={i === 0} onClick={() => setI(i - 1)}>{"\u0627\u0644\u0633\u0627\u0628\u0642"}</button>
        {i === items.length - 1 && (
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {busy ? "\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0641\u0638..." : "\u0625\u0646\u0647\u0627\u0621 \u0648\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0646\u062a\u064a\u062c\u0629"}
          </button>
        )}
      </div>
    </div>
  );
}