import { createFileRoute, Link } from "@tanstack/react-router";
import { useDailyStatus } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/path")({
  component: PathPage,
});

function PathPage() {
  const s = useDailyStatus();
  const nextId = s.nextLesson?.id;

  return (
    <div className="px-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        In order, cover to cover
      </p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">The path</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Finish every lesson and you have read the whole Quran with its meaning.
      </p>

      <div className="geo-divider mt-5" />

      <div className="relative mt-4 pb-2">
        <div className="absolute bottom-6 left-[19px] top-6 w-px bg-border" />
        <ul className="space-y-2.5">
          {s.lessons.map((lesson) => {
            const done = s.doneIds.has(lesson.id);
            const current = lesson.id === nextId;
            const locked = !done && !current;
            return (
              <li key={lesson.id} className="relative flex items-center gap-3">
                <span
                  className={`z-10 grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : current
                        ? "bg-accent text-accent-foreground ring-4 ring-gold-soft"
                        : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : lesson.order_index}
                </span>

                {locked ? (
                  <div className="card-noor flex-1 p-3.5 opacity-60">
                    <LessonRow lesson={lesson} state="Locked" />
                  </div>
                ) : (
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    className={`flex-1 p-3.5 ${
                      current
                        ? "rounded-2xl bg-foreground text-background"
                        : "card-noor"
                    }`}
                  >
                    <LessonRow lesson={lesson} state={done ? "Completed" : "Continue"} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  state,
}: {
  lesson: { surah_name_en: string; surah_name_ar: string; title: string; ayah_start: number; ayah_end: number };
  state: string;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[13px] font-semibold">
          {lesson.surah_name_en} · {lesson.ayah_start}–{lesson.ayah_end}
        </p>
        <span className="shrink-0 font-arabic text-[15px] leading-none opacity-70">
          {lesson.surah_name_ar}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[12px] opacity-60">{lesson.title}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-60">
        {state}
      </p>
    </>
  );
}
