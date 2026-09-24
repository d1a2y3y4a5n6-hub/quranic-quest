# Quizzes, onboarding, growth tree

## 1. Lessons
- Each lesson gets a quiz with 3–5 questions instead of one. You answer them one after another, see a score, and the lesson counts as done when you pass (at least 60%).
- The translation slide shows the Arabic ayat above the English, so you can read both together.

## 2. Onboarding after sign up (up to 10 questions, one per screen)
1. Daily screen time on social media (slider, hours)
2. Which apps take the most time (you pick them, and they become your blocked apps)
3. When you use them most (morning, after work, late night)
4. Why you want to change (multiple choice plus your own words)
5. How you feel after scrolling
6. Your age (used for the life-years maths)
7. How much Quran you read right now
8. Minutes per day you will give Noor (5 / 10 / 15 / 20 / 30)
9. Adhkar goal (sets your daily dhikr target)
10. Your intention in one line (shown on Today)

Results screen with charts:
- Hours lost each year and **years of life** spent scrolling (screen hours x days left until age 80)
- Years of life that will go to deen with your chosen minutes
- Scrolling vs deen shown side by side as a bar and a ring
- The minutes you choose set your daily lesson target (about 6 minutes per lesson, so 5–10 min = 1 lesson, 15 = 2, 20 = 3, 30 = 5)

Your answers can be seen again later from Settings, and you can retake the questions.

## 3. Streak tree
- Each day you hit your target, your tree grows. A tree takes 60 target days (about 2 months) to go from seed to sapling to full tree. A missed day pauses growth and doesn't reset it.
- A "Garden" page shows the trees you've grown so far. Every 10 trees earns **1 Quran donated in your name**, shown as a pledge counter.
- Note: real donations need a charity partner and payments. For now it records and shows your pledges. The real donation link comes later.

## 4. Ideas for later (not built now)
- Daily reminders at a time you choose
- Weekly review of minutes, ayat read, and streak
- Memorisation (hifz) mode with repeat-after-me audio
- Recitation audio in the Read tab
- Then: live community dhikr counter, country vs country table, private friend groups with shared goals

## Technical details
- New tables: `onboarding_answers` (one row per user, answers jsonb, minutes_per_day, age, screen_hours) and `lesson_quiz_questions` (lesson_id, order, question, options jsonb, answer). Both get RLS and grants. Existing single quiz becomes question 1. The 2–4 extra questions per lesson are added for the 12 lessons.
- Add `onboarded_at` to profiles. The `_authenticated` pages send you to `/onboarding` until it's set.
- The tree is worked out from past days where both targets were met (lesson_completions + dhikr_counts), with no new tables. Trees = floor(met days / 60), and Qurans pledged = floor(trees / 10).
- Charts are built with the existing recharts/SVG and match the Sacred Minimal colours.
