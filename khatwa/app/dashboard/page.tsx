"use client";
import { useEffect, useState } from "react";
import { RiskBadge } from "@/components/ui";

const T = {
  h1: "\u0623\u0637\u0641\u0627\u0644\u064a",
  newPreg: "\u062d\u0645\u0644 \u062c\u062f\u064a\u062f",
  addChild: "+ \u0625\u0636\u0627\u0641\u0629 \u0637\u0641\u0644",
  formTitle: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u064a\u0644\u0627\u062f (\u0644\u0627\u0634\u062a\u0642\u0627\u0642 \u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062e\u0637\u0648\u0631\u0629 \u0622\u0644\u064a\u0627\u064b)",
  name: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0641\u0644",
  birth: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u064a\u0644\u0627\u062f",
  ga: "\u0639\u0645\u0631 \u0627\u0644\u062d\u0645\u0644 \u0628\u0627\u0644\u0623\u0633\u0627\u0628\u064a\u0639",
  bw: "\u0648\u0632\u0646 \u0627\u0644\u0645\u064a\u0644\u0627\u062f (\u062c\u0631\u0627\u0645)",
  apgar: "\u0623\u0628\u063a\u0627\u0631 \u0627\u0644\u062f\u0642\u064a\u0642\u0629 5",
  nicu: "\u0623\u064a\u0627\u0645 \u0627\u0644\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629",
  district: "\u0627\u0644\u0645\u0631\u0643\u0632/\u0627\u0644\u0645\u062f\u064a\u0646\u0629 (\u0644\u0644\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a\u0629)",
  districtPh: "\u062f\u0645\u064a\u0627\u0637 / \u0631\u0623\u0633 \u0627\u0644\u0628\u0631 / \u0627\u0644\u0633\u0631\u0648...",
  hearing: "\u0641\u062d\u0635 \u0627\u0644\u0633\u0645\u0639",
  hUnknown: "\u0644\u0645 \u064a\u062a\u0645 / \u0644\u0627 \u0623\u0639\u0631\u0641",
  hPass: "\u0646\u062c\u062d",
  hRefer: "\u0625\u062d\u0627\u0644\u0629",
  fam: "\u062a\u0627\u0631\u064a\u062e \u0639\u0627\u0626\u0644\u064a (\u0625\u0639\u0627\u0642\u0629/\u062a\u0648\u062d\u062f/\u062a\u0623\u062e\u0631 \u0644\u063a\u0629)",
  jaundPhoto: "\u064a\u0631\u0642\u0627\u0646 \u0627\u062d\u062a\u0627\u062c \u0623\u0634\u0639\u0629",
  jaundExch: "\u064a\u0631\u0642\u0627\u0646 \u0627\u062d\u062a\u0627\u062c \u062a\u0628\u062f\u064a\u0644 \u062f\u0645",
  seiz: "\u0646\u0648\u0628\u0627\u062a \u0635\u0631\u0639\u064a\u0629",
  consang: "\u0632\u0648\u0627\u062c \u0623\u0642\u0627\u0631\u0628",
  save: "\u062d\u0641\u0638 \u0627\u0644\u0637\u0641\u0644",
  noAssess: "\u0644\u0627 \u062a\u0642\u064a\u064a\u0645 \u0628\u0639\u062f",
  noAssessHint: "\u0627\u0628\u062f\u0626\u064a \u0623\u0648\u0644 \u062a\u0642\u064a\u064a\u0645 \u062e\u0637\u0648\u0629 \u0627\u0644\u0622\u0646",
  lastIdx: "\u0622\u062e\u0631 \u0645\u0624\u0634\u0631 \u062e\u0637\u0631: ",
};

export default function Dashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", gender: "male", birthDate: "", gaWeeks: 40, birthWeightG: "",
    apgar5: "", nicuDays: 0, district: "",
    jaundicePhoto: false, jaundiceExch: false,
    neonatalSeiz: false, hearingScreen: "UNKNOWN", consanguinity: false, familyHistory: "",
  });

  useEffect(() => { fetch("/api/children").then(r => r.json()).then(j => setChildren(j.children || [])); }, []);

  async function addChild() {
    const r = await fetch("/api/children", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setShowForm(false); location.reload(); }
  }

  const cb: [string, string][] = [
    ["jaundicePhoto", T.jaundPhoto], ["jaundiceExch", T.jaundExch],
    ["neonatalSeiz", T.seiz], ["consanguinity", T.consang],
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">{T.h1}</h1>
        <div className="flex gap-2">
          <a href="/pregnancy" className="btn bg-stone-200">{T.newPreg}</a>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{T.addChild}</button>
        </div>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <h2 className="font-extrabold">{T.formTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{T.name}</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">{T.birth}</label>
              <input type="date" className="input" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} /></div>
            <div><label className="label">{T.ga}</label>
              <input type="number" className="input" value={form.gaWeeks} onChange={e => setForm({ ...form, gaWeeks: e.target.value })} /></div>
            <div><label className="label">{T.bw}</label>
              <input type="number" className="input" value={form.birthWeightG} onChange={e => setForm({ ...form, birthWeightG: e.target.value })} /></div>
            <div><label className="label">{T.apgar}</label>
              <input type="number" className="input" value={form.apgar5} onChange={e => setForm({ ...form, apgar5: e.target.value })} /></div>
            <div><label className="label">{T.nicu}</label>
              <input type="number" className="input" value={form.nicuDays} onChange={e => setForm({ ...form, nicuDays: e.target.value })} /></div>
            <div><label className="label">{T.district}</label>
              <input className="input" placeholder={T.districtPh}
                     value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
            <div><label className="label">{T.hearing}</label>
              <select className="input" value={form.hearingScreen} onChange={e => setForm({ ...form, hearingScreen: e.target.value })}>
                <option value="UNKNOWN">{T.hUnknown}</option>
                <option value="PASS">{T.hPass}</option>
                <option value="REFER">{T.hRefer}</option>
              </select></div>
            <div className="col-span-2"><label className="label">{T.fam}</label>
              <input className="input" value={form.familyHistory} onChange={e => setForm({ ...form, familyHistory: e.target.value })} /></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {cb.map(([k, lbl]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form[k]} onChange={e => setForm({ ...form, [k]: e.target.checked })} />
                {lbl}
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={addChild}>{T.save}</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children.map(c => {
          const a = c.assessments?.[0];
          return (
            <a key={c.id} href={`/child/${c.id}`} className="card hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold">{c.name}</h3>
                {a ? <RiskBadge level={a.adjustedLevel || a.level} /> : <span className="text-sm text-stone-400">{T.noAssess}</span>}
              </div>
              <p className="text-sm text-stone-500 mt-1">
                {c.district ? c.district + " \u00b7 " : ""}
                {a ? T.lastIdx + a.index + "/100" : T.noAssessHint}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}