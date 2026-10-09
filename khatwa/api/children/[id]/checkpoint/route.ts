import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { computeRisk, dueItems, devAgeMonths, buildFinalAnswers } from "@/lib/engine";
import { rfWeightSum } from "@/lib/rf";
import { notifyAssessment } from "@/lib/notify/dispatch";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const child = await db.child.findUnique({ where: { id: Number(params.id) } });
  if (!child) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (s.role === "MOTHER" && child.userId !== s.uid)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const checkpoint = Number(body?.checkpoint);
  const answers: Record<string, string> = body?.answers ?? {};
  if (!Number.isInteger(checkpoint) || checkpoint < 1)
    return NextResponse.json({ error: "checkpoint غير صالح" }, { status: 400 });

  /* منع الازدواج: ضغطة مزدوجة/إعادة مزامنة تعيد التقييم الموجود */
  const existing = await db.assessment.findFirst({ where: { childId: child.id, checkpoint } });
  if (existing)
    return NextResponse.json({ assessmentId: existing.id,
      level: existing.adjustedLevel || existing.level, duplicate: true });

  const items = (await db.milestoneItem.findMany({ where: { active: true } })) as any;
  const { chrono, dev } = devAgeMonths(child);
  const prior = await db.milestoneResponse.findMany({ where: { childId: child.id } });
  const preSet = new Set(prior.filter(r => r.answer === "ACHIEVED").map(r => r.itemId));
  const due = dueItems(items, dev, preSet);
  const finalAnswers = buildFinalAnswers(due, answers, preSet);
  const result = computeRisk(child, finalAnswers, items, await rfWeightSum(child.id), preSet);

  for (const [itemId, answer] of Object.entries(finalAnswers))
    await db.milestoneResponse.upsert({
      where: { childId_itemId_checkpoint: { childId: child.id, itemId, checkpoint } },
      update: { answer }, create: { childId: child.id, itemId, checkpoint, answer } });

  const assessment = await db.assessment.create({ data: {
    childId: child.id, checkpoint, chronoAge: chrono, devAge: dev,
    index: result.index, level: result.level,
    delayScore: result.delayScore, redFlagScore: result.redFlagScore, rfScore: result.rfScore,
    domainScores: result.domainScores, redFlags: result.redFlags,
    overrides: result.overrides, narrative: result.narrative } });

  try { await notifyAssessment(child.id, assessment); }   // إشعارات المستويات 3-5
  catch (e) { console.error("notify failed", e); }

  return NextResponse.json({ assessmentId: assessment.id, level: result.level, overrides: result.overrides });
}