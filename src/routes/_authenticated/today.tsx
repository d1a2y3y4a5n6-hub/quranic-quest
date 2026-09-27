import { createFileRoute, Link } from "@tanstack/react-router";
import { TreeDeciduous } from "lucide-react";
import { useDailyStatus, useGarden, useProfile } from "@/lib/noor";
import { AppIcon } from "@/components/AppIcon";

export const Route = createFileRoute("/_authenticated/today")({
  component: TodayPage,
});

function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.round(value * 100));
  return (
    <div className="relative grid size-[92px] shrink-0 place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) 0% ${pct}%, var(--muted) ${pct}% 100%)`,
        }}
      />
      <div className="absolute inset-[7px] rounded-full bg-card" />
      <div className="relative text-center">
        <p className="font-display text-[22px] font-semibold leading-none">{pct}%</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function TodayPage() {
  const profile = useProfile();
  const s = useDailyStatus();
  const garden = useGarden();

  const quranRatio = s.lessonsTarget ? s.lessonsToday / s.lessonsTarget : 0;
  const dhikrRatio = s.dhikrTarget ? s.dhikrToday / s.dhikrTarget : 0;
  const finishedQuran = s.lessons.length > 0 && s.totalDone >= s.lessons.length;

  return (
    <div className="px-5">
      <p className="text-[13px] text-muted-foreground">
        Assalamu alaikum, {profile.data?.displayName ?? "friend"}
      </p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">
        Today&apos;s intention
      </h1>
      {profile.data?.intention && (
        <p className="mt-1 text-[13px] italic text-muted-foreground">“{profile.data.intention}”</p>
      )}

      <Link to="/garden" className="card-noor mt-4 flex items-center gap-3 p-4">
        <TreeDeciduous aria-hidden="true" className="size-9 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your tree</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(garden.progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {garden.trees} grown · {garden.qurans} Quran{garden.qurans === 1 ? "" : "s"} pledged
          </p>
        </div>
      </Link>

      {/* Quran target */}
      <section className="mt-4">
        <div className="card-noor p-4">
          <div className="flex items-center gap-4">
            <Ring value={quranRatio} label="Quran" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Quran</p>
              <p className="mt-0.5 truncate font-display text-[19px] font-semibold">
                {finishedQuran
                  ? "Quran complete"
                  : `Surah ${s.nextLesson?.surah_name_en ?? "—"}`}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {s.lessonsToday} of {s.lessonsTarget} lesson{s.lessonsTarget === 1 ? "" : "s"} today
              </p>
              <p className="mt-1.5 font-arabic text-[18px] leading-none text-primary">
                {s.nextLesson?.surah_name_ar ?? ""}
              </p>
            </div>
          </div>

          <div className="geo-divider mt-4" />

          {finishedQuran ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              You have read through every lesson. May it be accepted.
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground">
                {s.nextLesson?.order_index ?? "—"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{s.nextLesson?.title ?? "—"}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Read the translation, then a short quiz
                </p>
              </div>
              {s.nextLesson && (
                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: s.nextLesson.id }}
                  className="shrink-0 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background"
                >
                  Continue
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Adhkar */}
      <section className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Adhkar</p>
          <Link to="/adhkar" className="text-[12px] font-semibold text-primary">
            {s.dhikrToday} / {s.dhikrTarget} said
          </Link>
        </div>
        <div className="card-noor mt-2.5 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, Math.round(dhikrRatio * 100))}%` }}
              />
            </div>
            <span className="text-[13px] font-semibold">
              {Math.min(100, Math.round(dhikrRatio * 100))}%
            </span>
          </div>
          <Link
            to="/adhkar"
            className="mt-3 block rounded-xl bg-brand-soft px-3.5 py-3 text-[13px] font-semibold text-primary"
          >
            Open the tasbih counter
          </Link>
        </div>
      </section>

      {/* Focus lock */}
      <section className="mt-4">
        <div
          className={`rounded-2xl p-4 ${s.unlocked ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-base">
                {s.unlocked ? "✦" : "✧"}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">
                  {s.unlocked ? "Apps unlocked" : "Apps locked"}
                </p>
                <p className="truncate text-[12px] opacity-60">
                  {s.unlocked
                    ? "Target complete for today"
                    : `${!s.lessonsMet ? "Quran" : ""}${!s.lessonsMet && !s.dhikrMet ? " and " : ""}${!s.dhikrMet ? "adhkar" : ""} still to finish`}
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${s.unlocked ? "bg-white/15" : "bg-accent text-accent-foreground"}`}
            >
              {s.unlocked ? "Open" : "Locked"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.blockedApps.map((app) => (
              <span
                key={app}
                aria-label={app}
                title={app}
                className="grid size-10 place-items-center rounded-lg bg-white/10"
              >
                <AppIcon name={app} />
              </span>
            ))}
            {s.blockedApps.length === 0 && (
              <Link to="/settings" className="text-[12px] opacity-70 underline">
                Choose which apps to block
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Progress through the Quran */}
      <section className="mt-4">
        <div className="card-noor p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Whole Quran
              </p>
              <p className="mt-0.5 font-display text-[19px] font-semibold">
                {s.totalDone} of {s.lessons.length} lessons
              </p>
            </div>
            <Link to="/path" className="text-[12px] font-semibold text-primary">
              See the path
            </Link>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${s.lessons.length ? Math.round((s.totalDone / s.lessons.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
