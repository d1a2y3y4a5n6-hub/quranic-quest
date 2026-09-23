import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Brain, Check, Clock3, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompleteLesson, useLessons } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lessons = useLessons();
  const complete = useCompleteLesson();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"passage" | "meaning" | "reflect" | "quiz" | "done">("passage");
  const [picked, setPicked] = useState<number | null>(null);

  const lesson = (lessons.data ?? []).find((l) => l.id === lessonId);
  const passage = useQuery({
    queryKey: ["lesson-passage", lesson?.surah_number, lesson?.ayah_start, lesson?.ayah_end],
    enabled: Boolean(lesson),
    staleTime: Infinity,
    queryFn: async () => {
      if (!lesson) return [];
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${lesson.surah_number}/editions/quran-uthmani,en.sahih`,
      );
      if (!response.ok) throw new Error("Could not load the full passage");
      const json = await response.json();
      const [arabic, english] = json.data as Array<{
        ayahs: Array<{ numberInSurah: number; text: string }>;
      }>;
      if (!arabic || !english) return [];
      return arabic.ayahs
        .filter((ayah) => ayah.numberInSurah >= lesson.ayah_start && ayah.numberInSurah <= lesson.ayah_end)
        .map((ayah) => ({
          number: ayah.numberInSurah,
          arabic: ayah.text,
          english: english.ayahs.find((item) => item.numberInSurah === ayah.numberInSurah)?.text ?? "",
        }));
    },
  });

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
    if (!lesson) return;
    await complete.mutateAsync({ lessonId: lesson.id, correct });
    setStage("done");
  }

  const fullPassage = passage.data ?? [];
  const stageNumber = stage === "passage" ? 1 : stage === "meaning" ? 2 : stage === "reflect" ? 3 : stage === "quiz" ? 4 : 4;

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

      {stage !== "done" && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-label={`Step ${stageNumber} of 4`}>
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className={`h-1.5 w-8 rounded-full ${step <= stageNumber ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" /> 5–7 min
          </span>
        </div>
      )}

      {stage === "passage" && (
        <>
          <section className="mt-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen aria-hidden="true" className="size-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Read the passage</p>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Read slowly. Pause at the end of each ayah before moving on.
            </p>
            <div className="mt-3 space-y-2.5">
              {fullPassage.length > 0 ? fullPassage.map((ayah) => (
                <div key={ayah.number} className="card-noor p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-soft text-[11px] font-semibold text-accent">{ayah.number}</span>
                    <p className="text-arabic flex-1 text-[22px] text-foreground">{ayah.arabic}</p>
                  </div>
                </div>
              )) : (
                <div className="card-noor p-4">
                  <p className="text-arabic text-[22px] text-foreground">{lesson.arabic}</p>
                </div>
              )}
            </div>
          </section>
          <Button
            onClick={() => setStage("meaning")}
            className="mt-4 h-auto w-full rounded-full bg-foreground py-3.5 text-[14px] text-background hover:bg-foreground/90"
          >
            Continue to the meaning
          </Button>
        </>
      )}

      {stage === "meaning" && (
        <>
          <section className="mt-4">
            <div className="flex items-center gap-2 text-primary">
              <Brain aria-hidden="true" className="size-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Understand the meaning</p>
            </div>
            <div className="mt-3 space-y-2.5">
              {fullPassage.length > 0 ? fullPassage.map((ayah) => (
                <div key={ayah.number} className="card-noor p-4">
                  <p className="text-[11px] font-semibold text-accent">Ayah {ayah.number}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed">{ayah.english}</p>
                </div>
              )) : (
                <div className="card-noor p-4"><p className="text-[14px] leading-relaxed">{lesson.translation}</p></div>
              )}
            </div>
          </section>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStage("passage")} className="h-auto flex-1 rounded-full py-3.5">Back</Button>
            <Button onClick={() => setStage("reflect")} className="h-auto flex-1 rounded-full py-3.5">Explore tafsir</Button>
          </div>
        </>
      )}

      {stage === "reflect" && (
        <>
          <section className="mt-4 rounded-xl bg-brand-soft p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Tafsir and reflection</p>
            </div>
            <p className="mt-3 text-[14px] leading-7 text-foreground">{lesson.tafsir}</p>
            <div className="geo-divider my-3" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Pause and consider</p>
            <p className="mt-1.5 text-[14px] leading-relaxed">
              Where does this passage meet your life today? Choose one idea to remember, and one small action that would turn its meaning into practice.
            </p>
          </section>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStage("meaning")} className="h-auto flex-1 rounded-full py-3.5">Back</Button>
            <Button onClick={() => setStage("quiz")} className="h-auto flex-1 rounded-full py-3.5">Check my understanding</Button>
          </div>
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
                   <Button
                    disabled={reveal}
                    onClick={() => setPicked(i)}
                     variant="outline"
                     className={`h-auto w-full whitespace-normal rounded-xl px-3.5 py-3 text-left text-[13px] ${
                      reveal && isAnswer
                        ? "border-primary bg-brand-soft font-semibold text-primary"
                        : chosen
                          ? "border-destructive bg-card text-destructive"
                          : "border-border bg-card"
                    }`}
                  >
                    {option}
                   </Button>
                </li>
              );
            })}
          </ul>

          {picked !== null && (
            <>
              <p className="mt-3 text-[13px] font-semibold">
                {correct ? "Correct — well done." : "Not quite. The answer is highlighted."}
              </p>
               <Button
                onClick={finish}
                disabled={complete.isPending}
                 className="mt-3 h-auto w-full rounded-full py-3.5 text-[14px] font-semibold"
              >
                {complete.isPending ? "Saving…" : "Mark lesson complete"}
               </Button>
            </>
          )}
        </section>
      )}

      {stage === "done" && (
        <section className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground">
          <Check aria-hidden="true" className="size-5" />
          <p className="mt-2 font-arabic text-[24px]">بَارَكَ اللَّهُ فِيكَ</p>
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
