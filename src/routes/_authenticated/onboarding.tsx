import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AppIcon } from "@/components/AppIcon";
import { lessonsForMinutes, lifeMaths, useSaveOnboarding } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Your intention — Noor" },
      { name: "description", content: "A few questions to shape your daily Quran and adhkar goal." },
      { property: "og:title", content: "Your intention — Noor" },
      { property: "og:description", content: "Shape your daily Quran and adhkar goal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const APPS = ["Instagram", "TikTok", "YouTube", "Snapchat", "X", "WhatsApp", "Netflix", "Facebook"];
const TIMES = ["Right after waking", "During work or study", "After Maghrib / evening", "Late at night in bed"];
const WHY = ["Get closer to Allah", "Finish reading the Quran", "Stop wasting time", "Build discipline", "Be a better example for family"];
const FEEL = ["Drained", "Guilty", "Anxious", "Nothing much", "Fine, honestly"];
const QURAN_NOW = ["Rarely or never", "Only in Ramadan", "A few times a week", "Every day"];
const MINUTES = [5, 10, 15, 20, 30];
const DHIKR = [33, 100, 300, 500];

function Chips({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <Button
            key={o}
            type="button"
            variant={on ? "default" : "outline"}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            className="h-auto justify-start rounded-xl px-4 py-3 text-left text-[14px]"
          >
            {o}
          </Button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const save = useSaveOnboarding();
  const [step, setStep] = useState(0);
  const [hours, setHours] = useState(3);
  const [apps, setApps] = useState<string[]>(["Instagram", "TikTok", "YouTube"]);
  const [when, setWhen] = useState<string[]>([]);
  const [why, setWhy] = useState<string[]>([]);
  const [whyOwn, setWhyOwn] = useState("");
  const [feel, setFeel] = useState<string[]>([]);
  const [age, setAge] = useState(25);
  const [quranNow, setQuranNow] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(10);
  const [dhikr, setDhikr] = useState(100);
  const [intention, setIntention] = useState("");

  const TOTAL = 10;
  const m = lifeMaths(hours, age, minutes);

  async function finish() {
    await save.mutateAsync({
      answers: { hours, apps, when, why, whyOwn, feel, age, quranNow, minutes, dhikr, intention },
      screenHours: hours,
      age,
      minutes,
      dhikrTarget: dhikr,
      blockedApps: apps,
      intention,
    });
    navigate({ to: "/today", replace: true });
  }

  const screens: Array<{ title: string; hint?: string; body: React.ReactNode; ok?: boolean }> = [
    {
      title: "How many hours a day do you spend on social media?",
      hint: "Be honest — check your phone's screen time if you can.",
      body: (
        <div className="mt-6">
          <p className="text-center font-display text-[48px] font-semibold">{hours}h</p>
          <Slider value={[hours]} min={0.5} max={12} step={0.5} onValueChange={([v]) => setHours(v)} className="mt-4" />
        </div>
      ),
    },
    {
      title: "Which apps take most of your time?",
      hint: "These will stay locked until your daily target is done.",
      ok: apps.length > 0,
      body: (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {APPS.map((a) => {
            const on = apps.includes(a);
            return (
              <Button
                key={a}
                type="button"
                variant={on ? "default" : "outline"}
                onClick={() => setApps(on ? apps.filter((x) => x !== a) : [...apps, a])}
                className="flex h-auto flex-col gap-1 rounded-xl py-3 text-[10px]"
              >
                <AppIcon name={a} />
                {a}
              </Button>
            );
          })}
        </div>
      ),
    },
    { title: "When do you scroll the most?", ok: when.length > 0, body: <Chips options={TIMES} value={when} onChange={setWhen} multi /> },
    {
      title: "Why do you want to change this?",
      ok: why.length > 0 || whyOwn.trim().length > 0,
      body: (
        <>
          <Chips options={WHY} value={why} onChange={setWhy} multi />
          <input
            value={whyOwn}
            onChange={(e) => setWhyOwn(e.target.value)}
            placeholder="Or in your own words…"
            className="mt-3 w-full rounded-xl border border-border bg-card px-3.5 py-3 text-[14px] outline-none focus:border-primary"
          />
        </>
      ),
    },
    { title: "How do you usually feel after scrolling?", ok: feel.length > 0, body: <Chips options={FEEL} value={feel} onChange={setFeel} /> },
    {
      title: "How old are you?",
      hint: "Used only to estimate the years ahead of you.",
      body: (
        <div className="mt-6">
          <p className="text-center font-display text-[48px] font-semibold">{age}</p>
          <Slider value={[age]} min={10} max={75} step={1} onValueChange={([v]) => setAge(v)} className="mt-4" />
        </div>
      ),
    },
    { title: "How often do you read Quran right now?", ok: quranNow.length > 0, body: <Chips options={QURAN_NOW} value={quranNow} onChange={setQuranNow} /> },
    {
      title: "How many minutes a day will you give to Noor?",
      hint: "Your lessons are paced around this — about 6 minutes each.",
      body: (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {MINUTES.map((n) => (
            <Button key={n} type="button" variant={minutes === n ? "default" : "outline"} onClick={() => setMinutes(n)} className="h-auto flex-col rounded-xl py-3">
              <span className="font-display text-[20px] font-semibold">{n}</span>
              <span className="text-[10px]">min</span>
            </Button>
          ))}
          <p className="col-span-5 mt-2 text-center text-[13px] text-muted-foreground">
            = {lessonsForMinutes(minutes)} lesson{lessonsForMinutes(minutes) === 1 ? "" : "s"} a day
          </p>
        </div>
      ),
    },
    {
      title: "How many adhkar a day?",
      body: (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {DHIKR.map((n) => (
            <Button key={n} type="button" variant={dhikr === n ? "default" : "outline"} onClick={() => setDhikr(n)} className="h-auto rounded-xl py-4 font-display text-[18px]">
              {n}
            </Button>
          ))}
        </div>
      ),
    },
    {
      title: "Write your intention in one line",
      hint: "We'll show it to you every day.",
      body: (
        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          rows={3}
          placeholder="I want to finish the Quran with understanding, for the sake of Allah."
          className="mt-4 w-full rounded-xl border border-border bg-card px-3.5 py-3 text-[14px] outline-none focus:border-primary"
        />
      ),
    },
  ];

  if (step >= TOTAL) {
    const maxY = Math.max(m.scrollYears, m.deenYears, 0.1);
    const deenShare = Math.round((m.deenYears / (m.scrollYears + m.deenYears || 1)) * 100);
    return (
      <div className="px-5 pb-10 pt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your numbers</p>
        <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight">Where your time is going</h1>

        <div className="card-noor mt-4 p-4">
          <p className="text-[12px] text-muted-foreground">At {hours}h a day, scrolling takes</p>
          <p className="font-display text-[32px] font-semibold text-destructive">{m.hoursPerYear.toLocaleString()} hours a year</p>
          <p className="mt-1 text-[13px]">
            Over the next {m.yearsLeft} years that is <b>{m.scrollYears.toFixed(1)} full years</b> of your life — about{" "}
            <b>{m.scrollWakingYears.toFixed(1)} years</b> of waking life.
          </p>
        </div>

        <div className="card-noor mt-3 p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Scrolling vs deen (years of life)</p>
          {[
            { label: "Scrolling", v: m.scrollYears, cls: "bg-destructive" },
            { label: `Deen (${minutes} min/day)`, v: m.deenYears, cls: "bg-primary" },
          ].map((b) => (
            <div key={b.label} className="mt-3">
              <div className="flex justify-between text-[12px]">
                <span>{b.label}</span>
                <span className="font-semibold">{b.v.toFixed(2)} yrs</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${b.cls}`} style={{ width: `${Math.max(2, (b.v / maxY) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card-noor mt-3 flex items-center gap-4 p-4">
          <div
            className="relative grid size-24 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--primary) 0% ${deenShare}%, var(--accent) ${deenShare}% 100%)` }}
          >
            <div className="absolute inset-[8px] rounded-full bg-card" />
            <span className="relative font-display text-[18px] font-semibold">{deenShare}%</span>
          </div>
          <p className="text-[13px] leading-relaxed">
            With Noor you'll give <b>{m.deenYears.toFixed(2)} years</b> of your life to the Quran and dhikr — and turn{" "}
            {deenShare}% of that screen time toward deen if the minutes come from scrolling.
          </p>
        </div>

        <div className="mt-3 rounded-xl bg-brand-soft p-4 text-[13px]">
          <p className="font-semibold text-primary">Your daily plan</p>
          <p className="mt-1">
            {lessonsForMinutes(minutes)} lesson{lessonsForMinutes(minutes) === 1 ? "" : "s"} + {dhikr} adhkar a day. {apps.join(", ")} stay locked until done.
          </p>
        </div>

        {save.isError && <p className="mt-3 text-[12px] text-destructive">Could not save. Please try again.</p>}
        <Button onClick={finish} disabled={save.isPending} className="mt-5 h-auto w-full rounded-full py-3.5 text-[14px]">
          {save.isPending ? "Saving…" : "Begin, bismillah"}
        </Button>
        <Button variant="ghost" onClick={() => setStep(TOTAL - 1)} className="mt-2 w-full">
          Back
        </Button>
      </div>
    );
  }

  const s = screens[step];
  return (
    <div className="flex min-h-[80vh] flex-col px-5 pb-8 pt-6">
      <div className="flex gap-1">
        {screens.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Question {step + 1} of {TOTAL}
      </p>
      <h1 className="mt-1 font-display text-[24px] font-semibold leading-tight">{s.title}</h1>
      {s.hint && <p className="mt-1 text-[13px] text-muted-foreground">{s.hint}</p>}
      <div className="flex-1">{s.body}</div>
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="h-auto flex-1 rounded-full py-3.5">
            Back
          </Button>
        )}
        <Button onClick={() => setStep(step + 1)} disabled={s.ok === false} className="h-auto flex-1 rounded-full py-3.5">
          {step === TOTAL - 1 ? "See my numbers" : "Next"}
        </Button>
      </div>
    </div>
  );
}
