import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(_r: Request, { params }: { params: { id: string } }) {
  const s = getSessionUser();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const child = await db.child.findUnique({
    where: { id: Number(params.id) },
    include: {
      riskFactors: { where: { active: true } },
      assessments: { orderBy: { createdAt: "desc" }, take: 12 },
    } });
  if (!child) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (s.role === "MOTHER" && child.userId !== s.uid)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ child });
}