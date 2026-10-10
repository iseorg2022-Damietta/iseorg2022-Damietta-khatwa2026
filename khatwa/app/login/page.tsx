"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";

const T = {
  title: "\u0627\u0644\u062f\u062e\u0648\u0644 \u0628\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641",
  phone: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641",
  otp: "\u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0645\u0631\u0633\u0644",
  send: "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632",
  verify: "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062f\u062e\u0648\u0644",
  privacy: "\u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0645\u062d\u0645\u064a\u0629 \u0648\u0641\u0642 \u0642\u0627\u0646\u0648\u0646 \u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0631\u0642\u0645 151 \u0644\u0633\u0646\u0629 2020\u060c \u0648\u0644\u0627 \u062a\u064f\u0634\u0627\u0631\u0643 \u0625\u0644\u0627 \u0645\u0639 \u0627\u0644\u0623\u062e\u0635\u0627\u0626\u064a \u0627\u0644\u0645\u0633\u0626\u0648\u0644 \u0639\u0646 \u062d\u0627\u0644\u0629 \u0637\u0641\u0644\u0643.",
  help: "\u0644\u0623\u064a \u0645\u0634\u0643\u0644\u0629 \u0641\u064a \u0627\u0644\u062f\u062e\u0648\u0644: ",
};

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function sendOtp() {
    const r = await fetch("/api/auth/otp", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const j = await r.json();
    if (j.error) { setMsg(j.error); return; }
    if (j.devCode) setMsg("(dev) OTP: " + j.devCode);
    setStep(2);
  }

  async function verify() {
    const r = await fetch("/api/auth/verify", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
    const j = await r.json();
    if (j.ok) {
      router.push(["SPECIALIST", "COORDINATOR", "ADMIN", "DIAGNOSTICIAN"].includes(j.role) ? "/specialist" : "/dashboard");
      router.refresh();
    } else setMsg(j.error || "...");
  }

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="text-xl font-extrabold mb-4">{T.title}</h1>
      <label className="label">{T.phone}</label>
      <input className="input mb-4" dir="ltr" placeholder="01xxxxxxxxx"
             value={phone} onChange={e => setPhone(e.target.value)} />
      {step === 2 && (<>
        <label className="label">{T.otp}</label>
        <input className="input mb-4" dir="ltr" value={code}
               onChange={e => setCode(e.target.value)} />
      </>)}
      {msg && <p className="text-sm text-brand mb-3">{msg}</p>}
      <button className="btn-primary w-full" onClick={step === 1 ? sendOtp : verify}>
        {step === 1 ? T.send : T.verify}
      </button>
      <p className="text-xs text-stone-500 mt-4 leading-relaxed">
        {T.privacy}
        <br />{T.help}{SITE.phone} / {SITE.email}
      </p>
    </div>
  );
}