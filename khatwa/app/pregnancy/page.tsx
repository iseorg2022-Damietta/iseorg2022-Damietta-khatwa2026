"use client";
import { useEffect, useState } from "react";

const T = {
  h1: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062d\u0645\u0644",
  lead: "\u0627\u062e\u062a\u0627\u0631\u064a \u0645\u0627 \u064a\u0646\u0637\u0628\u0642 \u2014 \u062a\u064f\u062d\u0633\u0628 \u0647\u0630\u0647 \u0627\u0644\u0639\u0648\u0627\u0645\u0644 \u0641\u064a \u0645\u0624\u0634\u0631 \u0627\u0644\u062e\u0637\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0644\u0637\u0641\u0644\u0643 \u0639\u0646\u062f \u0645\u064a\u0644\u0627\u062f\u0647\u060c \u0648\u062a\u0633\u0627\u0639\u062f \u0627\u0644\u0641\u0631\u064a\u0642 \u0639\u0644\u0649 \u0645\u062a\u0627\u0628\u0639\u0629 \u0623\u0648\u062b\u0642 \u0645\u0646 \u0627\u0644\u064a\u0648\u0645 \u0627\u0644\u0623\u0648\u0644.",
  lmp: "\u0623\u0648\u0644 \u064a\u0648\u0645 \u0644\u0622\u062e\u0631 \u062f\u0648\u0631\u0629 (\u062a\u0642\u062f\u064a\u0631\u064a)",
  save: "\u062d\u0641\u0638",
  saved: "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u2705 \u2014 \u0633\u064a\u062a\u0645 \u0631\u0628\u0637 \u0647\u0630\u0647 \u0627\u0644\u0639\u0648\u0627\u0645\u0644 \u0628\u0637\u0641\u0644\u0643 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b",
  weight: "\u0648\u0632\u0646 ",
  empty: "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644... \u0625\u0646 \u0628\u064a\u062f\u064a \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0641\u0627\u0631\u063a\u0629 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0637\u0644\u0648\u0628 \u0623\u0648\u0644\u0627\u064b",
};

export default function Pregnancy() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [lmp, setLmp] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/pregnancy").then(r => r.json()).then(j => setCatalog(j.catalog || []));
  }, []);

  async function save() {
    await fetch("/api/pregnancy", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lmpDate: lmp, selectedCodes: sel }) });
    setSaved(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold">{T.h1}</h1>
      <p className="text-stone-600 text-sm">{T.lead}</p>
      <label className="label">{T.lmp}</label>
      <input type="date" className="input max-w-xs" value={lmp} onChange={e => setLmp(e.target.value)} />
      <div className="card space-y-2">
        {catalog.map(rf => (
          <label key={rf.code} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
            <span className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sel.includes(rf.code)}
                     onChange={e => setSel(e.target.checked ? [...sel, rf.code] : sel.filter(c => c !== rf.code))} />
              {rf.label}
            </span>
            <span className="text-xs text-stone-400">{T.weight}{rf.weight}</span>
          </label>
        ))}
        {!catalog.length && <p className="text-stone-400 text-sm">{T.empty}</p>}
      </div>
      <button className="btn-primary" onClick={save}>{T.save}</button>
      {saved && <p className="text-l1 font-bold">{T.saved}</p>}
    </div>
  );
}