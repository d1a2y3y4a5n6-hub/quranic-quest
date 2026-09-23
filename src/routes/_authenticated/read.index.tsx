import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useQuranBookmark } from "@/lib/quran-bookmark";

export const Route = createFileRoute("/_authenticated/read/")({
  head: () => ({
    meta: [
      { title: "Read Quran — Noor" },
      { name: "description", content: "Read the Quran in Arabic with English translation, surah by surah." },
      { property: "og:title", content: "Read Quran — Noor" },
      { property: "og:description", content: "Read the Quran in Arabic with English translation, surah by surah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReadIndex,
});

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export function useSurahList() {
  return useQuery({
    queryKey: ["surah-list"],
    staleTime: Infinity,
    queryFn: async (): Promise<Surah[]> => {
      const res = await fetch("https://api.alquran.cloud/v1/surah");
      if (!res.ok) throw new Error("Could not load the surah list");
      const json = await res.json();
      return json.data as Surah[];
    },
  });
}

function ReadIndex() {
  const { data, isLoading, isError } = useSurahList();
  const { bookmark } = useQuranBookmark();

  return (
    <div className="px-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Free reading
      </p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">Read Quran</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        All 114 surahs in Arabic with English translation. Read at your own pace.
      </p>

      <div className="geo-divider mt-5" />

      {bookmark && (
        <Link
          to="/read/$surahId"
          params={{ surahId: String(bookmark.surahNumber) }}
          hash={`ayah-${bookmark.ayahNumber}`}
          className="mt-4 flex items-center gap-3 rounded-xl bg-brand-soft p-3.5 text-primary"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Bookmark aria-hidden="true" className="size-4 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Continue reading</span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold">
              {bookmark.surahName} · ayah {bookmark.ayahNumber}
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {isLoading && (
        <p className="mt-6 text-[13px] text-muted-foreground">Loading surahs…</p>
      )}
      {isError && (
        <p className="mt-6 text-[13px] text-muted-foreground">
          Could not load the Quran right now. Check your connection and try again.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {data?.map((s) => (
          <li key={s.number}>
            <Link
              to="/read/$surahId"
              params={{ surahId: String(s.number) }}
              className="card-noor flex items-center gap-3 p-3.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-[12px] font-semibold text-muted-foreground">
                {s.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{s.englishName}</span>
                <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                  {s.englishNameTranslation} · {s.numberOfAyahs} ayahs · {s.revelationType === "Meccan" ? "Makki" : "Madani"}
                </span>
              </span>
              <span className="shrink-0 font-arabic text-[17px] leading-none opacity-80">
                {s.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
