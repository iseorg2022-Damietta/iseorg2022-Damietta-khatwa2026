// lib/activities-client.ts — مرآة عميل لاختيار الأنشطة (تعمل دون اتصال)
export interface ActivityLite {
  id: string; domain: string; amin: number; amax: number;
  title: string; steps: string[]; materials: string; why: string; warn?: string | null;
}

export function pickActivities(
  list: ActivityLite[],
  domainScores: Record<string, { pct: number; due: number }>,
  devAge: number,
) {
  const sorted = Object.entries(domainScores).sort((x, y) => x[1].pct - y[1].pct);
  const lowest = sorted.slice(0, 2).map(([d]) => d);
  const isEnrichment = sorted.length > 0 && sorted.every(([, v]) => v.pct >= 80);
  const fetchFor = (ds: string[], lo: number, hi: number) =>
    list.filter(a => ds.includes(a.domain) && a.amin <= hi && a.amax >= lo);
  /* دوائر التوسع الثلاث كما في الخادم */
  let acts = fetchFor(lowest, devAge - 1, devAge + 1);
  if (acts.length < 4) acts = fetchFor(lowest, devAge - 3, devAge + 3);
  if (acts.length < 4) acts = list.filter(a => lowest.includes(a.domain));
  return { isEnrichment, focusDomains: lowest, activities: acts };
}