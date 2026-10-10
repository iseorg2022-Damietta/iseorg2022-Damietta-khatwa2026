"use client";
import { DOMAIN_NAMES } from "@/lib/levels";

export interface ActivityLite {
  id: string; domain: string; title: string;
  steps: string[]; materials: string; why: string; warn?: string | null;
}

export default function ActivitiesSection(
  { isEnrichment, activities }: { isEnrichment: boolean; activities: ActivityLite[] },
) {
  const byDomain: Record<string, ActivityLite[]> = {};
  for (const a of activities) (byDomain[a.domain] ||= []).push(a);
  return (
    <div className="card bg-white">
      <h2 className="font-extrabold mb-1">
        {isEnrichment
          ? "\ud83c\udf31 \u0623\u0646\u0634\u0637\u0629 \u0625\u062b\u0631\u0627\u0626\u064a\u0629 \u0645\u0646\u0632\u0644\u064a\u0629 \u2014 \u0637\u0641\u0644\u0643 \u0641\u064a \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0635\u062d\u064a\u062d"
          : "\ud83c\udfaf \u0623\u0646\u0634\u0637\u0629 \u0645\u0646\u0632\u0644\u064a\u0629 \u0645\u0648\u062c\u0651\u0647\u0629 \u0644\u0645\u062c\u0627\u0644\u064a \u0627\u0644\u062a\u0631\u0643\u064a\u0632"}
      </h2>
      <p className="text-xs text-stone-500 mb-4">
        {"\u0645\u0648\u0627\u062f \u0645\u0646 \u0627\u0644\u0628\u064a\u062a \u00b7 10 \u062f\u0642\u0627\u0626\u0642 \u064a\u0648\u0645\u064a\u0627\u064b \u00b7 \u062a\u0646\u0627\u0648\u0628\u064a \u0628\u064a\u0646\u0647\u0627 \u0623\u0633\u0628\u0648\u0639\u064a\u0646 \u062b\u0645 \u0623\u0639\u064a\u062f\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u062a\u0641\u062a\u064a\u0634"}
      </p>
      {Object.entries(byDomain).map(([d, acts]) => (
        <div key={d} className="mb-4">
          <h3 className="font-bold text-brand">{DOMAIN_NAMES[d]}</h3>
          {acts.map(a => (
            <details key={a.id} className="mt-2 rounded-xl border border-stone-100 p-3">
              <summary className="font-bold cursor-pointer">{a.title}</summary>
              <ol className="list-decimal pr-5 text-sm mt-2 space-y-1">
                {a.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <p className="text-xs text-stone-500 mt-2">
                {"\u0627\u0644\u0645\u0648\u0627\u062f: "}{a.materials} {"\u00b7 \u0627\u0644\u0641\u0627\u0626\u062f\u0629: "}{a.why}
              </p>
              {a.warn && <p className="text-xs text-l5 font-bold mt-1">{"\u26a0\ufe0f "}{a.warn}</p>}
            </details>
          ))}
        </div>
      ))}
      <p className="text-[11px] text-stone-400 border-t border-stone-100 pt-2">
        {"\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u062a\u0648\u062c\u064a\u0647\u064a\u0629 \u0644\u0644\u062a\u062d\u0641\u064a\u0632 \u0627\u0644\u0645\u0646\u0632\u0644\u064a \u0648\u0644\u0627 \u062a\u064f\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u062a\u062e\u0635\u0635 \u0639\u0646\u062f \u0648\u062c\u0648\u062f \u0625\u0646\u0630\u0627\u0631."}
      </p>
    </div>
  );
}