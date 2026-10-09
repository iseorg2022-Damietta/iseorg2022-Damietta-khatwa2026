import { GATE_SEVERITY, LEVELS, DOMAIN_NAMES } from "./levels";

export type Answer = "ACHIEVED" | "NOT_YET" | "LOST" | "REFUSED";
export interface EngineItem { id: string; kind: string; domain: string; wmin: number; wmax: number;
  weight: number; gate: boolean; limitAge: number | null; sev: string | null; stem: string; }
export interface EngineChild { birthDate: Date; gaWeeks: number; }
export interface EngineResult { index: number; level: number; delayScore: number; redFlagScore: number;
  rfScore: number; domainScores: Record<string, { pct: number; due: number }>;
  redFlags: { itemId: string; stem: string; domain: string; sev: string; lost?: boolean }[];
  narrative: string; overrides: string[]; }

export function devAgeMonths(child: EngineChild, ref: Date = new Date()) {
  const birth = new Date(child.birthDate).getTime();
  const chrono = Math.max(0, (ref.getTime() - birth) / (1000 * 60 * 60 * 24 * 30.4375));
  const correction = (Math.max(0, 40 - child.gaWeeks) * 7) / 30.4375;
  const dev = chrono >= 24 ? chrono : Math.max(0, chrono - correction);
  return { chrono: Math.round(chrono * 10) / 10, dev: Math.round(dev * 10) / 10 };
}

export function dueItems(items: EngineItem[], dev: number,
  answeredAchieved: Set<string> = new Set()): EngineItem[] {
  const regression = items.filter(i => i.kind === "regression");
  const normal = items.filter(i => i.kind !== "regression");
  const due = normal.filter(i => dev >= i.wmin && dev <= i.wmax);
  const overdue = normal.filter(i => i.gate && i.limitAge !== null && dev > i.wmax
    && dev >= i.limitAge && !answeredAchieved.has(i.id));
  const merged = [...due, ...overdue];
  if (merged.length < 5) {
    const ids = new Set(merged.map(i => i.id));
    merged.push(...normal.filter(i => !ids.has(i.id) && dev >= i.wmin - 3 && dev <= i.wmax + 3));
  }
  return [...regression, ...merged];
}

export function buildFinalAnswers(due: EngineItem[], answers: Record<string, string>,
  preAchievedIds: Set<string>): Record<string, Answer> {
  const VALID: Answer[] = ["ACHIEVED", "NOT_YET", "LOST", "REFUSED"];
  const out: Record<string, Answer> = {};
  for (const i of due) {
    if (i.kind !== "regression" && preAchievedIds.has(i.id)) out[i.id] = "ACHIEVED";
    else if (VALID.includes(answers[i.id] as Answer)) out[i.id] = answers[i.id] as Answer;
    else out[i.id] = "REFUSED";
  }
  return out;
}

export function computeRisk(child: EngineChild, responses: Record<string, Answer>,
  items: EngineItem[], activeRiskFactorWeightSum: number,
  answeredAchieved: Set<string> = new Set()): EngineResult {
  const { dev } = devAgeMonths(child);
  const due = dueItems(items, dev, answeredAchieved);
  const milestones = due.filter(i => i.kind !== "regression");
  const overrides: string[] = [];

  const anyLost = Object.values(responses).includes("LOST");
  const lostItems = due.filter(i => responses[i.id] === "LOST");

  const totalW = milestones.reduce((s, i) => s + i.weight, 0);
  const achievedW = milestones.filter(i => responses[i.id] === "ACHIEVED").reduce((s, i) => s + i.weight, 0);
  const delayScore = totalW ? 100 * (1 - achievedW / totalW) : 0;

  const failedGates = milestones.filter(i => i.gate && i.limitAge !== null
    && dev >= i.limitAge && responses[i.id] !== "ACHIEVED");
  const redFlagScore = Math.min(100,
    failedGates.reduce((s, i) => s + (GATE_SEVERITY[i.sev || "medium"] || 25), 0));
  const rfScore = Math.min(100, activeRiskFactorWeightSum);
  const index = Math.round(0.45 * delayScore + 0.35 * redFlagScore + 0.20 * rfScore);

  let level = index <= 15 ? 1 : index <= 30 ? 2 : index <= 50 ? 3 : index <= 75 ? 4 : 5;
  const failedDomains = new Set(failedGates.map(i => i.domain));
  if (anyLost) { level = 5; overrides.push("فقدان مهارة مكتسبة (Regression) → مستوى 5 إلزامي"); }
  else if (failedGates.length >= 2 && failedDomains.size >= 2) {
    level = 5; overrides.push("فشل بوابتين حدّيتين في مجالين مختلفين → مستوى 5");
  } else if (failedGates.length >= 1) { level = Math.max(level, 4);
    overrides.push("تجاوز عمر حدّي لمعلم → المستوى 4 على الأقل"); }

  const domainScores: EngineResult["domainScores"] = {};
  for (const d of Object.keys(DOMAIN_NAMES)) {
    const dm = milestones.filter(i => i.domain === d);
    if (!dm.length) continue;
    const tw = dm.reduce((s, i) => s + i.weight, 0);
    const aw = dm.filter(i => responses[i.id] === "ACHIEVED").reduce((s, i) => s + i.weight, 0);
    domainScores[d] = { pct: tw ? Math.round((100 * aw) / tw) : 100, due: dm.length };
  }

  const redFlags = [
    ...lostItems.map(i => ({ itemId: i.id, stem: i.stem, domain: i.domain, sev: "critical", lost: true })),
    ...failedGates.filter(i => responses[i.id] !== "LOST")
      .map(i => ({ itemId: i.id, stem: i.stem, domain: i.domain, sev: i.sev || "medium" })),
  ];
  const narrative = buildNarrative(level, domainScores, redFlags, dev, overrides, anyLost);
  return { index, level, delayScore: Math.round(delayScore), redFlagScore: Math.round(redFlagScore),
    rfScore: Math.round(rfScore), domainScores, redFlags, narrative, overrides };
}

function buildNarrative(level: number, ds: EngineResult["domainScores"],
  redFlags: EngineResult["redFlags"], dev: number, overrides: string[], anyLost: boolean): string {
  const cfg = LEVELS[level];
  const strengths = Object.entries(ds).filter(([, v]) => v.pct >= 80).map(([k]) => DOMAIN_NAMES[k]);
  const weak = Object.entries(ds).filter(([, v]) => v.pct < 60).map(([k]) => DOMAIN_NAMES[k]);
  let t = `${cfg.title}: ${cfg.meaning}\n\n`;
  if (anyLost) t += "⚠️ الأهم: ورد أن طفلك توقف عن مهارة كان يتقنها. هذه أولوية التقييم الفوري " +
    "أياً كانت باقي النتائج — لا تعني بالضرورة حالة خطيرة لكنها تستوجب الفحص بسرعة.\n\n";
  if (strengths.length) t += `نقاط القوة: نموّ ظاهر في ${strengths.join("، ")}. مبروك عليكِ — استمري في التحفيز.\n`;
  if (weak.length) t += `مجالات تحتاج دعماً: ${weak.join("، ")}. الأنشطة المنزلية المرفقة مستهدفة لهذه المجالات.\n`;
  if (redFlags.length) t += `\nعلامات تستدعي انتباه الأخصائي:\n` +
    redFlags.map(r => `• ${r.stem} (${DOMAIN_NAMES[r.domain]})`).join("\n");
  if (overrides.length) t += `\n\nقواعد الإنذار المطبَّقة آلياً: ${overrides.join(" | ")}.`;
  t += `\n\nالخطوة التالية: ${cfg.action}\n`;
  t += `\nتنبيه: هذا التقرير أداة رصد مبكر وليس تشخيصاً طبياً؛ التشخيص يتطلب تقييماً متخصصاً وجهاً لوجه. ` +
       `عمر طفلك محسوب الآن بـ${dev} شهراً نمائياً (مصحّحاً للولادة المبكرة حتى 24 شهراً).`;
  return t;
}