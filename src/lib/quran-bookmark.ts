import { useEffect, useState } from "react";

const BOOKMARK_KEY = "noor:quran-bookmark";

export type QuranBookmark = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
};

function readBookmark(): QuranBookmark | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(BOOKMARK_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Partial<QuranBookmark>;
    if (
      typeof parsed.surahNumber !== "number" ||
      typeof parsed.surahName !== "string" ||
      typeof parsed.ayahNumber !== "number"
    ) {
      return null;
    }
    return parsed as QuranBookmark;
  } catch {
    return null;
  }
}

export function useQuranBookmark() {
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(null);

  useEffect(() => {
    setBookmark(readBookmark());
  }, []);

  function saveBookmark(next: QuranBookmark) {
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    setBookmark(next);
  }

  function clearBookmark() {
    window.localStorage.removeItem(BOOKMARK_KEY);
    setBookmark(null);
  }

  return { bookmark, saveBookmark, clearBookmark };
}