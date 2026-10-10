"use client";
import { SITE } from "@/lib/site";

export default function Offline() {
  return (
    <div className="card max-w-lg mx-auto mt-12 text-center space-y-4">
      <p className="text-4xl">{"\ud83d\udcf4"}</p>
      <h1 className="text-xl font-extrabold">
        {"\u0623\u0646\u062a\u0650 \u0627\u0644\u0622\u0646 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644"}
      </h1>
      <p className="text-stone-600 text-sm leading-relaxed">
        {"\u0646\u0642\u0627\u0637 \u0627\u0644\u062a\u0641\u062a\u064a\u0634 \u0627\u0644\u0645\u062e\u0632\u0651\u0646\u0629 \u062a\u0639\u0645\u0644 \u0643\u0627\u0644\u0645\u0639\u062a\u0627\u062f\u060c \u0648\u0623\u064a \u062a\u0642\u064a\u064a\u0645 \u0623\u0646\u062c\u0632\u062a\u064a\u0647 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644 \u0633\u064a\u062a\u0632\u0627\u0645\u0646 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0645\u0639 \u0627\u0644\u0645\u0646\u0635\u0629 \u0639\u0646\u062f \u0639\u0648\u062f\u0629 \u0627\u0644\u0634\u0628\u0643\u0629 \u2014 \u0644\u0627 \u062a\u062d\u062a\u0627\u062c\u064a\u0646 \u0644\u0641\u0639\u0644 \u0634\u064a\u0621."}
      </p>
      <button className="btn-primary" onClick={() => (location.href = "/dashboard")}>
        {"\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629"}
      </button>
      <p className="text-xs text-stone-500">
        {"\u0644\u0644\u0645\u0633\u0627\u0639\u062f\u0629: "}{SITE.phone} {"(\u0627\u062a\u0635\u0627\u0644/\u0648\u0627\u062a\u0633\u0627\u0628) \u00b7 "}{SITE.email}
      </p>
    </div>
  );
}