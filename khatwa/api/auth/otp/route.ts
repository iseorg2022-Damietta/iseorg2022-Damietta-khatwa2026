import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEgyptianMobile, toE164 } from "@/lib/phone";
import { dispatch } from "@/lib/notify/dispatch";

export async function POST(req: Request) {
  let { phone } = await req.json();
  if (!isValidEgyptianMobile(phone || ""))
    return NextResponse.json({ error: "رقم موبايل مصري غير صالح" }, { status: 400 });
  phone = toE164(phone);
  let user = await db.user.findUnique({ where: { phone } });
  if (!user) user = await db.user.create({ data: { phone } });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const store = (globalThis as any).__otpStore || new Map();
  (globalThis as any).__otpStore = store;
  store.set(phone, { code, exp: Date.now() + 5 * 60000 });
  let devCode: string | undefined;
  if (process.env.NODE_ENV !== "production") devCode = code;
  else if (process.env.NOTIFY_DRY_RUN !== "true")
    await dispatch({ kind: "OTP", phone, vars: { code }, channels: ["SMS"],
                     sourceId: Math.floor(Date.now() / 60_000) });
  return NextResponse.json({ ok: true, devCode });
}