// lib/activities.ts - server-side activity recommendation
import { db } from "./db";

export async function recommendedActivities(
  domainScores: Record<string, { pct: number; due: number }>,
  devAge: number,
) {
  const sorted = Object.entries(domainScores).sort((x, y) => x[1].pct - y[1].pct);
  const lowest = sorted.slice(0, 2).map(([d]) => d);
  const isEnrichment = sorted.length > 0 && sorted.every(([, v]) => v.pct >= 80);

  const fetchFor = (domains: string[], lo: number, hi: number) =>
    db.contentActivity.findMany({
      where: { domain: { in: domains }, amin: { lte: hi }, amax: { gte: lo }, active: true },
      orderBy: [{ domain: "asc" }, { amin: "asc" }],
    });

  let activities = await fetchFor(lowest, devAge - 1, devAge + 1);
  if (activities.length < 4) activities = await fetchFor(lowest, devAge - 3, devAge + 3);
  if (activities.length < 4) activities = await fetchFor(lowest, 0, 72);

  return { isEnrichment, focusDomains: lowest, activities };
}