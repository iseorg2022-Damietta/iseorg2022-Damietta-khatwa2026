"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Gauge, DomainBars } from "@/components/ui";
import ActivitiesSection from "@/components/activities-section";
import { LEVELS, DOMAIN_NAMES } from "@/lib/levels";
import { getProvisional, ProvisionalAssessment } from "@/lib/idb";
import { pickActivities, ActivityLite } from "@/lib/activities-client";
import { SITE } from "@/lib/site";

export default function Report() {
  const { id, aid } = useParams();
  const isLocal = String(aid).startsWith("local-");
  const [a, setA] = useState<ProvisionalAssessment | any>(null);
  const [childName, setChildName] = useState("");

  useEffect(() => {
    fetch("/api/children").then(r => r.json())
      .then(j => setChildName(j.children?.find((c: any) => String(c.id) === id)?.name || ""))
      .catch(() => {});
    if (isLocal) {
      getProvisional(String(aid)).then(p => setA(p || { missing: true }));
    } else {
      fetch(`/api/assessments/${aid}`).then(r => r.json())
        .then(j => setA(j.assessment));
    }
  }, [aid, id, isLocal]);

  if (!a) return <p className="text-center py-10">جارٍ التحميل...</p>;
  if (a.missing) return (
    <div className="card max-w-xl mx-auto mt-8 text-center">
      هذا التقييم المبدئي تمت مزامنته وحُسب نهائياً على الخادم.
      افتحي <a className="text-brand underline" href={`/child/${id}`}>ملف طفلك</a> لرؤية التقييم الرسمي.
    </div>);

  const level = a.adjustedLevel || a.level;
  const cfg = LEVELS[level];

  return (
    <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-lg"
         style={{ backgroundColor: `${cfg.color}14`, border: `3px solid ${cfg.color}` }}>

      <div className="p-5 text-white" style={{ backgroundColor: cfg.color }}>
        <p className="text-sm opacity-90">تقرير نمائي — نقطة تفتيش رقم {a.checkpoint}</p>
        <h1 className="text-2xl font-extrabold">{cfg.title} · المستوى {cfg.level}/5</h1>
        <p className="mt-1 text-sm">
          {childName || a.child?.name || "طفلك"} · العمر النمائي {Math.round(a.devAge || a.dev)} شهراً
        </p>
      </div>

      <div className="p-6 space-y-6">
        {isLocal && (
          <div className="rounded-xl bg-l3/15 border border-l3 px-4 py-3 text-sm">
            📴 <b>تقييم مبدئي محفوظ على جهازك</b> — سيتزامن تلقائياً عند عودة الشبكة،
            ويعاد حسابه نهائياً على الخادم بأحدث كتالوج معتمد، فقد يتغير المستوى قليلاً.
          </div>)}

        <Gauge index={a.index} level={level} />

        <div className="card">
          <h2 className="font-extrabold mb-3">خريطة المجالات النمائية</h2>
          <DomainBars scores={a.domainScores} />
        </div>

        {a.redFlags?.length > 0 && (
          <div className="card" style={{ borderRight: `6px solid ${cfg.color}` }}>
            <h2 className="font-extrabold mb-2">علامات استدعت انتباه المحرك</h2>
            <ul className="list-disc pr-5 text-sm space-y-1">
              {a.redFlags.map((r: any) =>
                <li key={r.itemId}>{r.lost ? "⚠️ " : ""}{r.stem} <span className="text-xs text-stone-400">({DOMAIN_NAMES[r.domain]})</span></li>)}
            </ul>
          </div>)}

        <div className="card bg-white">
          <h2 className="font-extrabold mb-2">الخطوة التالية</h2>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line">{a.narrative}</p>
          {level >= 4 && !isLocal && (
            <p className="mt-4 text-sm font-bold text-l4">⏱️ سيتم الاتصال بكِ خلال: {cfg.sla}</p>)}
          <p className="mt-3 text-xs text-stone-500">
            للاستفسار والدعم: {SITE.phone} (اتصال/واتساب) · {SITE.email}
          </p>
        </div>

        {isLocal
          ? <LocalActivities a={a} />
          : <ServerActivities aid={aid as string} />}

        <p className="text-xs text-stone-500 text-center leading-relaxed">
          هذا التقرير أداة رصد مبكر وليس تشخيصاً طبياً؛ التشخيص يتطلب تقييماً متخصصاً وجهاً لوجه.
        </p>
      </div>
    </div>
  );
}

/* فرع الخادمي: الأنشطة المحسوبة للمقيّم من /api/assessments/[id]/activities */
function ServerActivities({ aid }: { aid: string }) {
  const [d, setD] = useState<{ isEnrichment: boolean; activities: ActivityLite[] } | null>(null);
  useEffect(() => {
    fetch(`/api/assessments/${aid}/activities`).then(r => r.json()).then(setD);
  }, [aid]);
  if (!d?.activities?.length) return null;
  return <ActivitiesSection isEnrichment={d.isEnrichment} activities={d.activities} />;
}

/* فرع المبدئي دون اتصال: من القائمة المخزّنة + نفس خوارزمية الاختيار */
function LocalActivities({ a }: { a: ProvisionalAssessment }) {
  const [acts, setActs] = useState<ActivityLite[]>([]);
  const [isEnrichment, setIsEnrichment] = useState(false);
  useEffect(() => {
    fetch("/api/activities").then(r => r.json())
      .then(j => {
        const picked = pickActivities(j.activities || [], a.domainScores, a.devAge);
        setActs(picked.activities); setIsEnrichment(picked.isEnrichment);
      }).catch(() => {});
  }, [a]);
  if (!acts.length) return null;
  return <ActivitiesSection isEnrichment={isEnrichment} activities={acts} />;
}