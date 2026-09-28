import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "@/lib/noor";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const SUGGESTED_APPS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Snapchat",
  "X",
  "Netflix",
  "Reddit",
  "WhatsApp",
];

function SettingsPage() {
  const settings = useSettings();
  const update = useUpdateSettings();

  const [lessons, setLessons] = useState(1);
  const [dhikr, setDhikr] = useState(100);
  const [apps, setApps] = useState<string[]>([]);

  useEffect(() => {
    if (settings.data) {
      setLessons(settings.data.lessons_target);
      setDhikr(settings.data.dhikr_target);
      setApps(settings.data.blocked_apps ?? []);
    }
  }, [settings.data]);

  function toggleApp(name: string) {
    setApps((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));
  }

  return (
    <div className="px-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your covenant</p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">Daily target</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Nothing unlocks until both of these are complete.
      </p>

      <div className="geo-divider mt-5" />

      <section className="card-noor mt-4 p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Quran lessons per day
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={10}
            value={lessons}
            onChange={(e) => setLessons(Number(e.target.value))}
            className="h-1.5 flex-1 accent-[var(--primary)]"
          />
          <span className="w-10 text-right font-display text-[20px] font-semibold">{lessons}</span>
        </div>
      </section>

      <section className="card-noor mt-3 p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Adhkar said per day
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={dhikr}
            onChange={(e) => setDhikr(Number(e.target.value))}
            className="h-1.5 flex-1 accent-[var(--accent)]"
          />
          <span className="w-12 text-right font-display text-[20px] font-semibold">{dhikr}</span>
        </div>
      </section>

      <section className="card-noor mt-3 p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Apps to keep locked
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SUGGESTED_APPS.map((app) => {
            const on = apps.includes(app);
            return (
              <Button
                key={app}
                type="button"
                variant={on ? "default" : "outline"}
                onClick={() => toggleApp(app)}
                aria-pressed={on}
                aria-label={`${on ? "Stop blocking" : "Block"} ${app}`}
                title={app}
                className={`relative size-12 rounded-xl p-0 ${on ? "bg-foreground text-background hover:bg-foreground/90" : "text-muted-foreground"}`}
              >
                <AppIcon name={app} />
                {on && <Check className="absolute right-0.5 top-0.5 size-3" />}
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          On the web these appear locked inside Noor. Blocking them across your whole phone needs the
          iPhone or Android app.
        </p>
      </section>

      <Button
        onClick={() =>
          update.mutate({ lessons_target: lessons, dhikr_target: dhikr, blocked_apps: apps })
        }
        disabled={update.isPending}
        className="mt-4 h-auto w-full rounded-full py-3.5 text-[14px] font-semibold"
      >
        {update.isPending ? "Saving…" : update.isSuccess ? "Saved" : "Save target"}
      </Button>
    </div>
  );
}
