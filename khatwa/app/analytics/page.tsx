"use client";
import { useEffect, useState } from "react";
import { DOMAIN_NAMES } from "@/lib/levels";

function verdict(value: number | null | undefined, target: number, higherBetter = true): string {
  if (value === null || value === undefined) return "text-stone-400";
  const ok = higherBetter ? value >= target : value <= target;
  const near = higherBetter ? value >= target * 0.8 : value <= target * 1.5;
  return ok ? "text-l1" : near ? "text-l3" : "text-l5";
}

function Card({ title, value, unit, target, higherBetter = true, hint }: {
  title: string; value: number | string | null; unit?: string;
  target?: number; higherBetter?: boolean; hint?: string;
}) {
  const v = typeof value === "number" ? verdict(value, target ?? 0, higherBetter) : "text-stone-700";
  return (
    <div className="card">
      <p className="text-xs text-stone-500">{title}</p>
      <p className={`text-3xl font-extrabold mt-1 ${v}`}>
        {value ?? "\u2014"}{unit && <span className="text-base font-bold"> {unit}</span>}
      </p>
      {target !== undefined && typeof value === "number" &&
        <p className="text-[11px] text-stone-400 mt-1">{"\u0627\u0644\u0647\u062f\u0641: "}{target}{unit}</p>}
      {hint && <p className="text-[11px] text-stone-400">{hint}</p>}
    </div>
  );
}

function Bars({ data, color = "#0E5A6D" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-1.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-stone-500">{d.label}</span>
          <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(100 * d.value) / max}%`, backgroundColor: color }} />
          </div>
          <span className="w-10 text-left font-bold">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function QUAM(n: string): string {
  const M: Record<string, string> = {
    "2": "\u0642\u0645\u0639 \u0627\u0644\u0645\u0633\u0627\u0631",
    "3": "\u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0634\u0647\u0631\u064a",
    "4": "\u062d\u0645\u0644 \u0646\u0634\u0637 \u0627\u0644\u0622\u0646:",
    "5": "\u062f\u0642\u0629 \u0627\u0644\u0625\u062d\u0627\u0644\u0627\u062a \u062d\u0633\u0628 \u0627\u0644\u0645\u0633\u062a\u0648\u0649",
    "6": "\u0627\u0644\u0645\u0633\u062a\u0648\u0649", "7": "\u0645\u062d\u0627\u0644\u0629", "8": "\u0645\u0624\u0643\u062f\u0629",
    "9": "\u0625\u0646\u0630\u0627\u0631 \u0643\u0627\u0630\u0628", "10": "\u0645\u0639\u0644\u0642\u0629",
    "11": "\u0645\u0633\u062a\u0648\u0649",
    "12": "\u0644\u0627 \u0625\u062d\u0627\u0644\u0627\u062a \u0645\u063a\u0644\u0642\u0629 \u0628\u0639\u062f \u0641\u064a \u0627\u0644\u0641\u062a\u0631\u0629",
    "13": "\u0643\u062b\u0627\u0641\u0629 \u0642\u0648\u0627\u0639\u062f \u0627\u0644\u062a\u062c\u0627\u0648\u0632:",
    "14": "\u0645\u0646 \u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u2014 \u0627\u0631\u062a\u0641\u0627\u0639\u0647\u0627 \u0641\u0648\u0642 40% \u064a\u0639\u0646\u064a \u0623\u0646 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u062a\u062d\u062a\u0627\u062c \u0645\u0639\u0627\u064a\u0631\u0629",
    "15": "\u0645\u0639\u0627\u064a\u0631\u0629 \u0627\u0644\u0628\u0646\u0648\u062f \u0627\u0644\u0625\u0646\u0630\u0627\u0631\u064a\u0629",
    "16": "\u0627\u0644\u0628\u0646\u0648\u062f \u0630\u0627\u062a PPV \u0645\u0646\u062e\u0641\u0636 \u0645\u062a\u0643\u0631\u0631\u0629 \u0627\u0644\u0625\u0646\u0630\u0627\u0631 \u0645\u0631\u0634\u062d\u0629 \u0644\u062e\u0641\u0636 \u0627\u0644\u0648\u0632\u0646 \u0623\u0648 \u0627\u0644\u0634\u062f\u0629 \u2014 \u0627\u0644\u062e\u0644\u0627\u064a\u0627 \u0623\u0635\u063a\u0631 \u0645\u0646 5 \u0645\u062e\u0641\u0627\u0629 \u062e\u0635\u0648\u0635\u064a\u0629",
    "17": "\u0627\u0644\u0628\u0646\u062f", "18": "\u0627\u0644\u0645\u062c\u0627\u0644", "19": "\u0634\u062f\u0629", "20": "\u0625\u0646\u0630\u0627\u0631\u0627\u062a",
    "21": "\u0627\u0646\u062d\u062f\u0627\u0631", "22": "\u0645\u0624\u0643\u062f\u0629", "23": "\u0643\u0627\u0630\u0628\u0629",
    "24": "\u0644\u0627 \u0628\u064a\u0627\u0646\u0627\u062a \u0643\u0627\u0641\u064a\u0629 \u0628\u0639\u062f \u2014 \u064a\u0638\u0647\u0631 \u0627\u0644\u062c\u062f\u0648\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0628\u0639\u062f \u062a\u0631\u0627\u0643\u0645 \u0627\u0644\u0625\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0645\u063a\u0644\u0642\u0629",
    "25": "\u0623\u062b\u0631 \u0627\u0644\u062a\u062f\u062e\u0644 (\u0627\u0644\u0645\u0646\u062a\u0633\u0628\u0648\u0646)",
    "26": "\u0645\u062a\u062a\u0628\u0639\u0648\u0646 \u0628\u062a\u0642\u064a\u064a\u0645\u064a\u0646 \u0641\u0623\u0643\u062b\u0631:",
    "27": "\u0645\u062a\u0648\u0633\u0637 \u062a\u063a\u064a\u0631 \u0645\u0624\u0634\u0631 \u0627\u0644\u062e\u0637\u0631:",
    "28": "\u0633\u0627\u0644\u0628 = \u062a\u062d\u0633\u0646",
    "29": "\u0646\u0633\u0628\u0629 \u0645\u0646 \u062a\u062d\u0633\u0646\u0648\u0627:",
    "30": "\u062a\u062d\u0633\u0646 \u0627\u0644\u0645\u062c\u0627\u0644\u0627\u062a \u0628\u0639\u062f \u0627\u0644\u062a\u062f\u062e\u0644",
    "31": "\u0627\u0644\u0642\u064a\u0645: \u0645\u062a\u0648\u0633\u0637 \u0641\u0631\u0642 \u0627\u0644\u0646\u0633\u0628\u0629 \u0627\u0644\u0645\u0626\u0648\u064a\u0629 \u0642\u0628\u0644/\u0628\u0639\u062f (\u0627\u0644\u0623\u0639\u0644\u0649 \u0623\u0641\u0636\u0644)",
    "32": "\u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a (\u0645\u0646 \u062c\u062f\u0648\u0644 Alert \u0645\u0628\u0627\u0634\u0631\u0629)",
    "33": "\u0627\u0644\u0642\u0646\u0627\u0629:\u0627\u0644\u0646\u0648\u0639", "34": "\u0623\u0631\u0633\u0644\u062a", "35": "\u0648\u0635\u0644\u062a (WA)",
    "36": "\u0641\u0634\u0644\u062a", "37": "\u0628\u0627\u0644\u0637\u0627\u0628\u0648\u0631", "38": "\u0645\u062d\u0627\u0648\u0644\u0627\u062a \u0648\u0633\u0637", "39": "\u0645\u0639\u062f\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644",
    "40": "\u0627\u0644\u062d\u062c\u0645 \u0627\u0644\u064a\u0648\u0645\u064a (\u0627\u0644\u0641\u062a\u0631\u0629 \u0643\u0644\u0647\u0627)",
    "41": "\u0628\u064a\u0627\u0646\u0627\u062a \u062a\u062c\u0645\u0639\u064a\u0629 \u0645\u062c\u0647\u0648\u0644\u0629 \u0627\u0644\u0647\u0648\u064a\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u2014 \u0627\u0644\u062e\u0644\u0627\u064a\u0627 \u0623\u0635\u063a\u0631 \u0645\u0646 5 \u0645\u062e\u0641\u0627\u0629 \u2014 \u0627\u0645\u062a\u062b\u0627\u0644 \u0644\u0642\u0627\u0646\u0648\u0646 151/2020",
  };
  return M[n] || "";
}

export default function Analytics() {
  const [k, setK] = useState<any>(null);
  const [days, setDays] = useState(90);
  const [district, setDistrict] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ days: String(days), ...(district && { district }) });
    fetch(`/api/analytics/kpis?${q}`).then(r => r.json()).then(setK);
  }, [days, district]);

  if (!k) return <p className="text-center py-10">{"\u062c\u0627\u0631\u064d \u062d\u0633\u0627\u0628 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a..."}</p>;

  const funnelSteps: { label: string; value: number }[] = [
    { label: "\u0645\u0633\u062c\u0644\u0648\u0646", value: k.coverage.children },
    { label: "\u0645\u0641\u0639\u0651\u0644\u0648\u0646", value: k.coverage.activated },
    { label: "\u0625\u0646\u0630\u0627\u0631 3+", value: k.funnel.flagged },
    { label: "\u0645\u062d\u0627\u0644\u0648\u0646", value: k.funnel.referred },
    { label: "\u062a\u0645 \u062a\u0642\u064a\u064a\u0645\u0647\u0645", value: k.funnel.assessed },
    { label: "\u0645\u0646\u062a\u0633\u0628\u0648\u0646 \u0644\u0644\u062a\u062f\u062e\u0644", value: k.funnel.enrolled },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{"\u0644\u0648\u062d\u0629 \u0627\u0644\u0631\u0635\u062f \u0648\u0627\u0644\u062a\u0642\u064a\u064a\u0645"}</h1>
        <div className="flex gap-2 items-center">
          <select className="input max-w-28" value={days} onChange={e => setDays(Number(e.target.value))}>
            {[30, 90, 180, 365].map(d => <option key={d} value={d}>{"\u0622\u062e\u0631 "}{d} {"\u064a\u0648\u0645"}</option>)}
          </select>
          <input className="input max-w-40" placeholder={"\u0645\u0631\u0643\u0632 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)"}
                 value={district} onChange={e => setDistrict(e.target.value)} />
          <a className="btn bg-stone-200 text-sm" href={`/api/analytics/export?days=${days}${district ? `&district=${district}` : ""}`}>{"\u2b07 CSV"}</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title={"\u0627\u0644\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629"} value={k.coverage.coveragePct} unit="%"
              target={k.coverage.coverageTarget} hint={"\u0645\u0633\u062c\u0644\u0648\u0646 \u00f7 \u0645\u0648\u0627\u0644\u064a\u062f \u0645\u062a\u0648\u0642\u0639\u064a\u0646"} />
        <Card title={"\u0627\u0644\u062a\u0641\u0639\u064a\u0644"} value={k.coverage.activationPct} unit="%" target={70}
              hint={"\u0633\u062c\u0644 \u2190 \u0623\u0646\u062c\u0632 \u062a\u0642\u064a\u064a\u0645\u0627\u064b"} />
        <Card title={"\u0627\u0644\u062a\u0632\u0627\u0645 \u0646\u0642\u0627\u0637 \u0627\u0644\u062a\u0641\u062a\u064a\u0634"} value={k.engagement.onTimePct} unit="%" target={70} />
        <Card title={"\u0627\u0645\u062a\u062b\u0627\u0644 SLA \u0627\u0644\u0627\u062a\u0635\u0627\u0644"} value={k.pathway.slaCompliancePct} unit="%" target={95}
              hint={"\u0645\u0633\u062a\u0648\u0649 4-5: 48\u0633/7 \u0623\u064a\u0627\u0645"} />
        <Card title={"\u0648\u0633\u064a\u0637 \u0627\u0644\u0625\u0646\u0630\u0627\u0631 \u2190 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0648\u062c\u0627\u0647\u064a"}
              value={k.pathway.t4FaceToFaceDays?.[5] ?? k.pathway.t4FaceToFaceDays?.[4]} unit={"\u064a\u0648\u0645"}
              target={7} higherBetter={false} />
        <Card title={"\u0648\u0633\u064a\u0637 \u0632\u0645\u0646 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u062e\u0635\u0627\u0626\u064a"} value={k.pathway.t1ReviewHours} unit={"\u0633\u0627\u0639\u0629"} target={48} higherBetter={false} />
        <Card title={"PPV \u0627\u0644\u0625\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0645\u063a\u0644\u0642\u0629"} target={60} value={
          (() => { const L = Object.values(k.accuracy.byLevel) as any[];
            const c = L.reduce((s: any, v: any) => s + v.confirmed, 0), f = L.reduce((s: any, v: any) => s + v.falseAlarm, 0);
            return c + f > 0 ? Math.round((100 * c) / (c + f)) : null; })() } unit="%" />
        <Card title={"\u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0631\u0633\u0627\u0626\u0644"} value={k.alerts.totals.sentPct} unit="%" target={95} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-extrabold mb-3">{QUAM("2")}</h2>
          <Bars data={funnelSteps} />
          <p className="text-[11px] text-stone-400 mt-2">
            {"\u0627\u0644\u062a\u0633\u0631\u0628 \u0628\u064a\u0646 \u00ab\u0645\u062d\u0627\u0644\u0648\u0646\u00bb \u0648\u00ab\u062a\u0645 \u062a\u0642\u064a\u064a\u0645\u0647\u0645\u00bb = \u0639\u0628\u0621 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0633\u0642\u064a\u0646."}
          </p>
        </div>
        <div className="card">
          <h2 className="font-extrabold mb-3">{QUAM("3")}</h2>
          <Bars data={k.coverage.monthly.map((m: any) => ({ label: m.month, value: m.count }))} />
          <p className="text-[11px] text-stone-400 mt-2">{QUAM("4")} {k.coverage.pregnancies}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-extrabold mb-3">{QUAM("5")}</h2>
        <table className="w-full text-sm text-right">
          <thead><tr className="text-stone-500 border-b">
            <th className="p-2">{QUAM("6")}</th><th>{QUAM("7")}</th><th>{QUAM("8")}</th>
            <th>{QUAM("9")}</th><th>{QUAM("10")}</th><th>PPV</th></tr></thead>
          <tbody>
            {Object.entries(k.accuracy.byLevel).map(([l, v]: [string, any]) => (
              <tr key={l} className="border-b border-stone-50">
                <td className="p-2 font-bold">{QUAM("11")} {l}</td>
                <td>{v.referred}</td><td>{v.confirmed}</td><td>{v.falseAlarm}</td>
                <td>{v.indeterminate}</td>
                <td className={verdict(v.ppv, 60)}>{v.ppv ?? "\u2014"}%</td>
              </tr>
            ))}
            {!Object.keys(k.accuracy.byLevel).length &&
              <tr><td colSpan={6} className="p-4 text-stone-400">{QUAM("12")}</td></tr>}
          </tbody>
        </table>
        <p className="text-[11px] text-stone-400 mt-2">
          {QUAM("13")} {k.accuracy.overridePct ?? "\u2014"}% {QUAM("14")}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-extrabold mb-1">{QUAM("15")}</h2>
        <p className="text-xs text-stone-500 mb-3">{QUAM("16")}</p>
        <table className="w-full text-sm text-right">
          <thead><tr className="text-stone-500 border-b">
            <th className="p-2">{QUAM("17")}</th><th>{QUAM("18")}</th><th>{QUAM("19")}</th><th>{QUAM("20")}</th>
            <th>{QUAM("21")}</th><th>{QUAM("22")}</th><th>{QUAM("23")}</th><th>PPV</th></tr></thead>
          <tbody>
            {k.calibration.map((c: any) => (
              <tr key={c.item} className="border-b border-stone-50">
                <td className="p-2 font-mono text-xs">{c.item}</td>
                <td>{DOMAIN_NAMES[c.domain]}</td><td>{c.sev}</td>
                <td>{c.flagged}</td><td>{c.lost ? <b className="text-l5">{c.lost}</b> : 0}</td>
                <td>{c.confirmed}</td><td>{c.falseAlarm}</td>
                <td className={verdict(c.ppv, 60)}>{c.ppv ?? "\u2014"}</td>
              </tr>
            ))}
            {!k.calibration.length && <tr><td colSpan={8} className="p-4 text-stone-400">{QUAM("24")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-extrabold mb-3">{QUAM("25")}</h2>
          <p className="text-sm text-stone-600">
            {QUAM("26")} <b>{k.impact.enrolledTracked}</b> ·
            {QUAM("27")} <b className={k.impact.avgIndexDelta !== null && k.impact.avgIndexDelta < 0 ? "text-l1" : ""}>{k.impact.avgIndexDelta ?? "\u2014"}</b> ({QUAM("28")}) ·
            {QUAM("29")} <b>{k.impact.improvedPct ?? "\u2014"}%</b>
          </p>
        </div>
        <div className="card">
          <h2 className="font-extrabold mb-3">{QUAM("30")}</h2>
          <Bars color="#1B7F3B" data={Object.entries(k.impact.domainDelta).map(([d, v]: [string, any]) => ({
            label: DOMAIN_NAMES[d], value: Math.abs(Number(v ?? 0)) }))} />
          <p className="text-[11px] text-stone-400 mt-1">{QUAM("31")}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-extrabold mb-3">{QUAM("32")}</h2>
        <table className="w-full text-sm text-right">
          <thead><tr className="text-stone-500 border-b">
            <th className="p-2">{QUAM("33")}</th><th>{QUAM("34")}</th><th>{QUAM("35")}</th>
            <th>{QUAM("36")}</th><th>{QUAM("37")}</th><th>{QUAM("38")}</th><th>{QUAM("39")}</th></tr></thead>
          <tbody>
            {k.alerts.rows.map((r: any) => (
              <tr key={r.key} className="border-b border-stone-50">
                <td className="p-2 font-mono text-xs">{r.key}</td>
                <td>{r.sent}</td><td>{r.delivered}</td><td>{r.failed}</td>
                <td>{r.queued}</td><td>{r.attempts}</td>
                <td className={verdict(r.sentPct, 95)}>{r.sentPct ?? "\u2014"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2">{QUAM("40")}</h3>
          <Bars data={k.alerts.daily.map((d: any) => ({ label: d.day.slice(5), value: d.count }))} color="#EF6C00" />
        </div>
      </div>

      <p className="text-xs text-stone-400 text-center">{QUAM("41")}</p>
    </div>
  );
}