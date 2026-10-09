import { PrismaClient } from "@prisma/client";
import catalog from "../data/catalog.json";
const db = new PrismaClient();

async function main() {
  await db.milestoneResponse.deleteMany();   // بيئة التطوير فقط
  await db.milestoneItem.deleteMany();
  await db.contentActivity.deleteMany();

  for (const m of catalog.milestones)
    await db.milestoneItem.upsert({ where: { id: m.id }, update: { ...m }, create: { ...m } });
  for (const a of catalog.activities)
    await db.contentActivity.upsert({ where: { id: a.id }, update: { ...a }, create: { ...a } });

  const facilities = [
    { name: "وحدة التدخل المبكر — مستشفى دمياط التعليمي", type: "early_intervention", district: "دمياط", services: "تقييم نمائي، تخاطب، وظائف", contact: "01112773477", mou: true },
    { name: "مركز تنمية مهارات الطفل — الجميلة", type: "therapy", district: "الجميلة", services: "تخاطب، تعليمي", contact: "", mou: false },
    { name: "وحدة السمعيات التوازن — مستشفى دمياط العام", type: "audiology", district: "دمياط", services: "ABR، أجهزة سمعية", contact: "01112773477", mou: true },
    { name: "عيادة الأعصاب والأطفال — مستشفى المنزلة", type: "neuro", district: "المنزلة", services: "تشنج، نمائي", contact: "", mou: false },
  ];
  for (const f of facilities) {
    const found = await db.facility.findFirst({ where: { name: f.name } });
    if (!found) await db.facility.create({ data: f });
  }

  const demo = [
    { phone: "201000000000", name: "أم تجريبية", role: "MOTHER" as const },
    { phone: "201000000001", name: "د. أخصائي نمائي", role: "SPECIALIST" as const },
    { phone: "201000000002", name: "منسق إحالات", role: "COORDINATOR" as const },
  ];
  for (const u of demo) await db.user.upsert({ where: { phone: u.phone }, update: {}, create: u });

  const mother = await db.user.findUnique({ where: { phone: "201000000000" } });
  if (mother && !(await db.child.findFirst({ where: { userId: mother.id } }))) {
    const child = await db.child.create({ data: {
      userId: mother.id, name: "آدم", gender: "male", district: "دمياط",
      birthDate: new Date(Date.now() - 14 * 30.44 * 86400000),
      gaWeeks: 38, birthWeightG: 2700, jaundicePhoto: true, hearingScreen: "PASS", nicuDays: 2,
    }});
    const rf = catalog.riskFactors.find(r => r.code === "JAUND_PHOTO")!;
    await db.childRiskFactor.create({ data: { childId: child.id, code: rf.code, label: rf.label, weight: rf.weight, category: rf.cat } });
  }
  console.log("✅ Seed complete — 152 معلماً + 38 عاملاً + 162 نشاطاً");
}
main().finally(() => db.$disconnect());