export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: s.uid } });
  return NextResponse.json({ user });
}