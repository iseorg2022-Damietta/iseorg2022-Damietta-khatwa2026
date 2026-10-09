"use client";
import { DOMAIN_NAMES } from "@/lib/levels";

export interface ActivityLite { id: string; domain: string; title: string;
  steps: string[]; materials: string; why: string; warn?: string | null; }

export default function ActivitiesSection(
  { isEnrichment, activities }: { isEnrichment: boolean; activities: ActivityLite[] }) {
  const byDomain: Record<string, ActivityLite[]> = {};
  for (const a of activities) (byDomain[a.domain] ||= []).push(a);
  return (
    <div className="card bg-white">
      <h2 className="font-extrabold mb-1">
        {isEnrichment ? "🌱 أنشطة إثرائية منزلية — طفلك في المسار الصحيح"
                      : "🎯 أنشطة منزلية موجهة لمجالي التركيز"}
      </h2>
      <p className="text-xs text-stone-500 mb-4">
        مواد من البيت · 10 دقائق يومياً · تناوبي بينها أسبوعين ثم أعيدي نقطة التفتيش
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
              <p className="text-xs text-stone-500 mt-2">المواد: {a.materials} · الفائدة: {a.why}</p>
              {a.warn && <p className="text-xs text-l5 font-bold mt-1">⚠️ {a.warn}</p>}
            </details>))}
        </div>))}
      <p className="text-[11px] text-stone-400 border-t border-stone-100 pt-2">
        الأنشطة توجيهية للتحفيز المنزلي ولا تُغني عن التقييم المتخصص عند وجود إنذار.
      </p>
    </div>
  );
}