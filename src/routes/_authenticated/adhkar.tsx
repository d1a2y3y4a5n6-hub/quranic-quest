import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdhkar, useDhikrToday, useIncrementDhikr, useDailyStatus } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/adhkar")({
  component: AdhkarPage,
});

function AdhkarPage() {
  const adhkar = useAdhkar();
  const counts = useDhikrToday();
  const increment = useIncrementDhikr();
  const status = useDailyStatus();
  const [active, setActive] = useState<string | null>(null);

  const list = adhkar.data ?? [];
  const current = list.find((d) => d.id === active) ?? list[0];
  const rowFor = (id: string) => (counts.data ?? []).find((c) => c.adhkar_id === id);

  const currentCount = current ? (rowFor(current.id)?.count ?? 0) : 0;
  const currentTarget = current ? (rowFor(current.id)?.target ?? current.default_count) : 0;
  const pct = currentTarget ? Math.min(100, Math.round((currentCount / currentTarget) * 100)) : 0;

  return (
    <div className="px-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {status.dhikrToday} of {status.dhikrTarget} today
      </p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">Adhkar</h1>

      {current && (
        <section className="card-noor mt-4 p-5 text-center">
          <p className="font-arabic text-[30px] leading-[1.9] text-foreground">{current.arabic}</p>
          <p className="mt-1 text-[14px] font-semibold">{current.transliteration}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{current.translation}</p>

          <div className="geo-divider my-4" />

          <div className="mx-auto relative grid size-[132px] place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--accent) 0% ${pct}%, var(--muted) ${pct}% 100%)`,
              }}
            />
            <div className="absolute inset-[9px] rounded-full bg-card" />
            <div className="relative text-center">
              <p className="font-display text-[34px] font-semibold leading-none">{currentCount}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">of {currentTarget}</p>
            </div>
          </div>

          <button
            onClick={() =>
              increment.mutate({
                adhkarId: current.id,
                current: currentCount,
                target: currentTarget,
              })
            }
            className="mt-5 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground active:scale-[0.99]"
          >
            Tap to count
          </button>
          <button
            onClick={() =>
              increment.mutate({
                adhkarId: current.id,
                current: currentCount,
                target: currentTarget,
                by: -1,
              })
            }
            className="mt-2 text-[12px] text-muted-foreground"
          >
            Undo one
          </button>
        </section>
      )}

      <div className="mt-5 space-y-2">
        {list.map((d) => {
          const row = rowFor(d.id);
          const count = row?.count ?? 0;
          const target = row?.target ?? d.default_count;
          const selected = current?.id === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={`block w-full p-3.5 text-left ${
                selected ? "rounded-2xl bg-brand-soft" : "card-noor"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{d.transliteration}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {count} of {target}
                  </p>
                </div>
                <span className="shrink-0 font-arabic text-[19px] leading-none text-primary">
                  {d.arabic}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${target ? Math.min(100, (count / target) * 100) : 0}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
