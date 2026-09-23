import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuranBookmark } from "@/lib/quran-bookmark";

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
  const { bookmark, saveBookmark, clearBookmark } = useQuranBookmark();

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
      if (!arabic || !english) throw new Error("Could not load this surah");
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

  useEffect(() => {
    if (!data || !window.location.hash.startsWith("#ayah-")) return;
    const id = window.location.hash.slice(1);
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
  }, [data]);

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
               {data.meaning} · {data.ayahs.length} ayahs · {data.revelation === "Meccan" ? "Makki" : "Madani"}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowTranslation((v) => !v)}
            className="mt-4 w-full rounded-full text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {showTranslation ? "Arabic only" : "Show translation"}
          </Button>

          <ul className="mt-4 space-y-2.5 pb-4">
            {data.ayahs.map((a) => (
              <li id={`ayah-${a.number}`} key={a.number} className="card-noor scroll-mt-24 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-gold-soft text-[11px] font-semibold text-accent">
                    {a.number}
                  </span>
                  <p className="text-arabic flex-1 font-arabic text-[22px] leading-[2]">
                    {a.arabic}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={bookmark?.surahNumber === Number(surahId) && bookmark.ayahNumber === a.number ? `Remove bookmark from ayah ${a.number}` : `Bookmark ayah ${a.number}`}
                    title={bookmark?.surahNumber === Number(surahId) && bookmark.ayahNumber === a.number ? "Remove bookmark" : "Bookmark this ayah"}
                    onClick={() => {
                      const selected = bookmark?.surahNumber === Number(surahId) && bookmark.ayahNumber === a.number;
                      if (selected) clearBookmark();
                      else saveBookmark({ surahNumber: Number(surahId), surahName: data.nameEn, ayahNumber: a.number });
                    }}
                    className="shrink-0 rounded-full text-primary"
                  >
                    {bookmark?.surahNumber === Number(surahId) && bookmark.ayahNumber === a.number ? (
                      <BookmarkCheck className="fill-current" />
                    ) : (
                      <Bookmark />
                    )}
                  </Button>
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
