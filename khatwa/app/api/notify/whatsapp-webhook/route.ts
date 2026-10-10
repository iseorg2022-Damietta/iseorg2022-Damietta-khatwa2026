export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("hub.verify_token") !== process.env.WHATSAPP_VERIFY_TOKEN)
    return new NextResponse("forbidden", { status: 403 });
  return new NextResponse(searchParams.get("hub.challenge") || "", { status: 200 });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const st of change?.value?.statuses ?? []) {
        const map: Record<string, string> = {
          sent: "SENT", delivered: "DELIVERED", read: "READ", failed: "FAILED",
        };
        const status = map[st.status];
        if (!status) continue;
        const alert = await db.alert.findFirst({ where: { providerRef: st.id } });
        if (alert) await db.alert.update({
          where: { id: alert.id },
          data: { status, lastError: st.errors?.[0]?.title ?? null },
        });
      }
    }
  }
  return NextResponse.json({ ok: true });
}