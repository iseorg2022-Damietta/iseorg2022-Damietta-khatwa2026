export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const facilities = await db.facility.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ facilities });
}