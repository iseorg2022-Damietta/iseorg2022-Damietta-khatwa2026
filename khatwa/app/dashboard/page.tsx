"use client";
import { useEffect, useState } from "react";
import { RiskBadge } from "@/components/ui";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">أطفالي</h1>
        <div className="flex gap-2">
          <a href="/pregnancy" className="btn bg-stone-200">حمل جديد</a>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ إضافة طفل</button>
        </div>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <h2 className="font-extrabold">بيانات الميلاد (لحساب الخطر الأساسي واشتقاق عوامل الخطورة آلياً)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">اسم الطفل</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">تاريخ الميلاد</label>
              <input type="date" className="input" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} /></div>
            <div><label className="label">عمر الحمل بالأسابيع</label>
              <input type="number" className="input" value={form.gaWeeks} onChange={e => setForm({ ...form, gaWeeks: e.target.value })} /></div>
            <div><label className="label">وزن الميلاد (جرام)</label>
              <input type="number" className="input" value={form.birthWeightG} onChange={e => setForm({ ...form, birthWeightG: e.target.value })} /></div>
            <div><label className="label">أبغار الدقيقة 5</label>
              <input type="number" className="input" value={form.apgar5} onChange={e => setForm({ ...form, apgar5: e.target.value })} /></div>
            <div><label className="label">أيام العناية المركزة</label>
              <input type="number" className="input" value={form.nicuDays} onChange={e => setForm({ ...form, nicuDays: e.target.value })} /></div>
            <div><label className="label">المركز/المدينة (للتغطية الجغرافية)</label>
              <input className="input" placeholder="دمياط / رأس البر / السرو..."
                     value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
            <div><label className="label">فحص السمع</label>
              <select className="input" value={form.hearingScreen} onChange={e => setForm({ ...form, hearingScreen: e.target.value })}>
                <option value="UNKNOWN">لم يتم / لا أعرف</option>
                <option value="PASS">نجح</option><option value="REFER">إحالة</option>
              </select></div>
            <div className="col-span-2"><label className="label">تاريخ عائلي (إعاقة/توحد/تأخر لغة)</label>
              <input className="input" value={form.familyHistory} onChange={e => setForm({ ...form, familyHistory: e.target.value })} /></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {[["jaundicePhoto","يرقان احتاج أشعة"],["jaundiceExch","يرقان احتاج تبديل دم"],
              ["neonatalSeiz","نوبات صرعية"],["consanguinity","زواج أقارب"]].map(([k, lbl]) => (
              <label key={k as string} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form[k as string]} onChange={e => setForm({ ...form, [k as string]: e.target.checked })} />
                {lbl}
              </label>))}
          </div>
          <button className="btn-primary" onClick={addChild}>حفظ الطفل</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children.map(c => {
          const a = c.assessments?.[0];
          return (
            <a key={c.id} href={`/child/${c.id}`} className="card hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold">{c.name}</h3>
                {a ? <RiskBadge level={a.adjustedLevel || a.level} /> : <span className="text-sm text-stone-400">لا تقييم بعد</span>}
              </div>
              <p className="text-sm text-stone-500 mt-1">
                {c.district ? `${c.district} · ` : ""}
                {a ? `آخر مؤشر خطر: ${a.index}/100` : "ابدئي أول تقييم خطوة الآن"}
              </p>
            </a>);
        })}
      </div>
    </div>
  );
}