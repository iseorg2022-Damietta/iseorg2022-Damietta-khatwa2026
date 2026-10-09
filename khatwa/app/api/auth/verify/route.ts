import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

const otpStore = (globalThis as any).__otpStore || new Map();
(globalThis as any).__otpStore = otpStore;

export async function POST(req: Request) {
  const { phone, code } = await req.json();
  const rec = otpStore.get(phone);
  if (!rec || rec.exp < Date.now() || rec.code !== code)
    return NextResponse.json({ error: "رمز غير صحيح أو منتهي" }, { status: 401 });
  otpStore.delete(phone);
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) return NextResponse.json({ error: "مستخدم غير موجود" }, { status: 404 });
  setSessionCookie({ uid: user.id, role: user.role });
  return NextResponse.json({ ok: true, role: user.role, name: user.name });
}