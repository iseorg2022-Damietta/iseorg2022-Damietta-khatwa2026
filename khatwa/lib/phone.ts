// lib/phone.ts — تحقق وتوحيد أرقام الموبايل المصرية
// الأرقام المصرية: 010/011/012/015 + 8 خانات

export function isValidEgyptianMobile(phone: string): boolean {
  return /^01[0125][0-9]{8}$/.test(phone.trim());
}

/** 01012345678 → 201012345678 (صيغة E.164 بلا + — المقبولة لدى SMS Misr وMeta) */
export function toE164(phone: string): string {
  const p = phone.trim().replace(/^\+?20/, "").replace(/\D/g, "");
  const local = p.startsWith("0") ? p : "0" + p;
  return "20" + local.slice(1);
}

export function prettyPhone(phone: string): string {
  const e = toE164(phone);
  return `+${e.slice(0, 2)} ${e.slice(2, 5)} ${e.slice(5, 8)} ${e.slice(8)}`;
}