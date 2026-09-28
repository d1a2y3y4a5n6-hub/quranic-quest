import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Brain, Check, Clock3, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompleteLesson, useLessons, useQuizQuestions, type QuizQuestion } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  component: LessonPage,
});

function Quiz({
  lessonId,
  fallback,
  saving,
  onFinish,
}: {
  lessonId: string;
  fallback: QuizQuestion;
  saving: boolean;
  onFinish: (passed: boolean) => Promise<void>;
}) {
  const q = useQuizQuestions(lessonId);
  const questions = useMemo(() => {
    const list = q.data && q.data.length > 0 ? q.data : [fallback];
    // shuffle option order so the answer isn't always in the same spot
    return list.map((item) => {
      const order = item.options.map((_, i) => i).sort(() => Math.random() - 0.5);
      return { ...item, options: order.map((i) => item.options[i]), answer: order.indexOf(item.answer) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (q.isLoading) return <p className="mt-4 text-[13px] text-muted-foreground">Preparing your quiz…</p>;

  const total = questions.length;
  const passed = score / total >= 0.6;

  if (finished) {
    return (
      <section className="card-noor mt-4 p-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your score</p>
        <p className="mt-1 font-display text-[36px] font-semibold">
          {score} / {total}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {passed ? "Well done — you understood this passage." : "You need 60% to pass. Review and try again."}
        </p>
        {passed ? (
          <Button onClick={() => onFinish(true)} disabled={saving} className="mt-4 h-auto w-full rounded-full py-3.5">
            {saving ? "Saving…" : "Mark lesson complete"}
          </Button>
        ) : (
          <Button
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setScore(0);
              setFinished(false);
            }}
            className="mt-4 h-auto w-full rounded-full py-3.5"
          >
            Try the quiz again
          </Button>
        )}
      </section>
    );
  }

  const current = questions[index] ?? questions[0]!;
  return (
    <section className="card-noor mt-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Question {index + 1} of {total}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span key={i} className={`h-1.5 w-5 rounded-full ${i <= index ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug">{current.question}</p>
      <ul className="mt-3 space-y-2">
        {current.options.map((option, i) => {
          const reveal = picked !== null;
          const isAnswer = i === current.answer;
          return (
            <li key={option}>
              <Button
                disabled={reveal}
                onClick={() => {
                  setPicked(i);
                  if (i === current.answer) setScore((s) => s + 1);
                }}
                variant="outline"
                className={`h-auto w-full justify-start whitespace-normal rounded-xl px-3.5 py-3 text-left text-[13px] disabled:opacity-100 ${
                  reveal && isAnswer
                    ? "border-primary bg-brand-soft font-semibold text-primary"
                    : picked === i
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
            {picked === current.answer ? "Correct — well done." : "Not quite. The answer is highlighted."}
          </p>
          <Button
            onClick={() => {
              if (index + 1 >= total) setFinished(true);
              else {
                setIndex(index + 1);
                setPicked(null);
              }
            }}
            className="mt-3 h-auto w-full rounded-full py-3.5"
          >
            {index + 1 >= total ? "See my score" : "Next question"}
          </Button>
        </>
      )}
    </section>
  );
}

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lessons = useLessons();
  const complete = useCompleteLesson();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"passage" | "meaning" | "reflect" | "quiz" | "done">("passage");

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
              Read slowly once, pause at each ayah, then repeat the passage before continuing.
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
            {passage.isError && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                The full passage could not load, so the saved lesson text is shown instead.
              </p>
            )}
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
                  <p className="text-arabic mt-2 text-[20px] text-foreground">{ayah.arabic}</p>
                  <p className="mt-2 text-[14px] leading-relaxed">{ayah.english}</p>
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
            <div className="mt-4 border-t border-primary/15 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Make it personal</p>
              <ol className="mt-2 space-y-2 text-[13px] leading-relaxed">
                <li><span className="font-semibold text-accent">1.</span> Summarise the passage in one sentence, without looking back.</li>
                <li><span className="font-semibold text-accent">2.</span> Name the quality of Allah, command, or warning that stands out most.</li>
                <li><span className="font-semibold text-accent">3.</span> Form one intention you can carry into the rest of your day.</li>
              </ol>
            </div>
          </section>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStage("meaning")} className="h-auto flex-1 rounded-full py-3.5">Back</Button>
            <Button onClick={() => setStage("quiz")} className="h-auto flex-1 rounded-full py-3.5">Check my understanding</Button>
          </div>
        </>
      )}

      {stage === "quiz" && (
        <Quiz
          lessonId={lesson.id}
          fallback={{ id: "f", question: lesson.quiz_question, options: lesson.quiz_options, answer: lesson.quiz_answer }}
          saving={complete.isPending}
          onFinish={async (passed) => {
            await complete.mutateAsync({ lessonId: lesson.id, correct: passed });
            setStage("done");
          }}
        />
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
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/today" })}
              className="h-auto flex-1 rounded-full bg-primary-foreground/15 py-3 text-[13px] font-semibold text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              Back to today
            </Button>
            <Button
              onClick={() => navigate({ to: "/path" })}
              className="h-auto flex-1 rounded-full bg-background py-3 text-[13px] font-semibold text-foreground hover:bg-background/90"
            >
              Next lesson
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
