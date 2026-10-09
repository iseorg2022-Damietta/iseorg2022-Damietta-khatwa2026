// lib/levels.ts — المستويات الخمسة: الألوان والإجراءات وSLA
export interface LevelConfig {
  level: number; color: string; bg: string; text: string;
  title: string; meaning: string; action: string; sla: string;
  nextCheckpointDays: number | null;
}

export const LEVELS: Record<number, LevelConfig> = {
  1: { level: 1, color: "#1B7F3B", bg: "bg-l1", text: "أخضر",
    title: "نموّ ضمن المتوقع", meaning: "معالم طفلك تظهر ضمن النطاق الطبيعي لعمره.",
    action: "استمري في الأنشطة التحفيزية المنزلية وأكملي نقاط التفتيش في مواعيدها.",
    sla: "المتابعة الروتينية", nextCheckpointDays: null },
  2: { level: 2, color: "#7CB342", bg: "bg-l2", text: "أخضر ليموني",
    title: "مراقبة نشطة", meaning: "بعض المعالم لم تظهر بعد لكنها لا تزال داخل نافذتها الطبيعية.",
    action: "طبّقي حزمة الأنشطة المستهدفة وأعيدي التقييم بعد 4 أسابيع.",
    sla: "إعادة تقييم بعد 4 أسابيع", nextCheckpointDays: 28 },
  3: { level: 3, color: "#F9A825", bg: "bg-l3", text: "أصفر",
    title: "تأخر محدود", meaning: "تأخر في مجال واحد دون تجاوز العمر الحدي للمعلم.",
    action: "استشارة أخصائي عن بُعد + خطة منزلية، وسيصلك اتصال خلال 14 يوماً.",
    sla: "استشارة خلال 14 يوماً", nextCheckpointDays: 14 },
  4: { level: 4, color: "#EF6C00", bg: "bg-l4", text: "برتقالي",
    title: "إنذار تأكيدي", meaning: "تجاوز عمر حدّي لمعلم أو تأخر في مجالين أو أكثر.",
    action: "إحالة لتقييم وجهاً لوجه — سيتم الاتصال بكِ لحجز موعد خلال 7 أيام.",
    sla: "تقييم خلال 7 أيام", nextCheckpointDays: 7 },
  5: { level: 5, color: "#C62828", bg: "bg-l5", text: "أحمر",
    title: "طارئ — إحالة فورية", meaning: "علامة إنذار كبيرة (أو فقدان مهارة مكتسبة) تحتاج فحصاً سريعاً.",
    action: "سيتم الاتصال بكِ هاتفياً خلال 48 ساعة لتحديد أقرب موعد تقييم. لا داعي للهلع — الخطوة الصحيحة في وقتها تصنع الفرق.",
    sla: "اتصال خلال 48 ساعة", nextCheckpointDays: 2 },
};

export const DOMAIN_NAMES: Record<string, string> = {
  GM: "الحركي الكبير", FM: "الحركي الدقيق", CO: "التواصل واللغة",
  SE: "الاجتماعي–الانفعالي", CP: "المعرفي واللعب", SC: "الاستقلالية والرعاية الذاتية",
};

export const GATE_SEVERITY: Record<string, number> = { medium: 25, high: 50, critical: 75 };