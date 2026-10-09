// components/ui.tsx — المكونات المشتركة: شارة المستوى + المؤشر الحلقي + أشرطة المجالات
import { LEVELS, DOMAIN_NAMES } from "@/lib/levels";

export function RiskBadge({ level }: { level: number }) {
  const cfg = LEVELS[level];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-bold"
          style={{ backgroundColor: cfg.color }}>
      <span className="w-2 h-2 rounded-full bg-white/80" />
      {cfg.title}
    </span>
  );
}

export function Gauge({ index, level }: { index: number; level: number }) {
  const cfg = LEVELS[level];
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#E7E5E4" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={cfg.color} strokeWidth="12"
                strokeDasharray={`${(index / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color: cfg.color }}>{index}</span>
        <span className="text-xs text-stone-500">مؤشر الخطر /100</span>
      </div>
    </div>
  );
}

export function DomainBars({ scores }: { scores: Record<string, { pct: number; due: number }> }) {
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([d, v]) => (
        <div key={d}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">{DOMAIN_NAMES[d]}</span>
            <span className="text-stone-500">{v.pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${v.pct}%`,
                          backgroundColor: v.pct >= 80 ? "#1B7F3B" : v.pct >= 60 ? "#F9A825" : "#C62828" }} />
          </div>
        </div>
      ))}
    </div>
  );
}