import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function PATCH(req: Request) {
  const s = getSessionUser();
  if (!s || !["SPECIALIST", "ADMIN"].includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { assessmentId, action, newLevel, reason } = await req.json();

  const a = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });

  let level = a.level;
  if (action === "downgrade") {
    if (!reason) return NextResponse.json({ error: "مبرر التخفيض إلزامي" }, { status: 400 });
    level = Math.min(a.level, Number(newLevel) || a.level - 1);
  } else if (action === "upgrade") {
    level = Math.max(a.level, Number(newLevel) || a.level + 1);
  }

  const updated = await db.assessment.update({
    where: { id: assessmentId },
    data: { reviewedBy: s.uid, reviewedAt: new Date(),
            adjustedLevel: level !== a.level ? level : null, reviewNote: reason || null },
  });
  return NextResponse.json({ assessment: updated });
}