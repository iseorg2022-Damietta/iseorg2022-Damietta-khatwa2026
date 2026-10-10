export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await db.assessment.findUnique({
    where: { id: Number(params.id) },
    include: { child: true },
  });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ assessment: a });
}