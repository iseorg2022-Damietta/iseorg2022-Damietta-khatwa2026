import { db } from "./db";
export async function rfWeightSum(childId: number): Promise<number> {
  const rfs = await db.childRiskFactor.findMany({ where: { childId, active: true } });
  return rfs.reduce((s, r) => s + r.weight, 0);
}