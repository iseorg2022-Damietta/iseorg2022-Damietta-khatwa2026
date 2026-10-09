import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { devAgeMonths, dueItems } from "@/lib/engine";
import { rfWeightSum } from "@/lib/rf";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = getSessionUser();
  const child = await db.child.findUnique({ where: { id: Number(params.id) } });
  if (!child || !s) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (s.role === "MOTHER" && child.userId !== s.uid)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const lastCp = await db.assessment.findFirst({
    where: { childId: child.id }, orderBy: { checkpoint: "desc" } });
  const checkpoint = (lastCp?.checkpoint || 0) + 1;
  const { dev } = devAgeMonths(child);
  const items = await db.milestoneItem.findMany({ where: { active: true } });

  /* ① أولاً: مجموعة "المحقق سابقاً" ثم تمريرها (تطابق تام مع POST) */
  const prior = await db.milestoneResponse.findMany({ where: { childId: child.id } });
  const preSet = new Set(prior.filter(r => r.answer === "ACHIEVED").map(r => r.itemId));
  const due = dueItems(items as any, dev, preSet);

  return NextResponse.json({
    checkpoint, devAge: dev,
    childCore: { birthDate: child.birthDate, gaWeeks: child.gaWeeks },
    items: due.map(i => ({ ...i, preAchieved: i.kind !== "regression" && preSet.has(i.id) })),
    rfWeightSum: await rfWeightSum(child.id),
  });
}