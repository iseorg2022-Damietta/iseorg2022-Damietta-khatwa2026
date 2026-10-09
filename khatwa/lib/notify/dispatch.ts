import { db } from "@/lib/db";
import { sendSMS, sendWhatsAppTemplate } from "./providers";
import { toE164 } from "@/lib/phone";
import { SITE } from "@/lib/site";

const HOTLINE = () => process.env.HOTLINE_PHONE || SITE.phone;
const DRY = () => process.env.NOTIFY_DRY_RUN === "true";
const KILL = () => process.env.NOTIFY_ENABLED === "false";

const SMS_TEMPLATES: Record<string, (v: any) => string> = {
  OTP: (v) => `رمز التحقق: ${v.code} — صالح 5 دقائق (منصة خطوة)`,
  LEVEL3_MOTHER: (v) => `خطوة: يُنصح باستشارة أخصائي عن بعد ل${v.name}. سيتم التواصل خلال 14 يوماً. جرّبي الأنشطة المنزلية في التقرير.`,
  LEVEL4_MOTHER: (v) => `خطوة: يُنصح بتقييم وجهاً لوجه ل${v.name}. سيتم الاتصال بك خلال 7 أيام لحجز موعد. الأنشطة المنزلية تساعدك الآن.`,
  LEVEL5_MOTHER: (v) => `خطوة: تقييم اليوم ل${v.name} أظهر علامة مهمة تحتاج انتباهاً سريعاً. سيتم الاتصال بك خلال 48 ساعة. لا داعي للهلع — الخطوة الصحيحة بوقتها تصنع الفرق. استفسار: ${HOTLINE()}`,
  REFERRAL_MOTHER: (v) => `خطوة: تم حجز مسار تقييم ل${v.name} في: ${v.facility}. الموعد المستهدف: ${v.due}. نرجو الالتزام.`,
  SPECIALIST_CASE: (v) => `خطوة: حالة جديدة مستوى ${v.level} — ${v.name}، مؤشر ${v.index}/100. الدخول: ${v.url}`,
  CHECKPOINT_REMINDER: (v) => `خطوة: حان وقت نقطة تفتيش ${v.name} (دقيقتان فقط): ${v.url}`,
};
const WA_TEMPLATES: Record<string, { name: string; build: (v: any) => string[] }> = {
  LEVEL4_MOTHER: { name: "khatwa_level4", build: (v) => [v.name] },
  LEVEL5_MOTHER: { name: "khatwa_level5", build: (v) => [v.name, HOTLINE()] },
  REFERRAL_MOTHER: { name: "khatwa_referral", build: (v) => [v.name, v.facility, v.due] },
  CHECKPOINT_REMINDER: { name: "khatwa_reminder", build: (v) => [v.name, v.url] },
};

interface DispatchInput { kind: string; phone: string; vars: Record<string, string>;
  channels?: ("SMS" | "WHATSAPP")[]; childId?: number; assessmentId?: number; referralId?: number;
  sourceId?: string | number; }

export async function dispatch(input: DispatchInput) {
  if (KILL()) return { skipped: true };
  const phone = toE164(input.phone);
  const created: string[] = [];
  for (const ch of input.channels || ["SMS"]) {
    const body = SMS_TEMPLATES[input.kind]?.(input.vars);
    if (!body) continue;
    const wa = WA_TEMPLATES[input.kind];
    if (ch === "WHATSAPP" && !wa) continue;
    /* التصحيح: المستلم جزء من مفتاح التكرار — إشعار الأخصائيين المتعددين لا يبتلع بعضه */
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

/* التصحيح: قراءة vars المخزنة مباشرة — لا تفكيك نصي */
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