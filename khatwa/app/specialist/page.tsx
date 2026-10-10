"use client";
import { useEffect, useState } from "react";
import { RiskBadge } from "@/components/ui";
import { LEVELS } from "@/lib/levels";

const T = {
  h1: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u0627\u062a \u2014 \u0645\u0631\u062a\u0651\u0628\u0629 \u0628\u0627\u0644\u062e\u0637\u0648\u0631\u0629",
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0627\u0644\u0627\u062a \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \ud83c\udf89",
  review: "\u0645\u0631\u0627\u062c\u0639\u0629: ",
  level: "\u2014 \u0645\u0633\u062a\u0648\u0649 ",
  decision: "\u0642\u0631\u0627\u0631 \u0627\u0644\u0623\u062e\u0635\u0627\u0626\u064a",
  confirm: "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0645\u0633\u062a\u0648\u0649",
  down: "\u062a\u062e\u0641\u064a\u0636",
  up: "\u062a\u0631\u0642\u064a\u0629",
  note: "\u0645\u0644\u0627\u062d\u0638\u0629 (\u0625\u0644\u0632\u0627\u0645\u064a\u0629 \u0639\u0646\u062f \u0627\u0644\u062a\u062e\u0641\u064a\u0636)",
  facility: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0625\u062d\u0627\u0644\u0629",
  choose: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0631\u0643\u0632...",
  refer: "\ud83d\udce4 \u0625\u0646\u0634\u0627\u0621 \u0625\u062d\u0627\u0644\u0629",
  idx: "\u0645\u0624\u0634\u0631 ",
  delay: " \u00b7 \u062a\u0623\u062e\u0631 ",
  red: " \u00b7 \u0625\u0646\u0630\u0627\u0631 ",
  rf: " \u00b7 \u062e\u0637\u0648\u0631\u0629 ",
};

export default function Specialist() {
  const [cases, setCases] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [note, setNote] = useState("");
  const [facilityId, setFacilityId] = useState<number | null>(null);

  const load = () => fetch("/api/specialist/queue").then(r => r.json()).then(j => setCases(j.cases || []));
  useEffect(() => {
    load();
    fetch("/api/facilities").then(r => r.json()).then(j => setFacilities(j.facilities || []));
  }, []);

  async function review(action: string) {
    await fetch("/api/specialist/review", { method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: sel.id, action, reason: note }) });
    setSel(null); load();
  }

  async function refer() {
    await fetch("/api/referrals", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: sel.id, facilityId, notes: note }) });
    setSel(null); load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{T.h1}</h1>
      <div className="space-y-3">
        {cases.map(c => (
          <button key={c.id} onClick={() => setSel(c)}
            className="card w-full text-right hover:shadow-md transition flex items-center justify-between">
            <div>
              <div className="font-extrabold">{c.child.name}
                <span className="text-sm font-normal text-stone-500"> {"\u00b7 "}{c.child.user?.phone}</span></div>
              <div className="text-sm text-stone-500">
                {T.idx}{c.index}/100{T.delay}{c.delayScore}{T.red}{c.redFlagScore}{T.rf}{c.rfScore}
              </div>
            </div>
            <RiskBadge level={c.adjustedLevel || c.level} />
          </button>
        ))}
        {!cases.length && <p className="text-stone-500">{T.empty}</p>}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSel(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold">
              {T.review}{sel.child.name} {T.level}{sel.adjustedLevel || sel.level}
            </h2>
            <div className="rounded-xl p-3 text-sm whitespace-pre-line bg-stone-50 max-h-40 overflow-y-auto">{sel.narrative}</div>

            <div>
              <label className="label">{T.decision}</label>
              <div className="flex gap-2">
                <button className="btn bg-l1 text-white text-sm" onClick={() => review("confirm")}>{T.confirm}</button>
                <button className="btn bg-stone-300 text-sm" onClick={() => review("downgrade")}>{T.down}</button>
                <button className="btn bg-l5 text-white text-sm" onClick={() => review("upgrade")}>{T.up}</button>
              </div>
            </div>

            <label className="label">{T.note}</label>
            <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} />

            <label className="label">{T.facility}</label>
            <select className="input" value={facilityId ?? ""} onChange={e => setFacilityId(Number(e.target.value))}>
              <option value="">{T.choose}</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <button className="btn-primary w-full" disabled={!facilityId} onClick={refer}>
              {T.refer} ({LEVELS[sel.adjustedLevel || sel.level].sla})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}