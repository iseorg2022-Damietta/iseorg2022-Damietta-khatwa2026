"use client";
import { SITE } from "@/lib/site";

export default function Offline() {
  return (
    <div className="card max-w-lg mx-auto mt-12 text-center space-y-4">
      <p className="text-4xl">📴</p>
      <h1 className="text-xl font-extrabold">أنتِ الآن دون اتصال</h1>
      <p className="text-stone-600 text-sm leading-relaxed">
        نقاط التفتيش المخزّنة تعمل كالمعتاد، وأي تقييم أنجزتيه دون اتصال
        سيتزامن تلقائياً مع المنصة عند عودة الشبكة — لا تحتاجين لفعل شيء.
      </p>
      <button className="btn-primary" onClick={() => (location.href = "/dashboard")}>الرئيسية</button>
      <p className="text-xs text-stone-500">
        للمساعدة: {SITE.phone} (اتصال/واتساب) · {SITE.email}
      </p>
    </div>
  );
}