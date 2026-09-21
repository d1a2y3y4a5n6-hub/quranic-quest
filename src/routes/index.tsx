import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noor — read the Quran daily, keep distractions locked" },
      {
        name: "description",
        content:
          "Set a daily Quran and adhkar target. Work through the Quran in order as short tafsir lessons with quizzes. Your chosen apps stay locked until the target is done.",
      },
      { property: "og:title", content: "Noor — read the Quran daily, keep distractions locked" },
      {
        property: "og:description",
        content:
          "Short tafsir lessons in order, a tasbih counter, and a lock that only opens when today's target is complete.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="geo-pattern h-2 w-full opacity-30" />
      <div className="mx-auto w-full max-w-[460px] px-6 pb-16 pt-10">
        <span className="arabesque-pattern grid size-14 place-items-center rounded-2xl bg-primary font-arabic text-2xl text-primary-foreground">
          نور
        </span>

        <h1 className="mt-6 font-display text-[34px] font-semibold leading-[1.15]">
          Read the Quran daily.
          <span className="block text-primary">Everything else waits.</span>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Set your own target of Quran and adhkar for the day. Your chosen apps stay locked until it
          is done.
        </p>

        <Link
          to="/auth"
          className="mt-6 block rounded-full bg-foreground py-3.5 text-center text-[14px] font-semibold text-background"
        >
          Begin
        </Link>

        <div className="geo-divider mt-10" />

        <ul className="mt-6 space-y-3">
          <Feature
            glyph="۞"
            title="The Quran in order, as lessons"
            body="Every lesson is a passage with its translation and tafsir, then a short quiz. Finish the last lesson and you have finished the Quran."
          />
          <Feature
            glyph="📿"
            title="Adhkar you actually keep"
            body="A tasbih counter for subhanallah, alhamdulillah and more, counted toward today's target."
          />
          <Feature
            glyph="🔒"
            title="A lock with a reason"
            body="Instagram, TikTok, whatever you choose — shown as locked until both parts of the target are met."
          />
          <Feature
            glyph="✦"
            title="A streak worth keeping"
            body="Every day you meet your target adds to the streak. Miss a day and it starts again."
          />
        </ul>

        <div className="geo-divider mt-10" />
        <p className="mt-6 text-center font-arabic text-[22px] text-primary">
          وَقُل رَّبِّ زِدْنِي عِلْمًا
        </p>
        <p className="mt-1 text-center text-[12px] text-muted-foreground">
          &ldquo;My Lord, increase me in knowledge.&rdquo;
        </p>
      </div>
    </div>
  );
}

function Feature({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <li className="card-noor flex gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[15px] text-primary">
        {glyph}
      </span>
      <div>
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
