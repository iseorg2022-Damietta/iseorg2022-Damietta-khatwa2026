export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { computeKpis } from "@/lib/analytics";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const rows = (head: string[], body: unknown[][]) =>
  [head.map(esc).join(","), ...body.map(r => r.map(esc).join(","))].join("\n");

export async function GET(req: Request) {
  const s = getSessionUser();
  if (!s || !["ADMIN", "SPECIALIST"].includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const k = await computeKpis(Number(searchParams.get("days")) || 90,
                              searchParams.get("district") || undefined);

  const csv = [
    `# \u0645\u0646\u0635\u0629 \u062e\u0637\u0648\u0629 M&E \u2014 ${k.generatedAt} \u2014 \u0622\u062e\u0631 ${k.days} \u064a\u0648\u0645\u0627\u064b`,
    rows(["\u0627\u0644\u0645\u0624\u0634\u0631", "\u0627\u0644\u0642\u064a\u0645\u0629"], [
      ["\u0623\u0637\u0641\u0627\u0644 \u0645\u0633\u062c\u0644\u0648\u0646", k.coverage.children],
      ["\u0645\u0641\u0639\u0651\u0644\u0648\u0646", k.coverage.activated],
      ["\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644 %", k.coverage.activationPct],
      ["\u0627\u0644\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629 %", k.coverage.coveragePct],
      ["\u0627\u0644\u062a\u0632\u0627\u0645 \u0646\u0642\u0627\u0637 \u0627\u0644\u062a\u0641\u062a\u064a\u0634 %", k.engagement.onTimePct],
      ["\u0645\u0639\u062f\u0644 \u0627\u0644\u0631\u0641\u0636 %", k.engagement.refusalPct],
      ["\u062a\u062c\u0627\u0648\u0632 \u0642\u0648\u0627\u0639\u062f \u0627\u0644\u062a\u062c\u0627\u0648\u0632 %", k.accuracy.overridePct],
      ["\u0627\u0645\u062a\u062b\u0627\u0644 SLA %", k.pathway.slaCompliancePct],
      ["\u0648\u0633\u064a\u0637 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u062e\u0635\u0627\u0626\u064a (\u0633\u0627\u0639\u0629)", k.pathway.t1ReviewHours],
      ["\u0648\u0633\u064a\u0637 \u062a\u0642\u064a\u064a\u0645\u2192\u0625\u062d\u0627\u0644\u0629 (\u0633\u0627\u0639\u0629)", k.pathway.t2ToReferralHours],
      ["\u0645\u0646\u062a\u0633\u0628\u0648\u0646 \u0645\u062a\u062a\u0628\u0639\u0648\u0646", k.impact.enrolledTracked],
      ["\u0645\u062a\u0648\u0633\u0637 \u062a\u063a\u064a\u0631 \u0645\u0624\u0634\u0631 \u0627\u0644\u062e\u0637\u0631", k.impact.avgIndexDelta],
      ["\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u062d\u0633\u0646 %", k.impact.improvedPct],
      ["\u062a\u0633\u0644\u064a\u0645 SMS/WA %", k.alerts.totals.sentPct],
    ]),
    `## \u062f\u0642\u0629 \u0627\u0644\u0625\u062d\u0627\u0644\u0627\u062a \u0628\u0627\u0644\u0645\u0633\u062a\u0648\u0649`,
    rows(["\u0627\u0644\u0645\u0633\u062a\u0648\u0649", "\u0645\u062d\u0627\u0644\u0629", "\u0645\u0624\u0643\u062f\u0629", "\u0625\u0646\u0630\u0627\u0631 \u0643\u0627\u0630\u0628", "\u0645\u0639\u0644\u0642\u0629", "PPV %"],
      Object.entries(k.accuracy.byLevel).map(([l, v]) =>
        [l, v.referred, v.confirmed, v.falseAlarm, v.indeterminate, v.ppv ?? "\u2014"])),
    `## \u0645\u0639\u0627\u064a\u0631\u0629 \u0627\u0644\u0628\u0646\u0648\u062f`,
    rows(["\u0627\u0644\u0628\u0646\u062f", "\u0627\u0644\u0645\u062c\u0627\u0644", "\u0627\u0644\u0634\u062f\u0629", "\u0625\u0646\u0630\u0627\u0631\u0627\u062a", "\u0627\u0646\u062d\u062f\u0627\u0631", "\u0645\u0624\u0643\u062f\u0629", "\u0643\u0627\u0630\u0628\u0629", "PPV %"],
      k.calibration.map(c => [c.item, c.domain, c.sev, c.flagged, c.lost,
                              c.confirmed, c.falseAlarm, c.ppv ?? "\u2014"])),
  ].join("\n\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8",
               "Content-Disposition": `attachment; filename="khatwa-me-${Date.now()}.csv"` },
  });
}