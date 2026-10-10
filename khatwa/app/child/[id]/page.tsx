"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RiskBadge } from "@/components/ui";

const T = {
  born: "\u0645\u0648\u0627\u0644\u064a\u062f: ",
  devAge: " \u0634\u0647\u0631\u0627\u064b \u0646\u0645\u0627\u0626\u064a\u0627\u064b",
  rf: "\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062e\u0637\u0648\u0631\u0629 \u0627\u0644\u0645\u0633\u062c\u0644\u0629",
  rfSum: "\u0645\u062c\u0645\u0648\u0639 \u0623\u0648\u0632\u0627\u0646\u0647\u0627 = ",
  rfNote: "/100 \u064a\u062f\u062e\u0644 \u0627\u0644\u0645\u0624\u0634\u0631 \u0628\u0648\u0632\u0646 20%",
  start: "\ud83d\udcdd \u0646\u0642\u0637\u0629 \u062a\u0641\u062a\u064a\u0634 \u0631\u0642\u0645 ",
  urgent: "\ud83d\udea8 \u0623\u0646\u0627 \u0642\u0644\u0642\u0629 \u2014 \u062a\u0642\u064a\u064a\u0645 \u0641\u0648\u0631\u064a",
  timeline: "\u0627\u0644\u062e\u0637 \u0627\u0644\u0632\u0645\u0646\u064a \u0644\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a",
  cp: "\u0646\u0642\u0637\u0629 \u062a\u0641\u062a\u064a\u0634 ",
  idx: " \u00b7 \u0645\u0624\u0634\u0631 ",
  reviewed: " \u00b7 \u0645\u064f\u0631\u0627\u062c\u0639\u0629",
  empty: "\u0644\u0627 \u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0628\u0639\u062f \u2014 \u0627\u0628\u062f\u0626\u064a \u0623\u0648\u0644 \u0646\u0642\u0637\u0629 \u062a\u0641\u062a\u064a\u0634.",
  loading: "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...",
};

export default function ChildPage() {
  const { id } = useParams();
  const [c, setC] = useState<any>(null);
  useEffect(() => { fetch(`/api/children/${id}`).then(r => r.json()).then(j => setC(j.child)); }, [id]);
  if (!c) return <p className="text-center py-10">{T.loading}</p>;
  const a = c.assessments?.[0];
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{c.name}</h1>
          <p className="text-sm text-stone-500">
            {c.district ? c.district + " \u00b7 " : ""}
            {T.born}{new Date(c.birthDate).toLocaleDateString("ar-EG")}{" \u00b7 "}
            {a ? Math.round(a.devAge) : 0}{T.devAge}
          </p>
        </div>
        {a && <RiskBadge level={a.adjustedLevel || a.level} />}
      </div>

      {c.riskFactors?.length > 0 && (
        <div className="card">
          <h2 className="font-extrabold mb-2">{T.rf}</h2>
          <div className="flex flex-wrap gap-2">
            {c.riskFactors.map((r: any) => (
              <span key={r.id} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">
                {r.label} <span className="text-stone-400">({r.weight})</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {T.rfSum}{c.riskFactors.reduce((s: number, r: any) => s + r.weight, 0)}{T.rfNote}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <a href={`/child/${id}/checkpoint`} className="btn-primary flex-1 text-center">
          {T.start}{(c.assessments?.[0]?.checkpoint || 0) + 1}
        </a>
        <a href={`/child/${id}/checkpoint`} className="btn bg-l5 text-white flex-1 text-center">{T.urgent}</a>
      </div>

      <div className="card">
        <h2 className="font-extrabold mb-3">{T.timeline}</h2>
        <div className="space-y-2">
          {c.assessments?.map((x: any) => (
            <a key={x.id} href={`/child/${id}/report/${x.id}`}
               className="flex items-center justify-between rounded-xl border border-stone-100 p-3 hover:shadow-sm">
              <span className="text-sm">
                {T.cp}{x.checkpoint}{T.idx}{x.index}/100{" \u00b7 "}
                {new Date(x.createdAt).toLocaleDateString("ar-EG")}
                {x.reviewedBy && <span className="text-brand">{T.reviewed}</span>}
              </span>
              <RiskBadge level={x.adjustedLevel || x.level} />
            </a>
          ))}
          {!c.assessments?.length && <p className="text-stone-500 text-sm">{T.empty}</p>}
        </div>
      </div>
    </div>
  );
}