"use client";
import { useEffect, useState } from "react";
import { DOMAIN_NAMES } from "@/lib/levels";

/* ألوان العتبات: أخضر = حقق الهدف، أصفر = قريب، أحمر = بعيد */
function verdict(value: number | null, target: number, higherBetter = true): string {
  if (value === null) return "text-stone-400";
  const ok = higherBetter ? value >= target : value <= target;
  const near = higherBetter ? value >= target * 0.8 : value <= target * 1.5;
  return ok ? "text-l1" : near ? "text-l3" : "text-l5";
}

function Card({ title, value, unit, target, higherBetter = true, hint }: {
  title: string; value: number | string | null; unit?: string;
  target?: number; higherBetter?: boolean; hint?: string }) {
  const v = typeof value === "number" ? verdict(value, target ?? 0, higherBetter) : "text-stone-700";
  return (
    <div className="card">
      <p className="text-xs text-stone-500">{title}</p>
      <p className={`text-3xl font-extrabold mt-1 ${v}`}>
        {value ?? "—"}{unit && <span className="text-base font-bold"> {unit}</span>}
      </p>
      {target !== undefined && typeof value === "number" &&
        <p className="text-[11px] text-stone-400 mt-1">الهدف: {target}{unit}</p>}
      {hint && <p className="text-[11px] text-stone-400">{hint}</p>}
    </div>
  );
}

function Bars({ data, color = "#0E5A6D" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-1.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-stone-500">{d.label}</span>
          <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(100 * d.value) / max}%`, backgroundColor: color }} />
          </div>
          <span className="w-10 text-left font-bold">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [k, setK] = useState<any>(null);
  const [days, setDays] = useState(90);
  const [district, setDistrict] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ days: String(days), ...(district && { district }) });
    fetch(`/api/analytics/kpis?${q}`).then(r => r.json()).then(setK);
  }, [days, district]);

  if (!k) return <p className="text-center py-10">جارٍ حساب المؤشرات...</p>;

  const funnelSteps = [
    { label: "مسجلون", value: k.coverage.children },
    { label: "مفعّلون", value: k.coverage.activated },
    { label: "إنذار 3+", value: k.funnel.flagged },
    { label: "محالون", value: k.funnel.referred },
    { label: "تم تقييمهم", value: k.funnel.assessed },
    { label: "منتسبون للتدخل", value: k.funnel.enrolled },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">لوحة الرصد والتقييم</h1>
        <div className="flex gap-2 items-center">
          <select className="input max-w-28" value={days} onChange={e => setDays(Number(e.target.value))}>
            {[30, 90, 180, 365].map(d => <option key={d} value={d}>آخر {d} يوم</option>)}
          </select>
          <input className="input max-w-40" placeholder="مركز (اختياري)"
                 value={district} onChange={e => setDistrict(e.target.value)} />
          <a className="btn bg-stone-200 text-sm" href={`/api/analytics/export?days=${days}${district ? `&district=${district}` : ""}`}>⬇ CSV</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="التغطية التقديرية" value={k.coverage.coveragePct} unit="%"
              target={k.coverage.coverageTarget} hint="مسجلون ÷ مواليد متوقعين" />
        <Card title="التفعيل" value={k.coverage.activationPct} unit="%" target={70}
              hint="سجل ← أنجز تقييماً" />
        <Card title="التزام نقاط التفتيش" value={k.engagement.onTimePct} unit="%" target={70} />
        <Card title="امتثال SLA الاتصال" value={k.pathway.slaCompliancePct} unit="%" target={95}
              hint="مستوى 4-5: 48س/7 أيام" />
        <Card title="وسيط الإنذار ← التقييم الوجاهي"
              value={k.pathway.t4FaceToFaceDays?.[5] ?? k.pathway.t4FaceToFaceDays?.[4]} unit="يوم"
              target={7} higherBetter={false} />
        <Card title="وسيط زمن مراجعة الأخصائي" value={k.pathway.t1ReviewHours} unit="ساعة" target={48} higherBetter={false} />
        <Card title="PPV الإحالات المغلقة" target={60} value={
          (() => { const L = Object.values(k.accuracy.byLevel) as any[];
            const c = L.reduce((s, v) => s + v.confirmed, 0), f = L.reduce((s, v) => s + v.falseAlarm, 0);
            return c + f > 0 ? Math.round((100 * c) / (c + f)) : null; })() } unit="%" />
        <Card title="تسليم الرسائل" value={k.alerts.totals.sentPct} unit="%" target={95} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-extrabold mb-3">قمع المسار</h2>
          <Bars data={funnelSteps} />
          <p className="text-[11px] text-stone-400 mt-2">
            التسرب بين «محالون» و«تم تقييمهم» = عبء المتابعة على المنسقين.
          </p>
        </div>
        <div className="card">
          <h2 className="font-extrabold mb-3">التسجيل الشهري</h2>
          <Bars data={k.coverage.monthly.map((m: any) => ({ label: m.month, value: m.count }))} />
          <p className="text-[11px] text-stone-400 mt-2">حمل نشط الآن: {k.coverage.pregnancies}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-extrabold mb-3">دقة الإحالات حسب المستوى</h2>
        <table className="w-full text-sm text-right">
          <thead><tr className="text-stone-500 border-b">
            <th className="p-2">المستوى</th><th>محالة</th><th>مؤكدة (منتسبون)</th>
            <th>إنذار كاذب</th><th>معلقة (مراقبة)</th><th>PPV</th></tr