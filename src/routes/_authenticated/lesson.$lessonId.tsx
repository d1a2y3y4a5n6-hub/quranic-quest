import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCompleteLesson, useLessons } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lessons = useLessons();
  const complete = useCompleteLesson();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"read" | "quiz" | "done">("read");
  const [picked, setPicked] = useState<number | null>(null);

  const lesson = (lessons.data ?? []).find((l) => l.id === lessonId);

  if (lessons.isLoading) {
    return <p className="px-5 text-[13px] text-muted-foreground">Opening the lesson…</p>;
  }
  if (!lesson) {
    return (
      <div className="px-5">
        <p className="text-[13px] text-muted-foreground">This lesson could not be found.</p>
        <Link to="/path" className="mt-3 inline-block text-[13px] font-semibold text-primary">
          Back to the path
        </Link>
      </div>
    );
  }

  const correct = picked === lesson.quiz_answer;

  async function finish() {
    await complete.mutateAsync({ lessonId: lesson!.id, correct });
    setStage("done");
  }

  return (
    <div className="px-5">
      <Link to="/path" className="text-[12px] text-muted-foreground">
        ← The path
      </Link>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Lesson {lesson.order_index}
          </p>
          <h1 className="mt-0.5 font-display text-[24px] font-semibold leading-tight">
            {lesson.title}
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Surah {lesson.surah_name_en} · ayah {lesson.ayah_start}–{lesson.ayah_end}
          </p>
        </div>
        <span className="shrink-0 font-arabic text-[22px] leading-none text-primary">
          {lesson.surah_name_ar}
        </span>
      </div>

      <div className="geo-divider mt-4" />

      {stage === "read" && (
        <>
          <section className="card-noor mt-4 p-4">
            <p className="text-arabic text-[22px] text-foreground">{lesson.arabic}</p>
            <div className="geo-divider my-3" />
            <p className="text-[14px] leading-relaxed">{lesson.translation}</p>
          </section>

          <section className="mt-3 rounded-2xl bg-brand-soft p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-primary">Tafsir</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{lesson.tafsir}</p>
          </section>

          <button
            onClick={() => setStage("quiz")}
            className="mt-4 w-full rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-background"
          >
            I&apos;ve read it — quiz me
          </button>
        </>
      )}

      {stage === "quiz" && (
        <section className="card-noor mt-4 p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Check your understanding
          </p>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug">{lesson.quiz_question}</p>
          <ul className="mt-3 space-y-2">
            {lesson.quiz_options.map((option, i) => {
              const chosen = picked === i;
              const reveal = picked !== null;
              const isAnswer = i === lesson.quiz_answer;
              return (
                <li key={option}>
                  <button
                    disabled={reveal}
                    onClick={() => setPicked(i)}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left text-[13px] ${
                      reveal && isAnswer
                        ? "border-primary bg-brand-soft font-semibold text-primary"
                        : chosen
                          ? "border-destructive bg-card text-destructive"
                          : "border-border bg-card"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>

          {picked !== null && (
            <>
              <p className="mt-3 text-[13px] font-semibold">
                {correct ? "Correct — well done." : "Not quite. The answer is highlighted."}
              </p>
              <button
                onClick={finish}
                disabled={complete.isPending}
                className="mt-3 w-full rounded-full bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground disabled:opacity-60"
              >
                {complete.isPending ? "Saving…" : "Mark lesson complete"}
              </button>
            </>
          )}
        </section>
      )}

      {stage === "done" && (
        <section className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="font-arabic text-[24px]">بَارَكَ اللَّهُ فِيكَ</p>
          <p className="mt-2 font-display text-[20px] font-semibold">Lesson complete</p>
          <p className="mt-1 text-[13px] opacity-75">
            It counts toward today&apos;s target and your place in the Quran.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate({ to: "/today" })}
              className="flex-1 rounded-full bg-white/15 py-3 text-[13px] font-semibold"
            >
              Back to today
            </button>
            <button
              onClick={() => navigate({ to: "/path" })}
              className="flex-1 rounded-full bg-background py-3 text-[13px] font-semibold text-foreground"
            >
              Next lesson
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
