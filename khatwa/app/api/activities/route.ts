export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const activities = await db.contentActivity.findMany({ where: { active: true } });
  return NextResponse.json({ activities });
}