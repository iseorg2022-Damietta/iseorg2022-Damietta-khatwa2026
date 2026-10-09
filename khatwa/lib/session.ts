// lib/session.ts — جلسات موقّعة بـ HMAC (بلا تبعيات إضافية)
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "khatwa_session";

export interface SessionUser { uid: number; role: string; }

export function signSession(payload: SessionUser): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token?: string): SessionUser | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig !== expect) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); }
  catch { return null; }
}

export function getSessionUser(): SessionUser | null {
  return verifySession(cookies().get(COOKIE)?.value);
}

export function setSessionCookie(payload: SessionUser) {
  cookies().set(COOKIE, signSession(payload), {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 60 * 60 * 24 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie() { cookies().delete(COOKIE); }