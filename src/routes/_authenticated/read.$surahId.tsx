import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/read/$surahId")({
  head: () => ({
    meta: [
      { title: "Surah — Noor" },
      { name: "description", content: "Read this surah in Arabic with its English translation." },
      { property: "og:title", content: "Surah — Noor" },
      { property: "og:description", content: "Read this surah in Arabic with its English translation." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SurahPage,
});

type Ayah = { numberInSurah: number; text: string };

function SurahPage() {
  const { surahId } = Route.useParams();
  const [showTranslation, setShowTranslation] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["surah", surahId],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih`,
      );
      if (!res.ok) throw new Error("Could not load this surah");
      const json = await res.json();
      const [arabic, english] = json.data as Array<{
        name: string;
        englishName: string;
        englishNameTranslation: string;
        revelationType: string;
        ayahs: Ayah[];
      }>;
      return {
        nameAr: arabic.name,
        nameEn: arabic.englishName,
        meaning: arabic.englishNameTranslation,
        revelation: arabic.revelationType,
        ayahs: arabic.ayahs.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          english: english.ayahs[i]?.text ?? "",
        })),
      };
    },
  });

  return (
    <div className="px-5">
      <Link to="/read" className="text-[12px] font-semibold text-muted-foreground">
        ← All surahs
      </Link>

      {isLoading && <p className="mt-6 text-[13px] text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="mt-6 text-[13px] text-muted-foreground">
          Could not load this surah. Please try again.
        </p>
      )}

      {data && (
        <>
          <div className="arabesque-pattern mt-3 rounded-2xl bg-primary p-5 text-center text-primary-foreground">
            <p className="font-arabic text-[30px] leading-tight">{data.nameAr}</p>
            <p className="mt-1.5 font-display text-[17px] font-semibold">{data.nameEn}</p>
            <p className="mt-0.5 text-[12px] opacity-80">
              {data.meaning} · {data.ayahs.length} ayahs · {data.revelation}
            </p>
          </div>

          <button
            onClick={() => setShowTranslation((v) => !v)}
            className="mt-4 w-full rounded-full border border-border py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {showTranslation ? "Arabic only" : "Show translation"}
          </button>

          <ul className="mt-4 space-y-2.5 pb-4">
            {data.ayahs.map((a) => (
              <li key={a.number} className="card-noor p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-gold-soft text-[11px] font-semibold text-accent">
                    {a.number}
                  </span>
                  <p className="text-arabic flex-1 font-arabic text-[22px] leading-[2]">
                    {a.arabic}
                  </p>
                </div>
                {showTranslation && (
                  <p className="mt-2.5 border-t border-border pt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    {a.english}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
