import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/session";
import { SITE } from "@/lib/site";
import PwaRegister from "@/components/pwa-register";
import SyncIndicator from "@/components/sync-indicator";

export const viewport: Viewport = { themeColor: "#0E5A6D", width: "device-width", initialScale: 1 };
export const metadata: Metadata = {
  title: SITE.name,
  description: "رصد النمو من الجنين حتى 6 سنوات — كشف مبكر، إحالة، تدخل",
  icons: { icon: "/icon.svg", apple: "/icon-apple.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const role = getSessionUser()?.role;
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="bg-brand text-white shadow">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-extrabold text-lg leading-tight">
              منصة د. عبد الناصر أنيس عبد الوهاب
              <span className="block text-xs font-normal opacity-80">للكشف المبكر والإحالة للتدخل</span>
            </a>
            <nav className="text-sm flex gap-4">
              {role && role !== "MOTHER" && <a href="/analytics" className="hover:underline">التحليلات</a>}
              {role && role !== "MOTHER" && <a href="/specialist" className="hover:underline">الحالات</a>}
              <a href="/dashboard" className="hover:underline">لوحتي</a>
              <a href="/login" className="hover:underline">دخول</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="mt-16 border-t border-stone-200 py-8 text-center text-xs text-stone-500 space-y-2">
          <p className="font-bold text-stone-600">مشروع خيري — أداة رصد مبكر وليست تشخيصاً طبياً · دمياط ← مصر</p>
          <p>
            للتواصل والدعم: 📞 {SITE.phone}
            {" · "}<a className="text-brand underline" href={SITE.whatsapp} target="_blank">واتساب {SITE.phone}</a>
            {" · "}✉️ <a className="text-brand underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </footer>
        <PwaRegister />
        <SyncIndicator />
      </body>
    </html>
  );
}