export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const s = getSessionUser();
  if (!s || !["SPECIALIST", "COORDINATOR", "ADMIN", "DIAGNOSTICIAN"].includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const cases = await db.assessment.findMany({
    where: { level: { gte: 3 }, reviewedBy: null },
    include: { child: { include: { user: { select: { phone: true, name: true } } } } },
    orderBy: [{ level: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ cases });
}