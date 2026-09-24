ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intention text;

CREATE TABLE public.onboarding_answers (
  user_id uuid PRIMARY KEY,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  screen_hours numeric NOT NULL DEFAULT 3,
  age integer NOT NULL DEFAULT 25,
  minutes_per_day integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;
GRANT ALL ON public.onboarding_answers TO service_role;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own onboarding" ON public.onboarding_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.lesson_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  question text NOT NULL,
  options jsonb NOT NULL,
  answer integer NOT NULL
);
GRANT SELECT ON public.lesson_quiz_questions TO anon, authenticated;
GRANT ALL ON public.lesson_quiz_questions TO service_role;
ALTER TABLE public.lesson_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz readable" ON public.lesson_quiz_questions FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX lesson_quiz_questions_lesson_idx ON public.lesson_quiz_questions(lesson_id, sort_order);