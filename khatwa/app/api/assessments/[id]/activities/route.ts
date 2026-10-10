export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendedActivities } from "@/lib/activities";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await db.assessment.findUnique({ where: { id: Number(params.id) } });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await recommendedActivities(
    a.domainScores as Record<string, { pct: number; due: number }>,
    a.devAge,
  );
  return NextResponse.json(data);
}