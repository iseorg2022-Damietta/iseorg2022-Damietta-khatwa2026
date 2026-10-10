export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { computeKpis } from "@/lib/analytics";

export async function GET(req: Request) {
  const s = getSessionUser();
  if (!s || s.role === "MOTHER")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(730, Math.max(7, Number(searchParams.get("days")) || 90));
  const district = searchParams.get("district") || undefined;

  return NextResponse.json(await computeKpis(days, district));
}