"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Gauge, DomainBars } from "@/components/ui";
import ActivitiesSection from "@/components/activities-section";
import { LEVELS, DOMAIN_NAMES } from "@/lib/levels";
import { getProvisional } from "@/lib/idb";
import { pickActivities, ActivityLite } from "@/lib/activities-client";
import { SITE } from "@/lib/site";

const T = {
  title: "\u062a\u0642\u0631\u064a\u0631 \u0646\u0645\u0627\u0626\u064a \u2014 \u0646\u0642\u0637\u0629 \u062a\u0641\u062a\u064a\u0634 \u0631\u0642\u0645 ",
  lvl: " \u00b7 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 ",
  fallback: "\u0637\u0641\u0644\u0643",
  devAge: " \u00b7 \u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0646\u0645\u0627\u0626\u064a ",
  months: " \u0634\u0647\u0631\u0627\u064b",
  provisional: "\ud83d\udcf4 \u062a\u0642\u064a\u064a\u0645 \u0645\u0628\u062f\u0626\u064a \u0645\u062d\u0641\u0648\u0638 \u0639\u0644\u0649 \u062c\u0647\u0627\u0632\u0643 \u2014 \u0633\u064a\u062a\u0632\u0627\u0645\u0646 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0639\u0646\u062f \u0639\u0648\u062f\u0629 \u0627\u0644\u0634\u0628\u0643\u0629\u060c \u0648\u064a\u0639\u0627\u062f \u062d\u0633\u0627\u0628\u0647 \u0646\u0647\u0627\u0626\u064a\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u062e\u0627\u062f\u0645 \u0628\u0623\u062d\u062f\u062b \u0643\u062a\u0627\u0644\u0648\u062c \u0645\u0639\u062a\u0645\u062f\u060c \u0641\u0642\u062f \u064a\u062a\u063a\u064a\u0631 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0642\u0644\u064a\u0644\u0627\u064b.",
  domains: "\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0645\u062c\u0627\u0644\u0627\u062a \u0627\u0644\u0646\u0645\u0627\u0626\u064a\u0629",
  flags: "\u0639\u0644\u0627\u0645\u0627\u062a \u0627\u0633\u062a\u062f\u0639\u062a \u0627\u0646\u062a\u0628\u0627\u0647 \u0627\u0644\u0645\u062d\u0631\u0643",
  next: "\u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629",
  sla: "\u23f1\ufe0f \u0633\u064a\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0643\u0650 \u062e\u0644\u0627\u0644: ",
  contact: "\u0644\u0644\u0627\u0633\u062a\u0641\u0633\u0627\u0631 \u0648\u0627\u0644\u062f\u0639\u0645: ",
  via: " (\u0627\u062a\u0635\u0627\u0644/\u0648\u0627\u062a\u0633\u0627\u0628) \u00b7 ",
  missing: "\u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u0628\u062f\u0626\u064a \u062a\u0645\u062a \u0645\u0632\u0627\u0645\u0646\u062a\u0647 \u0648\u062d\u064f\u0633\u0628 \u0646\u0647\u0627\u0626\u064a\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u062e\u0627\u062f\u0645. \u0627\u0641\u062a\u062d\u064a ",
  missingLink: "\u0645\u0644\u0641 \u0637\u0641\u0644\u0643",
  missingTail: " \u0644\u0631\u0624\u064a\u0629 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0631\u0633\u0645\u064a.",
  disclaimer: "\u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0623\u062f\u0627\u0629 \u0631\u0635\u062f \u0645\u0628\u0643\u0631 \u0648\u0644\u064a\u0633 \u062a\u0634\u062e\u064a\u0635\u0627\u064b \u0637\u0628\u064a\u0627\u064b\u061b \u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u064a\u062a\u0637\u0644\u0628 \u062a\u0642\u064a\u064a\u0645\u0627\u064b \u0645\u062a\u062e\u0635\u0635\u0627\u064b \u0648\u062c\u0647\u0627\u064b \u0644\u0648\u062c\u0647.",
  warn: "\u26a0\ufe0f ",
  loading: "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...",
};

export default function Report() {
  const { id, aid } = useParams();
  const isLocal = String(aid).startsWith("local-");
  const [a, setA] = useState<any>(null);
  const [childName, setChildName] = useState("");

  useEffect(() => {
    fetch("/api/children").then(r => r.json())
      .then(j => setChildName(j.children?.find((c: any) => String(c.id) === id)?.name || ""))
      .catch(() => {});
    if (isLocal) {
      getProvisional(String(aid)).then(p => setA(p || { missing: true }));
    } else {
      fetch(`/api/assessments/${aid}`).then(r => r.json()).then(j => setA(j.assessment));
    }
  }, [aid, id, isLocal]);

  if (!a) return <p className="text-center py-10">{T.loading}</p>;
  if (a.missing) return (
    <div className="card max-w-xl mx-auto mt-8 text-center">
      {T.missing}
      <a className="text-brand underline" href={`/child/${id}`}>{T.missingLink}</a>
      {T.missingTail}
    </div>
  );

  const level: number = a.adjustedLevel || a.level;
  const cfg = LEVELS[level];

  return (
    <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-lg"
         style={{ backgroundColor: cfg.color + "14", border: `3px solid ${cfg.color}` }}>

      <div className="p-5 text-white" style={{ backgroundColor: cfg.color }}>
        <p className="text-sm opacity-90">{T.title}{a.checkpoint}</p>
        <h1 className="text-2xl font-extrabold">{cfg.title}{T.lvl}{cfg.level}/5</h1>
        <p className="mt-1 text-sm">
          {childName || a.child?.name || T.fallback}{T.devAge}{Math.round(a.devAge || a.dev)}{T.months}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {isLocal && (
          <div className="rounded-xl bg-l3/15 border border-l3 px-4 py-3 text-sm">
            {T.provisional}
          </div>
        )}

        <Gauge index={a.index} level={level} />

        <div className="card">
          <h2 className="font-extrabold mb-3">{T.domains}</h2>
          <DomainBars scores={a.domainScores} />
        </div>

        {a.redFlags?.length > 0 && (
          <div className="card" style={{ borderRight: `6px solid ${cfg.color}` }}>
            <h2 className="font-extrabold mb-2">{T.flags}</h2>
            <ul className="list-disc pr-5 text-sm space-y-1">
              {a.redFlags.map((r: any) => (
                <li key={r.itemId}>
                  {r.lost ? T.warn : ""}{r.stem}
                  {" "}
                  <span className="text-xs text-stone-400">({DOMAIN_NAMES[r.domain]})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card bg-white">
          <h2 className="font-extrabold mb-2">{T.next}</h2>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line">{a.narrative}</p>
          {level >= 4 && !isLocal && (
            <p className="mt-4 text-sm font-bold text-l4">{T.sla}{cfg.sla}</p>
          )}
          <p className="mt-3 text-xs text-stone-500">
            {T.contact}{SITE.phone}{T.via}{SITE.email}
          </p>
        </div>

        {isLocal
          ? <LocalActivities a={a} />
          : <ServerActivities aid={aid as string} />}

        <p className="text-xs text-stone-500 text-center leading-relaxed">{T.disclaimer}</p>
      </div>
    </div>
  );
}

function ServerActivities({ aid }: { aid: string }) {
  const [d, setD] = useState<{ isEnrichment: boolean; activities: ActivityLite[] } | null>(null);
  useEffect(() => {
    fetch(`/api/assessments/${aid}/activities`).then(r => r.json()).then(setD);
  }, [aid]);
  if (!d?.activities?.length) return null;
  return <ActivitiesSection isEnrichment={d.isEnrichment} activities={d.activities} />;
}

function LocalActivities({ a }: { a: any }) {
  const [acts, setActs] = useState<ActivityLite[]>([]);
  const [isEnrichment, setIsEnrichment] = useState(false);
  useEffect(() => {
    fetch("/api/activities").then(r => r.json())
      .then(j => {
        const picked = pickActivities(j.activities || [], a.domainScores, a.devAge);
        setActs(picked.activities);
        setIsEnrichment(picked.isEnrichment);
      }).catch(() => {});
  }, [a]);
  if (!acts.length) return null;
  return <ActivitiesSection isEnrichment={isEnrichment} activities={acts} />;
}