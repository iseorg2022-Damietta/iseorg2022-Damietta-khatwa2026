// lib/notify/providers.ts — الإرسال الفعلي فقط: SMS Misr ← Victory Link + Meta WhatsApp
// كل دالة تعيد { ok, provider, providerRef?, error? } — لا تُلقي استثناءات

export interface SendResult {
  ok: boolean;
  provider: string;
  providerRef?: string;
  error?: string;
}

const TIMEOUT_MS = 10_000;

async function post(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

/* ---------------- SMS Misr (الأساسي) ---------------- */
async function sendSmsMisr(toE164Phone: string, message: string): Promise<SendResult> {
  const username = process.env.SMSMISR_USERNAME;
  const password = process.env.SMSMISR_PASSWORD;
  const sender   = process.env.SMSMISR_SENDER;
  if (!username || !password || !sender)
    return { ok: false, provider: "SMSMISR", error: "CONFIG_MISSING" };

  const body = new URLSearchParams({
    environment: process.env.SMSMISR_ENV || "2",   // 1=test 2=live
    username, password, sender,
    mobile: toE164Phone,                            // 2010xxxxxxxx
    message,
    language: "2",                                  // عربي (Unicode)
  });

  try {
    const r = await post("https://www.smsmisr.com/api/send/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const j = await r.json().catch(() => ({}));
    const ok = String(j?.Code) === "1901";
    return {
      ok,
      provider: "SMSMISR",
      providerRef: ok ? j?.MessageID || j?.SMSID || undefined : undefined,
      error: ok ? undefined
        : ({ "1902": "بيانات دخول خاطئة", "1903": "لا يوجد رصيد",
             "1904": "معطيات ناقصة", "1905": "اسم المرسل غير معتمد",
             "1906": "رقم غير صالح", "1907": "حساب غير مفعّل" } as Record<string, string>)[String(j?.Code)]
          || `SMSMISR_${j?.Code ?? r.status}`,
    };
  } catch (e: any) {
    return { ok: false, provider: "SMSMISR", error: e?.message || "NETWORK" };
  }
}

/* ---------------- Victory Link (الاحتياطي) ---------------- */
async function sendVictoryLink(toE164Phone: string, message: string): Promise<SendResult> {
  const u = process.env.VL_USERNAME, p = process.env.VL_PASSWORD;
  const s = process.env.VL_SENDER;
  if (!u || !p || !s) return { ok: false, provider: "VICTORYLINK", error: "CONFIG_MISSING" };

  const qs = new URLSearchParams({
    UserName: u, Password: p,
    SMSText: message,
    SMSLang: "a",                                    // a = عربي
    SMSSender: s,
    SMSReceiver: toE164Phone,                        // 2010xxxxxxxx
  });
  try {
    const r = await post(`https://sms.victorylink.com/api/smsSend.aspx?${qs}`, { method: "GET" });
    const text = (await r.text()).trim();
    const ok = text === "0" || text.startsWith("msgid");
    return { ok, provider: "VICTORYLINK", providerRef: ok ? text : undefined,
             error: ok ? undefined : `VL_${text}` };
  } catch (e: any) {
    return { ok: false, provider: "VICTORYLINK", error: e?.message || "NETWORK" };
  }
}

/* SMS بتبديل تلقائي: الأساسي ← الاحتياطي */
export async function sendSMS(toE164Phone: string, message: string): Promise<SendResult> {
  const primary = await sendSmsMisr(toE164Phone, message);
  if (primary.ok) return primary;
  const fallback = await sendVictoryLink(toE164Phone, message);
  if (fallback.ok) return fallback;
  return { ...primary, error: `primary:${primary.error} | fallback:${fallback.error}` };
}

/* ---------------- WhatsApp — Meta Cloud API (قوالب معتمدة) ---------------- */
export async function sendWhatsAppTemplate(
  toE164Phone: string,
  templateName: string,
  params: string[],
): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const ver = process.env.WHATSAPP_VERSION || "v19.0";
  if (!token || !phoneId)
    return { ok: false, provider: "META_WA", error: "CONFIG_MISSING" };

  try {
    const r = await post(`https://graph.facebook.com/${ver}/${phoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toE164Phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_LANG || "ar" },
          components: params.length
            ? [{ type: "body", parameters: params.map(t => ({ type: "text", text: t })) }]
            : [],
        },
      }),
    });
    const j = await r.json().catch(() => ({}));
    const ok = r.ok && !!j?.messages?.[0]?.id;
    return {
      ok, provider: "META_WA",
      providerRef: ok ? j.messages[0].id : undefined,
      error: ok ? undefined : `META_${j?.error?.code ?? r.status}:${j?.error?.message ?? ""}`,
    };
  } catch (e: any) {
    return { ok: false, provider: "META_WA", error: e?.message || "NETWORK" };
  }
}