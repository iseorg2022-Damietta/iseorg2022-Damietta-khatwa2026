"use client";
import { useEffect, useState } from "react";

const STATUS = ["CREATED", "CONTACTED", "SCHEDULED", "ASSESSED", "CLOSED"];
const AR: Record<string, string> = {
  CREATED: "\u0645\u0646\u0634\u0626\u0629", CONTACTED: "\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644",
  SCHEDULED: "\u0645\u0648\u0639\u062f \u0645\u062d\u062f\u062f", ASSESSED: "\u062a\u0645 \u0627\u0644\u062a\u0642\u064a\u064a\u0645",
  CLOSED: "\u0645\u063a\u0644\u0642\u0629",
  IMMEDIATE_48H: "\u26a1 \u0641\u0648\u0631\u064a 48 \u0633\u0627\u0639\u0629",
  SCHEDULED_7D: "\u062e\u0644\u0627\u0644 7 \u0623\u064a\u0627\u0645", TELECONSULT: "\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0639\u0646 \u0628\u0639\u062f",
};

export default function Referrals() {
  const [list, setList] = useState<any[]>([]);
  const load = () => fetch("/api/referrals").then(r => r.json()).then(j => setList(j.referrals || []));
  useEffect(() => { void load(); }, []);

  async function update(id: number, status: string) {
    await fetch("/api/referrals", { method: "PATCH",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{"\u062a\u062a\u0628\u0639 \u0627\u0644\u0625\u062d\u0627\u0644\u0627\u062a"}</h1>
      {list.map(r => {
        const late = new Date(r.dueAt) < new Date() && r.status !== "CLOSED";
        return (
          <div key={r.id} className={`card ${late ? "border-l5" : ""}`}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <b>{r.child.name}</b> {"\u2192 "}{r.facility.name}
                <span className="block text-sm text-stone-500">
                  {AR[r.urgency]} {"\u00b7 "}
                  {new Date(r.dueAt).toLocaleDateString("ar-EG")}
                  {late && <b className="text-l5"> {"\u2014 \u0645\u062a\u0623\u062e\u0631\u0629! \u062a\u0635\u0639\u064a\u062f \u062a\u0644\u0642\u0627\u0626\u064a"}</b>}
                </span>
              </div>
              <select className="input max-w-40" value={r.status} onChange={e => update(r.id, e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{AR[s]}</option>)}
              </select>
            </div>
          </div>
        );
      })}
      {!list.length && <p className="text-stone-500">{"\u0644\u0627 \u0625\u062d\u0627\u0644\u0627\u062a \u0628\u0639\u062f"}</p>}
    </div>
  );
}