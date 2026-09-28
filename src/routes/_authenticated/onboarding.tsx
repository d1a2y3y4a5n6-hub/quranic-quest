import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, animate } from "motion/react";
import { Check, ChevronLeft } from "lucide-react";
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

const ease = [0.22, 1, 0.36, 1] as const;

function Option({ label, on, onClick, i }: { label: string; on: boolean; onClick: () => void; i: number }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + i * 0.04, duration: 0.35, ease }}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-[15px] transition-colors ${
        on ? "border-primary bg-brand-soft text-foreground" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {label}
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all ${
          on ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {on && <Check className="size-3" strokeWidth={3} />}
      </span>
    </motion.button>
  );
}

function Chips({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o, i) => {
        const on = value.includes(o);
        return (
          <Option key={o} i={i} label={o} on={on} onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])} />
        );
      })}
    </div>
  );
}

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, ease, onUpdate: setV });
    return () => c.stop();
  }, [to]);
  return <>{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

function BigValue({ children }: { children: React.ReactNode }) {
  return <p className="text-center font-display text-[64px] font-semibold leading-none tracking-tight tabular-nums">{children}</p>;
}

function Onboarding() {
  const navigate = useNavigate();
  const save = useSaveOnboarding();
  const [step, setStep] = useState(-1); // -1 = welcome
  const [dir, setDir] = useState(1);
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
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  // Single-choice questions advance on their own after a short beat, like Duolingo/Headspace.
  const pickThenNext = (set: (v: string[]) => void) => (v: string[]) => {
    set(v);
    setTimeout(() => go(step + 1), 280);
  };

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

  const screens: Array<{ title: string; hint?: string; body: React.ReactNode; ok?: boolean; auto?: boolean }> = [
    {
      title: "How many hours a day do you spend on social media?",
      hint: "Check your phone's screen time if you can.",
      body: (
        <div className="pt-8">
          <BigValue>
            {hours}
            <span className="text-[28px] text-muted-foreground">h</span>
          </BigValue>
          <Slider value={[hours]} min={0.5} max={12} step={0.5} onValueChange={([v]) => setHours(v ?? 3)} className="mt-10" />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>30m</span>
            <span>12h</span>
          </div>
        </div>
      ),
    },
    {
      title: "Which apps take most of your time?",
      hint: "These stay locked until your daily target is done.",
      ok: apps.length > 0,
      body: (
        <div className="grid grid-cols-4 gap-2.5">
          {APPS.map((a, i) => {
            const on = apps.includes(a);
            return (
              <motion.button
                key={a}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3, ease }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setApps(on ? apps.filter((x) => x !== a) : [...apps, a])}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 text-[10px] transition-colors ${
                  on ? "border-primary bg-brand-soft" : "border-border bg-card"
                }`}
              >
                <AppIcon name={a} />
                {a}
                {on && (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      ),
    },
    { title: "When do you scroll the most?", hint: "Pick all that apply.", ok: when.length > 0, body: <Chips options={TIMES} value={when} onChange={setWhen} multi /> },
    {
      title: "Why do you want to change this?",
      hint: "Pick all that apply.",
      ok: why.length > 0 || whyOwn.trim().length > 0,
      body: (
        <>
          <Chips options={WHY} value={why} onChange={setWhy} multi />
          <input
            value={whyOwn}
            onChange={(e) => setWhyOwn(e.target.value)}
            placeholder="Or in your own words…"
            className="mt-2.5 w-full rounded-2xl border border-border bg-card px-4 py-4 text-[15px] outline-none transition-colors focus:border-primary"
          />
        </>
      ),
    },
    { title: "How do you usually feel after scrolling?", auto: true, ok: feel.length > 0, body: <Chips options={FEEL} value={feel} onChange={pickThenNext(setFeel)} /> },
    {
      title: "How old are you?",
      hint: "Only used to estimate the years ahead of you.",
      body: (
        <div className="pt-8">
          <BigValue>{age}</BigValue>
          <Slider value={[age]} min={10} max={75} step={1} onValueChange={([v]) => setAge(v ?? 25)} className="mt-10" />
        </div>
      ),
    },
    { title: "How often do you read Quran right now?", auto: true, ok: quranNow.length > 0, body: <Chips options={QURAN_NOW} value={quranNow} onChange={pickThenNext(setQuranNow)} /> },
    {
      title: "How many minutes a day will you give to Noor?",
      hint: "Lessons are paced around this — about 6 minutes each.",
      body: (
        <div className="flex flex-col gap-2.5">
          {MINUTES.map((n, i) => {
            const l = lessonsForMinutes(n);
            return <Option key={n} i={i} label={`${n} minutes · ${l} lesson${l === 1 ? "" : "s"} a day`} on={minutes === n} onClick={() => setMinutes(n)} />;
          })}
        </div>
      ),
    },
    {
      title: "How many adhkar a day?",
      body: (
        <div className="grid grid-cols-2 gap-2.5">
          {DHIKR.map((n, i) => (
            <motion.button
              key={n}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDhikr(n)}
              className={`rounded-2xl border py-7 font-display text-[28px] font-semibold transition-colors ${
                dhikr === n ? "border-primary bg-brand-soft text-primary" : "border-border bg-card"
              }`}
            >
              {n}
            </motion.button>
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
          rows={4}
          placeholder="I want to finish the Quran with understanding, for the sake of Allah."
          className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-4 font-display text-[17px] leading-relaxed outline-none transition-colors focus:border-primary"
        />
      ),
    },
  ];

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  // Welcome
  if (step === -1) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 pb-10">
        <div className="geo-pattern pointer-events-none absolute inset-0 opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="relative flex flex-1 flex-col items-center justify-center text-center"
        >
          <p className="text-arabic text-[44px] text-primary">بِسْمِ ٱللَّهِ</p>
          <h1 className="mt-6 font-display text-[34px] font-semibold leading-tight">
            Turn scrolling
            <br />
            into <span className="text-primary">remembrance</span>
          </h1>
          <p className="mt-3 max-w-[300px] text-[15px] text-muted-foreground">
            Ten quick questions, about a minute. We'll build your daily plan around your answers.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="relative">
          <Button onClick={() => go(0)} className="h-auto w-full rounded-full py-4 text-[15px]">
            Let's begin
          </Button>
        </motion.div>
      </div>
    );
  }

  // Results
  if (step >= TOTAL) {
    const maxY = Math.max(m.scrollYears, m.deenYears, 0.1);
    const deenShare = Math.round((m.deenYears / (m.scrollYears + m.deenYears || 1)) * 100);
    const lpd = lessonsForMinutes(minutes);
    const reveal = (i: number) => ({
      initial: { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.15 + i * 0.25, duration: 0.6, ease },
    });
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 pb-8 pt-8">
        <motion.p {...reveal(0)} className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Your numbers
        </motion.p>
        <motion.div {...reveal(0)}>
          <p className="mt-3 text-[15px] text-muted-foreground">At {hours}h a day, scrolling takes</p>
          <p className="font-display text-[44px] font-semibold leading-tight text-destructive tabular-nums">
            <CountUp to={m.hoursPerYear} />
            <span className="text-[20px]"> hrs/yr</span>
          </p>
          <p className="mt-1 text-[14px] leading-relaxed">
            Over {m.yearsLeft} years, that's <b><CountUp to={m.scrollYears} decimals={1} /> years</b> of your life.
          </p>
        </motion.div>

        <motion.div {...reveal(1)} className="mt-8 space-y-4">
          {[
            { label: "Scrolling", v: m.scrollYears, cls: "bg-destructive" },
            { label: `Deen · ${minutes} min/day`, v: m.deenYears, cls: "bg-primary" },
          ].map((b, i) => (
            <div key={b.label}>
              <div className="flex justify-between text-[13px]">
                <span>{b.label}</span>
                <span className="font-semibold tabular-nums">{b.v.toFixed(2)} yrs</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${b.cls}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, (b.v / maxY) * 100)}%` }}
                  transition={{ delay: 0.7 + i * 0.2, duration: 1, ease }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div {...reveal(2)} className="mt-8 flex items-center gap-4">
          <div
            className="relative grid size-20 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--primary) 0% ${deenShare}%, var(--muted) ${deenShare}% 100%)` }}
          >
            <div className="absolute inset-[6px] rounded-full bg-background" />
            <span className="relative font-display text-[18px] font-semibold">{deenShare}%</span>
          </div>
          <p className="text-[14px] leading-relaxed">
            With Noor you'll give <b>{m.deenYears.toFixed(2)} years</b> of your life to the Quran and dhikr.
          </p>
        </motion.div>

        <motion.div {...reveal(3)} className="mt-8 rounded-2xl bg-brand-soft p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Your daily plan</p>
          <p className="mt-2 font-display text-[20px] font-semibold leading-snug">
            {lpd} lesson{lpd === 1 ? "" : "s"} + {dhikr} adhkar
          </p>
          <div className="mt-3 flex items-center gap-2">
            {apps.slice(0, 6).map((a) => (
              <span key={a} className="opacity-60">
                <AppIcon name={a} />
              </span>
            ))}
            <span className="text-[12px] text-muted-foreground">locked until done</span>
          </div>
        </motion.div>

        <div className="flex-1" />
        {save.isError && <p className="mt-3 text-[12px] text-destructive">Could not save. Please try again.</p>}
        <motion.div {...reveal(4)}>
          <Button onClick={finish} disabled={save.isPending} className="mt-6 h-auto w-full rounded-full py-4 text-[15px]">
            {save.isPending ? "Saving…" : "Begin, bismillah"}
          </Button>
          <Button variant="ghost" onClick={() => go(TOTAL - 1)} className="mt-1 w-full">
            Back
          </Button>
        </motion.div>
      </div>
    );
  }

  const s = screens[step] ?? screens[0]!;
  return (
    <div className="flex min-h-[100dvh] flex-col px-6 pb-8 pt-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(step - 1)} aria-label="Back" className="-ml-2 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted">
          <ChevronLeft className="size-5" />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
        <span className="w-9 text-right text-[12px] tabular-nums text-muted-foreground">
          {step + 1}/{TOTAL}
        </span>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease }}
          className="flex flex-1 flex-col"
        >
          <h1 className="mt-8 font-display text-[26px] font-semibold leading-[1.2]">{s.title}</h1>
          {s.hint && <p className="mt-2 text-[14px] text-muted-foreground">{s.hint}</p>}
          <div className="mt-7 flex-1">{s.body}</div>
        </motion.div>
      </AnimatePresence>

      {!s.auto && (
        <Button onClick={() => go(step + 1)} disabled={s.ok === false} className="mt-6 h-auto w-full rounded-full py-4 text-[15px]">
          {step === TOTAL - 1 ? "See my numbers" : "Continue"}
        </Button>
      )}
    </div>
  );
}
