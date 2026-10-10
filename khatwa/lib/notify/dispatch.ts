// lib/notify/dispatch.ts - notification queue, templates, routing
import { db } from "@/lib/db";
import { sendSMS, sendWhatsAppTemplate } from "./providers";
import { toE164 } from "@/lib/phone";
import { SITE } from "@/lib/site";

const HOTLINE = () => process.env.HOTLINE_PHONE || SITE.phone;
const DRY = () => process.env.NOTIFY_DRY_RUN === "true";
const KILL = () => process.env.NOTIFY_ENABLED === "false";

const SMS_TEMPLATES: Record<string, (v: any) => string> = {
  OTP: (v) => `\u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u064a\u0642: ${v.code} \u2014 \u0635\u0627\u0644\u062d 5 \u062f\u0642\u0627\u0626\u0642 (\u0645\u0646\u0635\u0629 \u062e\u0637\u0648\u0629)`,
  LEVEL3_MOTHER: (v) => `\u062e\u0637\u0648\u0629: \u064a\u064f\u0646\u0635\u062d \u0628\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0623\u062e\u0635\u0627\u0626\u064a \u0639\u0646 \u0628\u0639\u062f \u0644${v.name}. \u0633\u064a\u062a\u0645 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u062e\u0644\u0627\u0644 14 \u064a\u0648\u0645\u0627\u064b. \u062c\u0631\u0651\u0628\u064a \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629 \u0641\u064a \u0627\u0644\u062a\u0642\u0631\u064a\u0631.`,
  LEVEL4_MOTHER: (v) => `\u062e\u0637\u0648\u0629: \u064a\u064f\u0646\u0635\u062d \u0628\u062a\u0642\u064a\u064a\u0645 \u0648\u062c\u0647\u0627\u064b \u0644\u0648\u062c\u0647 \u0644${v.name}. \u0633\u064a\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0643 \u062e\u0644\u0627\u0644 7 \u0623\u064a\u0627\u0645 \u0644\u062d\u062c\u0632 \u0645\u0648\u0639\u062f. \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629 \u062a\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0622\u0646.`,
  LEVEL5_MOTHER: (v) => `\u062e\u0637\u0648\u0629: \u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u064a\u0648\u0645 \u0644${v.name} \u0623\u0638\u0647\u0631 \u0639\u0644\u0627\u0645\u0629 \u0645\u0647\u0645\u0629 \u062a\u062d\u062a\u0627\u062c \u0627\u0646\u062a\u0628\u0627\u0647\u0627\u064b \u0633\u0631\u064a\u0639\u0627\u064b. \u0633\u064a\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0643 \u062e\u0644\u0627\u0644 48 \u0633\u0627\u0639\u0629. \u0644\u0627 \u062f\u0627\u0639\u064a \u0644\u0644\u0647\u0644\u0639 \u2014 \u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629 \u0628\u0648\u0642\u062a\u0647\u0627 \u062a\u0635\u0646\u0639 \u0627\u0644\u0641\u0631\u0642. \u0627\u0633\u062a\u0641\u0633\u0627\u0631: ${HOTLINE()}`,
  REFERRAL_MOTHER: (v) => `\u062e\u0637\u0648\u0629: \u062a\u0645 \u062d\u062c\u0632 \u0645\u0633\u0627\u0631 \u062a\u0642\u064a\u064a\u0645 \u0644${v.name} \u0641\u064a: ${v.facility}. \u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641: ${v.due}. \u0646\u0631\u062c\u0648 \u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645.`,
  SPECIALIST_CASE: (v) => `\u062e\u0637\u0648\u0629: \u062d\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629 \u0645\u0633\u062a\u0648\u0649 ${v.level} \u2014 ${v.name}\u060c \u0645\u0624\u0634\u0631 ${v.index}/100. \u0627\u0644\u062f\u062e\u0648\u0644: ${v.url}`,
  CHECKPOINT_REMINDER: (v) => `\u062e\u0637\u0648\u0629: \u062d\u0627\u0646 \u0648\u0642\u062a \u0646\u0642\u0637\u0629 \u062a\u0641\u062a\u064a\u0634 ${v.name}: ${v.url}`,
};

const WA_TEMPLATES: Record<string, { name: string; build: (v: any) => string[] }> = {
  LEVEL4_MOTHER: { name: "khatwa_level4", build: (v) => [v.name] },
  LEVEL5_MOTHER: { name: "khatwa_level5", build: (v) => [v.name, HOTLINE()] },
  REFERRAL_MOTHER: { name: "khatwa_referral", build: (v) => [v.name, v.facility, v.due] },
  CHECKPOINT_REMINDER: { name: "khatwa_reminder", build: (v) => [v.name, v.url] },
};

interface DispatchInput {
  kind: string; phone: string; vars: Record<string, string>;
  channels?: ("SMS" | "WHATSAPP")[]; childId?: number;
  assessmentId?: number; referralId?: number; sourceId?: string | number;
}

export async function dispatch(input: DispatchInput) {
  if (KILL()) return { skipped: true };
  const phone = toE164(input.phone);
  const created: string[] = [];
  for (const ch of input.channels || ["SMS"]) {
    const body = SMS_TEMPLATES[input.kind]?.(input.vars);
    if (!body) continue;
    const wa = WA_TEMPLATES[input.kind];
    if (ch === "WHATSAPP" && !wa) continue;
    const dedupeKey = `${input.kind}:${ch}:${input.childId ?? 0}:${input.sourceId ?? 0}:${phone}`;
    const alert = await db.alert.upsert({ where: { dedupeKey }, update: {}, create: {
      dedupeKey, channel: ch, kind: input.kind, recipient: phone,
      body: ch === "SMS" ? body : `[WA:${wa!.name}] ${body}`,
      vars: input.vars as any,
      childId: input.childId ?? null, assessmentId: input.assessmentId ?? null,
      referralId: input.referralId ?? null } });
    created.push(`${alert.id}:${ch}`);
  }
  if (!DRY()) await processQueue(10);
  return { queued: created };
}

export async function processQueue(limit = 20) {
  const now = new Date();
  const batch = await db.alert.findMany({
    where: { status: { in: ["QUEUED", "FAILED"] },
      OR: [{ nextAttempt: null }, { nextAttempt: { lte: now } }] },
    orderBy: { createdAt: "asc" }, take: limit });
  for (const a of batch) {
    if (DRY()) { await db.alert.update({ where: { id: a.id },
      data: { status: "SKIPPED", lastError: "DRY_RUN" } }); continue; }
    const result = a.channel === "WHATSAPP"
      ? await sendWhatsApp(a)
      : await sendSMS(a.recipient, a.body);
    await db.alert.update({ where: { id: a.id }, data: {
      status: result.ok ? "SENT" : "FAILED",
      provider: result.provider, providerRef: result.providerRef ?? a.providerRef,
      lastError: result.error ?? null, attempts: { increment: 1 },
      sentAt: result.ok ? new Date() : null,
      nextAttempt: result.ok ? null
        : a.attempts + 1 >= 3 ? null : new Date(Date.now() + (a.attempts + 1) ** 2 * 5 * 60_000) } });
  }
  return batch.length;
}

async function sendWhatsApp(a: { recipient: string; kind: string; vars: any }) {
  const wa = WA_TEMPLATES[a.kind];
  if (!wa) return { ok: false, provider: "META_WA", error: "NO_TEMPLATE" };
  return sendWhatsAppTemplate(a.recipient, wa.name, wa.build((a.vars as Record<string, string>) || {}));
}

export async function notifyAssessment(childId: number, a: { id: number; level: number; index: number }) {
  if (a.level < 3) return;
  const child = await db.child.findUnique({
    where: { id: childId }, include: { user: { select: { phone: true } } } });
  if (!child?.user?.phone) return;
  await dispatch({ kind: `LEVEL${a.level}_MOTHER`, phone: child.user.phone,
    vars: { name: child.name },
    channels: a.level >= 4 ? ["SMS", "WHATSAPP"] : ["SMS"],
    childId, assessmentId: a.id, sourceId: a.id });
  await notifySpecialists({ level: a.level, name: child.name, index: a.index, childId, sourceId: a.id });
}

export async function notifySpecialists(v: { level: number; name: string; index: number;
  childId: number; sourceId: number }) {
  const staff = await db.user.findMany({
    where: { role: { in: ["SPECIALIST", "COORDINATOR"] } }, select: { phone: true } });
  for (const s of staff) if (s.phone)
    await dispatch({ kind: "SPECIALIST_CASE", phone: s.phone,
      vars: { level: String(v.level), name: v.name, index: String(v.index),
              url: `${process.env.APP_BASE_URL || ""}/specialist` },
      channels: ["SMS"], childId: v.childId, sourceId: v.sourceId });
}

export async function dispatchDueReminders() {
  const NEXT: Record<number, number> = { 1: 30, 2: 28, 3: 14, 4: 7, 5: 2 };
  const children = await db.child.findMany({
    include: { assessments: { orderBy: { createdAt: "desc" }, take: 1 },
               user: { select: { phone: true } } } });
  let sent = 0;
  for (const c of children) {
    const last = c.assessments[0];
    if (!last || !c.user?.phone) continue;
    const due = new Date(last.createdAt).getTime() + (NEXT[last.adjustedLevel || last.level] ?? 30) * 86400_000;
    if (Date.now() < due) continue;
    const r = await dispatch({ kind: "CHECKPOINT_REMINDER", phone: c.user.phone,
      vars: { name: c.name, url: `${process.env.APP_BASE_URL || ""}/child/${c.id}/checkpoint` },
      channels: (last.adjustedLevel || last.level) >= 4 ? ["SMS", "WHATSAPP"] : ["SMS"],
      childId: c.id, sourceId: `cp:${last.checkpoint}:remind` });
    sent += r.queued?.length ?? 0;
  }
  return sent;
}