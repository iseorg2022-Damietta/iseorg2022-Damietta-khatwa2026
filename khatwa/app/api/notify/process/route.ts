export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { processQueue, dispatchDueReminders } from "@/lib/notify/dispatch";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const processed = await processQueue(20);
  const reminders = process.env.ENABLE_REMINDERS === "true"
    ? await dispatchDueReminders() : 0;

  return NextResponse.json({ processed, reminders, at: new Date().toISOString() });
}