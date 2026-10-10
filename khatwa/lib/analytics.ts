// lib/analytics.ts - M&E aggregate queries (anonymous, k-anonymity)
import { Prisma } from "@prisma/client";
import { db } from "./db";

const MIN_CELL = Number(process.env.MIN_CELL || 5);

const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((100 * a) / b) : null);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000);

export async function coverage(from: Date, district?: string) {
  const dFilter = district ? Prisma.sql`AND district = ${district}` : Prisma.empty;
  const [children, activated, pregnancies, latest] = await Promise.all([
    db.child.count({ where: { createdAt: { gte: from }, ...(district ? { district } : {}) } }),
    db.child.count({ where: { createdAt: { gte: from }, assessments: { some: {} },
                              ...(district ? { district } : {}) } }),
    db.pregnancy.count({ where: { status: "active" } }),
    db.$queryRaw<{ m: Date; c: bigint }[]>`
      SELECT date_trunc('month', "createdAt") AS m, count(*) AS c
      FROM "Child" WHERE "createdAt" >= ${from} ${dFilter}
      GROUP BY 1 ORDER BY 1`,
  ]);
  const months = Math.max(1, (Date.now() - from.getTime()) / (30.44 * 86400_000));
  const expected = Number(process.env.EXPECTED_MONTHLY_BIRTHS || 2700) * months;
  return {
    children, activated, pregnancies,
    activationPct: pct(activated, children),
    coveragePct: expected > 0 ? Math.min(100, Math.round((100 * children) / expected)) : null,
    coverageTarget: Number(process.env.TARGET_COVERAGE_PCT || 30),
    monthly: latest.map(r => ({ month: r.m.toISOString().slice(0, 7), count: n(r.c) })),
  };
}

export async function engagement(from: Date) {
  const [pairs] = await db.$queryRaw<{ total: bigint; on_time: bigint }[]>`
    WITH p AS (
      SELECT level, "createdAt",
             LEAD("createdAt") OVER (PARTITION BY "childId" ORDER BY "createdAt") AS next_at
      FROM "Assessment" WHERE "createdAt" >= ${from})
    SELECT count(*) FILTER (WHERE next_at IS NOT NULL) AS total,
           count(*) FILTER (WHERE next_at IS NOT NULL AND
             EXTRACT(EPOCH FROM (next_at - "createdAt")) / 86400 <=
               (CASE level WHEN 1 THEN 30 WHEN 2 THEN 28 WHEN 3 THEN 14
                           WHEN 4 THEN 7  WHEN 5 THEN 2 END) + 7) AS on_time
    FROM p`;

  const answers = await db.milestoneResponse.groupBy({
    by: ["answer"], where: { createdAt: { gte: from } }, _count: { _all: true } });
  const byAnswer: Record<string, number> = {};
  for (const a of answers) byAnswer[a.answer] = a._count._all;
  const totalAnswers = Object.values(byAnswer).reduce((s, v) => s + v, 0);

  return {
    onTimePct: pct(n(pairs?.on_time), n(pairs?.total)),
    refusalPct: pct(byAnswer.REFUSED ?? 0, totalAnswers),
    lostCount: byAnswer.LOST ?? 0,
    totalAnswers,
  };
}

export async function accuracy(from: Date) {
  const outcomes = await db.$queryRaw<{ level: number; outcome: string | null; c: bigint }[]>`
    SELECT a.level, r.outcome, count(*) AS c
    FROM "Referral" r JOIN "Assessment" a ON a.id = r."assessmentId"
    WHERE r."createdAt" >= ${from} GROUP BY 1, 2 ORDER BY 1`;

  const byLevel: Record<number, { referred: number; confirmed: number; falseAlarm: number;
                                   indeterminate: number; ppv: number | null }> = {};
  for (const r of outcomes) {
    const L = (byLevel[r.level] ||= { referred: 0, confirmed: 0, falseAlarm: 0, indeterminate: 0, ppv: null });
    L.referred += n(r.c);
    if (r.outcome === "enrolled_intervention") L.confirmed += n(r.c);
    else if (r.outcome === "closed_false_alarm") L.falseAlarm += n(r.c);
    else if (r.outcome === "monitor_3m") L.indeterminate += n(r.c);
  }
  for (const L of Object.values(byLevel)) {
    const closed = L.confirmed + L.falseAlarm;
    L.ppv = closed > 0 ? Math.round((100 * L.confirmed) / closed) : null;
  }

  const [ov] = await db.$queryRaw<{ total: bigint; overridden: bigint }[]>`
    SELECT count(*) AS total,
           count(*) FILTER (WHERE overrides IS NOT NULL AND jsonb_array_length(overrides) > 0) AS overridden
    FROM "Assessment" WHERE "createdAt" >= ${from}`;

  return {
    byLevel,
    overridePct: pct(n(ov?.overridden), n(ov?.total)),
    closedTotal: Object.values(byLevel).reduce((s, L) => s + L.confirmed + L.falseAlarm, 0),
  };
}

export async function pathway(from: Date) {
  const [t1] = await db.$queryRaw<{ h: number | null }[]>`
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY
      EXTRACT(EPOCH FROM ("reviewedAt" - "createdAt")) / 3600) AS h
    FROM "Assessment" WHERE "reviewedAt" IS NOT NULL AND "createdAt" >= ${from}`;

  const [t2] = await db.$queryRaw<{ h: number | null }[]>`
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY
      EXTRACT(EPOCH FROM (r."createdAt" - a."createdAt")) / 3600) AS h
    FROM "Referral" r JOIN "Assessment" a ON a.id = r."assessmentId"
    WHERE r."createdAt" >= ${from}`;

  const sla = await db.$queryRaw<{ level: number; total: bigint; within: bigint }[]>`
    SELECT a.level, count(*) AS total,
           count(*) FILTER (WHERE r."contactedAt" IS NOT NULL AND
             EXTRACT(EPOCH FROM (r."contactedAt" - a."createdAt")) <=
               CASE WHEN a.level >= 5 THEN 172800 ELSE 604800 END) AS within
    FROM "Referral" r JOIN "Assessment" a ON a.id = r."assessmentId"
    WHERE a.level >= 4 AND r."createdAt" >= ${from} GROUP BY 1`;

  const t4 = await db.$queryRaw<{ level: number; d: number | null }[]>`
    SELECT a.level, percentile_cont(0.5) WITHIN GROUP (ORDER BY
      EXTRACT(EPOCH FROM (r."assessedAt" - a."createdAt")) / 86400) AS d
    FROM "Referral" r JOIN "Assessment" a ON a.id = r."assessmentId"
    WHERE r."assessedAt" IS NOT NULL AND a.level >= 4 AND r."createdAt" >= ${from}
    GROUP BY 1`;

  const slaTotal = sla.reduce((s, r) => s + n(r.total), 0);
  const slaWithin = sla.reduce((s, r) => s + n(r.within), 0);

  return {
    t1ReviewHours: t1?.h ? Math.round(n(t1.h) * 10) / 10 : null,
    t2ToReferralHours: t2?.h ? Math.round(n(t2.h) * 10) / 10 : null,
    t4FaceToFaceDays: Object.fromEntries(t4.map(r => [r.level, r.d ? Math.round(n(r.d) * 10) / 10 : null])),
    slaCompliancePct: pct(slaWithin, slaTotal),
    slaTotal,
  };
}

export async function impact(from: Date) {
  const rows = await db.$queryRaw<{ child_id: number; first: number; last: number;
                                    fds: unknown; lds: unknown }[]>`
    WITH en AS (SELECT DISTINCT "childId" FROM "Referral"
                WHERE outcome = 'enrolled_intervention' AND "createdAt" >= ${from}),
    fl AS (
      SELECT "childId",
        (array_agg(index ORDER BY "createdAt" ASC))[1]  AS first,
        (array_agg(index ORDER BY "createdAt" DESC))[1] AS last,
        (array_agg("domainScores" ORDER BY "createdAt" ASC))[1]  AS fds,
        (array_agg("domainScores" ORDER BY "createdAt" DESC))[1] AS lds
      FROM "Assessment" WHERE "childId" IN (SELECT "childId" FROM en)
      GROUP BY 1 HAVING count(*) >= 2)
    SELECT * FROM fl LIMIT 300`;

  const domainDelta: Record<string, number[]> = {};
  for (const r of rows) {
    const f = r.fds as Record<string, { pct: number }>, l = r.lds as Record<string, { pct: number }>;
    for (const d of Object.keys(l ?? {}))
      if (f?.[d]) (domainDelta[d] ||= []).push(l[d].pct - f[d].pct);
  }
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

  return {
    enrolledTracked: rows.length,
    avgIndexDelta: rows.length ? Math.round(rows.reduce((s, r) => s + (r.last - r.first), 0) / rows.length) : null,
    improvedPct: rows.length
      ? Math.round((100 * rows.filter(r => r.last < r.first).length) / rows.length) : null,
    domainDelta: Object.fromEntries(
      Object.entries(domainDelta).map(([d, v]) => [d, avg(v)])),
  };
}

export async function alertDelivery(from: Date) {
  const grouped = await db.alert.groupBy({
    by: ["channel", "kind", "status"], where: { createdAt: { gte: from } },
    _count: { _all: true }, _avg: { attempts: true } });

  const per: Record<string, { sent: number; delivered: number; failed: number; queued: number;
                              skipped: number; attempts: number }> = {};
  const bump = (k: string) => (per[k] ||= { sent: 0, delivered: 0, failed: 0, queued: 0, skipped: 0, attempts: 0 });
  for (const g of grouped) {
    const k = `${g.channel}:${g.kind}`, p = bump(k);
    const c = g._count._all;
    if (["SENT", "DELIVERED", "READ"].includes(g.status)) p.sent += c;
    if (["DELIVERED", "READ"].includes(g.status)) p.delivered += c;
    if (g.status === "FAILED") p.failed += c;
    if (g.status === "QUEUED") p.queued += c;
    if (g.status === "SKIPPED") p.skipped += c;
    p.attempts = Math.max(p.attempts, Math.round((g._avg.attempts ?? 0) * 100) / 100);
  }
  const rows = Object.entries(per).map(([k, v]) => ({
    key: k, ...v,
    sentPct: pct(v.sent, v.sent + v.failed),
    deliveredPct: pct(v.delivered, v.sent),
  }));

  const daily = await db.$queryRaw<{ d: Date; c: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS d, count(*) AS c
    FROM "Alert" WHERE "createdAt" >= ${from} GROUP BY 1 ORDER BY 1`;

  const all = Object.values(per).reduce((s, v) => ({
    sent: s.sent + v.sent, delivered: s.delivered + v.delivered,
    failed: s.failed + v.failed, queued: s.queued + v.queued, skipped: s.skipped + v.skipped }),
    { sent: 0, delivered: 0, failed: 0, queued: 0, skipped: 0 });
  return {
    rows,
    daily: daily.map(r => ({ day: r.d.toISOString().slice(0, 10), count: n(r.c) })),
    totals: { ...all,
      sentPct: pct(all.sent, all.sent + all.failed),
      deliveredPct: pct(all.delivered, all.sent) },
  };
}

export async function calibration(from: Date) {
  const rows = await db.$queryRaw<{ item: string; domain: string; sev: string | null;
                                    flagged: bigint; lost: bigint; confirmed: bigint; false_alarm: bigint }[]>`
    SELECT r."itemId" AS item, i.domain, i.sev,
           count(*) AS flagged,
           count(*) FILTER (WHERE r.answer = 'LOST') AS lost,
           count(*) FILTER (WHERE ro.outcome = 'enrolled_intervention') AS confirmed,
           count(*) FILTER (WHERE ro.outcome = 'closed_false_alarm') AS false_alarm
    FROM "MilestoneResponse" r
    JOIN "MilestoneItem" i ON i.id = r."itemId"
    JOIN "Assessment" a ON a."childId" = r."childId" AND a."checkpoint" = r."checkpoint"
    LEFT JOIN "Referral" ro ON ro."assessmentId" = a.id
    WHERE i.gate AND r.answer <> 'ACHIEVED' AND r."createdAt" >= ${from}
    GROUP BY 1, 2, 3
    HAVING count(*) >= ${MIN_CELL}
    ORDER BY flagged DESC LIMIT 60`;

  return rows.map(r => ({
    item: r.item, domain: r.domain, sev: r.sev,
    flagged: n(r.flagged), lost: n(r.lost),
    confirmed: n(r.confirmed), falseAlarm: n(r.false_alarm),
    ppv: n(r.confirmed) + n(r.false_alarm) > 0
      ? Math.round((100 * n(r.confirmed)) / (n(r.confirmed) + n(r.false_alarm))) : null,
  }));
}

export async function funnel(from: Date, district?: string) {
  const [flagged] = await db.$queryRaw<{ c: bigint }[]>`
    SELECT count(*) AS c FROM (
      SELECT DISTINCT ON ("childId") "childId", level FROM "Assessment"
      ORDER BY "childId", "createdAt" DESC) t WHERE level >= 3`;
  const [referred] = await db.$queryRaw<{ c: bigint }[]>`
    SELECT count(DISTINCT r."childId") AS c FROM "Referral" r
    JOIN "Assessment" a ON a.id = r."assessmentId"
    JOIN "Child" c ON c.id = r."childId"
    WHERE r."createdAt" >= ${from} ${district ? Prisma.sql`AND c.district = ${district}` : Prisma.empty}`;
  const [assessed] = await db.$queryRaw<{ c: bigint }[]>`
    SELECT count(*) AS c FROM "Referral" WHERE status IN ('ASSESSED', 'CLOSED') AND "createdAt" >= ${from}`;
  const [enrolled] = await db.$queryRaw<{ c: bigint }[]>`
    SELECT count(*) AS c FROM "Referral" WHERE outcome = 'enrolled_intervention' AND "createdAt" >= ${from}`;

  return { flagged: n(flagged?.c), referred: n(referred?.c),
           assessed: n(assessed?.c), enrolled: n(enrolled?.c) };
}

export async function computeKpis(days: number, district?: string) {
  const from = daysAgo(days);
  const [cov, eng, acc, path, imp, alerts, calib, fun] = await Promise.all([
    coverage(from, district), engagement(from), accuracy(from),
    pathway(from), impact(from), alertDelivery(from), calibration(from), funnel(from, district),
  ]);
  return { generatedAt: new Date().toISOString(), days, district: district || null,
           coverage: cov, engagement: eng, accuracy: acc, pathway: path,
           impact: imp, alerts, calibration: calib, funnel: fun };
}