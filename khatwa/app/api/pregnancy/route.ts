export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import catalog from "@/data/catalog.json";

export async function GET() {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = await db.pregnancy.findFirst({
    where: { userId: s.uid, status: "active" }, include: { events: true },
  });
  return NextResponse.json({ pregnancy: p,
    catalog: catalog.riskFactors.filter(r => ["pregnancy", "family"].includes(r.cat)) });
}

export async function POST(req: Request) {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lmpDate, selectedCodes } = await req.json();
  let p = await db.pregnancy.findFirst({ where: { userId: s.uid, status: "active" } });
  if (!p) p = await db.pregnancy.create({ data: { userId: s.uid, lmpDate: lmpDate ? new Date(lmpDate) : null } });

  for (const code of selectedCodes || []) {
    const rf = catalog.riskFactors.find(r => r.code === code);
    if (rf) await db.pregnancyEvent.create({
      data: { pregnancyId: p.id, category: rf.cat, code: rf.code, label: rf.label, weight: rf.weight },
    });
  }
  return NextResponse.json({ ok: true });
}