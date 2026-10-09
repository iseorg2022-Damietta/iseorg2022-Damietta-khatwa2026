import { LEVELS } from "@/lib/levels";
import { SITE } from "@/lib/site";

const STEPS = [
  { n: "١", t: "سجّلي طفلك", d: "بيانات الحمل والميلاد ببساطة خلال دقيقتين" },
  { n: "٢", t: "وقت خطوة", d: "أسئلة قصيرة حسب عمر طفلك — دقيقتان كل فترة" },
  { n: "٣", t: "تقرير ملون فوري", d: "خمسة مستويات من الأخضر إلى الأحمر توضح الوضع" },
  { n: "٤", t: "إحالة وتدخل", d: "الأخصائي يتواصل ويحجز التقييم في المركز المناسب" },
];

export default function Landing() {
  return (
    <div className="space-y-14">
      <section className="text-center pt-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-brand leading-snug">
          منصة الأستاذ الدكتور عبد الناصر أنيس عبد الوهاب
        </h1>
        <p className="text-xl md:text-2xl font-bold mt-3 text-stone-700">للكشف المبكر والإحالة للتدخل</p>
        <p className="mt-5 text-stone-600 max-w-2xl mx-auto leading-relaxed">
          رفيقتك في رحلة نمو طفلك من الحمل حتى 6 سنوات: سجلي المعالم النمائية، احصلي على تقييم
          فوري بمؤشر خطر كمي وكيفي، وعند الحاجة تتم الإحالة لأخصائي مؤهل —
          لأن <b>أول 1000 يوم تصنع العمر كله</b>.
        </p>
        <div className="mt-7 flex gap-3 justify-center">
          <a href="/login" className="btn-primary text-lg px-8">ابدئي الآن مجاناً</a>
          <a href="/login" className="btn bg-stone-200 text-stone-700">دخول أخصائي</a>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold text-center mb-6">نظام التنبيه الخماسي الملون</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(l => (
            <div key={l} className="rounded-2xl p-4 text-white shadow" style={{ backgroundColor: LEVELS[l].color }}>
              <div className="text-3xl font-extrabold">{l}</div>
              <div className="font-bold mt-1">{LEVELS[l].title}</div>
              <div className="text-xs opacity-90 mt-1">{LEVELS[l].sla}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {STEPS.map(s => (
          <div key={s.n} className="card text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand text-white text-xl font-extrabold flex items-center justify-center">{s.n}</div>
            <h3 className="font-extrabold mt-3">{s.t}</h3>
            <p className="text-sm text-stone-600 mt-1">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="card bg-brand text-white text-center">
        <p className="text-lg font-bold">زر «أنا قلقة» — دخول فوري للتقييم</p>
        <p className="text-sm opacity-90 mt-1">في أي وقت وأنتِ قلقة، افتحي تقييماً فورياً خارج المواعيد.</p>
      </section>

      <section className="card text-center">
        <h2 className="text-xl font-extrabold">تواصلي معنا</h2>
        <p className="mt-3 text-lg font-bold text-brand">📞 {SITE.phone}</p>
        <p className="mt-1"><a className="btn bg-l1 text-white" href={SITE.whatsapp} target="_blank">واتساب مباشر: {SITE.phone}</a></p>
        <p className="mt-3">✉️ <a className="text-brand underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
      </section>
    </div>
  );
}