import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import catalog from "@/data/catalog.json";

export async function GET() {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const children = await db.child.findMany({
    where: { userId: s.uid },
    include: { assessments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const child = await db.child.create({ data: {
    userId: s.uid, name: b.name, gender: b.gender || null,
    birthDate: new Date(b.birthDate), gaWeeks: Number(b.gaWeeks) || 40,
    birthWeightG: b.birthWeightG ? Number(b.birthWeightG) : null,
    apgar5: b.apgar5 ? Number(b.apgar5) : null, deliveryType: b.deliveryType || null,
    district: b.district || null,
    nicuDays: Number(b.nicuDays) || 0,
    jaundicePhoto: !!b.jaundicePhoto, jaundiceExch: !!b.jaundiceExch,
    neonatalSeiz: !!b.neonatalSeiz, hearingScreen: b.hearingScreen || "UNKNOWN",
    ivhGrade: b.ivhGrade ? Number(b.ivhGrade) : null, hie: !!b.hie,
    ventilationDays: Number(b.ventilationDays) || 0, ototoxic: !!b.ototoxic,
    consanguinity: !!b.consanguinity, familyHistory: b.familyHistory || null } });

  /* الاشتقاق الآلي لعوامل الخطورة من بيانات الميلاد */
  const derived: { code: string; label: string; weight: number; cat: string }[] = [];
  const push = (code: string) => { const rf = catalog.riskFactors.find(r => r.code === code);
    if (rf) derived.push({ code: rf.code, label: rf.label, weight: rf.weight, cat: rf.cat }); };
  if (child.gaWeeks < 32) push("PRETERM_LT32"); else if (child.gaWeeks < 37) push("PRETERM_32_36");
  if ((child.birthWeightG ?? 9999) < 1500) push("BW_LT1500");
  else if ((child.birthWeightG ?? 9999) < 2500) push("BW_LT2500");
  if ((child.apgar5 ?? 10) <= 5) push("APGAR5_LOW");
  if (child.hie) push("HIE");
  if (child.neonatalSeiz) push("SEIZURES_NN");
  if ((child.ivhGrade ?? 0) >= 3) push("IVH_34");
  if (child.jaundiceExch) push("JAUND_EXCH");
  if (child.jaundicePhoto) push("JAUND_PHOTO");
  if (child.nicuDays > 5) push("NICU_GT5");
  if (child.ventilationDays > 0) push("VENT");
  if (child.ototoxic) push("OTOXIC");
  if (child.hearingScreen === "REFER") push("HEAR_REFER");
  if (child.consanguinity) push("CONSANG");
  if (child.familyHistory && child.familyHistory.trim().length > 2) push("FAM_HX");
  for (const d of derived) await db.childRiskFactor.create({ data: { childId: child.id, ...d } });
  return NextResponse.json({ child, riskFactors: derived });
}