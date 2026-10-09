import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { dispatch } from "@/lib/notify/dispatch";

export async function GET() {
  const s = getSessionUser();
  if (!s || s.role === "MOTHER")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const referrals = await db.referral.findMany({
    include: { child: true, facility: true, assessment: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ referrals });
}

export async function POST(req: Request) {
  const s = getSessionUser();
  if (!s || !["SPECIALIST", "COORDINATOR", "ADMIN"].includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { assessmentId, facilityId, notes } = await req.json();
  const a = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });

  const level = a.adjustedLevel || a.level;
  const urgency = level >= 5 ? "IMMEDIATE_48H" : level === 4 ? "SCHEDULED_7D" : "TELECONSULT";
  const dueHours = urgency === "IMMEDIATE_48H" ? 48 : urgency === "SCHEDULED_7D" ? 168 : 336;

  const referral = await db.referral.create({
    data: {
      childId: a.childId, assessmentId, facilityId: Number(facilityId),
      urgency, notes: notes || null,
      dueAt: new Date(Date.now() + dueHours * 3600000),
    },
  });

  /* إشعار الأم بالمسار (SMS + WhatsApp بقوالب معتمدة) */
  try {
    const child = await db.child.findUnique({ where: { id: a.childId } });
    const mother = child && await db.user.findUnique({
      where: { id: child.userId }, select: { phone: true } });
    const facility = await db.facility.findUnique({ where: { id: Number(facilityId) } });
    if (mother && facility) await dispatch({
      kind: "REFERRAL_MOTHER", phone: mother.phone,
      vars: { name: child!.name, facility: facility.name,
              due: referral.dueAt.toLocaleDateString("ar-EG") },
      channels: ["SMS", "WHATSAPP"],
      childId: child!.id, referralId: referral.id, sourceId: referral.id,
    });
  } catch (e) { console.error("notify failed", e); }

  return NextResponse.json({ referral });
}

export async function PATCH(req: Request) {
  const s = getSessionUser();
  if (!s || s.role === "MOTHER")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id, status, outcome } = await req.json();

  const cur = await db.referral.findUnique({ where: { id } });
  const referral = await db.referral.update({
    where: { id },
    data: {
      status, outcome: outcome || null,
      contactedAt: status === "CONTACTED" && !cur?.contactedAt ? new Date() : cur?.contactedAt,
      assessedAt:  status === "ASSESSED"   && !cur?.assessedAt  ? new Date() : cur?.assessedAt,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });
  return NextResponse.json({ referral });
}