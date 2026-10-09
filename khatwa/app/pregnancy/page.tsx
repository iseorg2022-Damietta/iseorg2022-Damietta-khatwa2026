"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RiskBadge } from "@/components/ui";
import { DOMAIN_NAMES } from "@/lib/levels";

export default function ChildPage() {
  const { id } = useParams();
  const [c, setC] = useState<any>(null);
  useEffect(() => { fetch(`/api/children/${id}`).then(r => r.json()).then(j => setC(j.child)); }, [id]);
  if (!c) return <p className="text-center py-10">جارٍ التحميل...</p>;
  const a = c.assessments?.[0];
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{c.name}</h1>
          <p className="text-sm text-stone-500">
            {c.district ? `${c.district} · ` : ""}مواليد: {new Date(c.birthDate).toLocaleDateString("ar-EG")}
          </p>
        </div>
        {a && <RiskBadge level={a.adjustedLevel || a.level} />}
      </div>

      {c.riskFactors?.length > 0 && (
        <div className="card">
          <h2 className="font-extrabold mb-2">عوامل الخطورة المسجلة</h2>
          <div className="flex flex-wrap gap-2">
            {c.riskFactors.map((r: any) => (
              <span key={r.id} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">
                {r.label} <span className="text-stone-400">({r.weight})</span>
              </span>))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <a href={`/child/${id}/checkpoint`} className="btn-primary flex-1 text-center">بدء نقطة تفتيش الآن</a>
        <a href={`/child/${id}/checkpoint`} className="btn bg-l5 text-white flex-1 text-center">🚨 أنا قلقة — تقييم فوري</a>
      </div>

      <div className="card">
        <h2 className="font-extrabold mb-3">الخط الزمني للتقييمات</h2>
        <div className="space-y-2">
          {c.assessments?.map((x: any) => (
            <a key={x.id} href={`/child/${id}/report/${x.id}`}
               className="flex items-center justify-between rounded-xl border border-stone-100 p-3 hover:shadow-sm">
              <span className="text-sm">
                نقطة تفتيش {x.checkpoint} · مؤشر {x.index}/100 ·
                {" "}{new Date(x.createdAt).toLocaleDateString("ar-EG")}
                {x.reviewedBy && <span className="text-brand"> · مُراجعة</span>}
              </span>
              <RiskBadge level={x.adjustedLevel || x.level} />
            </a>))}
          {!c.assessments?.length && <p className="text-stone-500 text-sm">لا تقييمات بعد — ابدئي أول نقطة تفتيش.</p>}
        </div>
      </div>
    </div>
  );
}