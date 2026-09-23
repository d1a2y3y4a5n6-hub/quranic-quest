import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type Lesson = {
  id: string;
  order_index: number;
  surah_number: number;
  surah_name_en: string;
  surah_name_ar: string;
  ayah_start: number;
  ayah_end: number;
  title: string;
  arabic: string;
  translation: string;
  tafsir: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_answer: number;
};

export type Completion = {
  lesson_id: string;
  completed_on: string;
  correct: boolean;
};

export type Settings = {
  user_id: string;
  lessons_target: number;
  dhikr_target: number;
  blocked_apps: string[];
};

export type Dhikr = {
  id: string;
  slug: string;
  arabic: string;
  transliteration: string;
  translation: string;
  default_count: number;
  sort_order: number;
};

export type DhikrCount = {
  id: string;
  adhkar_id: string;
  day: string;
  count: number;
  target: number;
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", user.id)
        .maybeSingle();
      return {
        id: user.id,
        email: user.email ?? "",
        displayName: data?.display_name ?? (user.email ?? "friend").split("@")[0],
      };
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return null;
      const { data } = await supabase
        .from("user_settings")
        .select("user_id, lessons_target, dhikr_target, blocked_apps")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) return data as Settings;
      const { data: created } = await supabase
        .from("user_settings")
        .insert({ user_id: uid })
        .select("user_id, lessons_target, dhikr_target, blocked_apps")
        .single();
      return created as Settings;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Settings, "user_id">>) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_settings")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Lesson[];
    },
  });
}

export function useCompletions() {
  return useQuery({
    queryKey: ["completions"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("lesson_completions")
        .select("lesson_id, completed_on, correct")
        .eq("user_id", uid);
      if (error) throw error;
      return (data ?? []) as Completion[];
    },
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, correct }: { lessonId: string; correct: boolean }) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("lesson_completions").upsert(
        { user_id: uid, lesson_id: lessonId, correct, completed_on: todayKey() },
        { onConflict: "user_id,lesson_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}

export function useAdhkar() {
  return useQuery({
    queryKey: ["adhkar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adhkar")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Dhikr[];
    },
  });
}

export function useDhikrToday() {
  const day = todayKey();
  return useQuery({
    queryKey: ["dhikr", day],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("dhikr_counts")
        .select("id, adhkar_id, day, count, target")
        .eq("user_id", uid)
        .eq("day", day);
      if (error) throw error;
      return (data ?? []) as DhikrCount[];
    },
  });
}

export function useIncrementDhikr() {
  const qc = useQueryClient();
  const day = todayKey();
  return useMutation({
    mutationFn: async ({
      adhkarId,
      current,
      target,
      by = 1,
    }: {
      adhkarId: string;
      current: number;
      target: number;
      by?: number;
    }) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const next = Math.max(0, current + by);
      const { error } = await supabase.from("dhikr_counts").upsert(
        { user_id: uid, adhkar_id: adhkarId, day, count: next, target },
        { onConflict: "user_id,adhkar_id,day" },
      );
      if (error) throw error;
    },
    onMutate: async ({ adhkarId, current, target, by = 1 }) => {
      await qc.cancelQueries({ queryKey: ["dhikr", day] });
      const previous = qc.getQueryData<DhikrCount[]>(["dhikr", day]) ?? [];
      const nextCount = Math.max(0, current + by);
      const found = previous.find((row) => row.adhkar_id === adhkarId);
      const optimistic: DhikrCount = found
        ? { ...found, count: nextCount }
        : { id: `pending-${adhkarId}`, adhkar_id: adhkarId, day, count: nextCount, target };
      qc.setQueryData<DhikrCount[]>(["dhikr", day], [
        ...previous.filter((row) => row.adhkar_id !== adhkarId),
        optimistic,
      ]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) qc.setQueryData(["dhikr", day], context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["dhikr", day] });
    },
  });
}

/** Consecutive days (ending today or yesterday) with at least one completed lesson. */
export function streakFrom(completions: Completion[]) {
  const days = new Set(completions.map((c) => c.completed_on));
  if (days.size === 0) return 0;
  const cursor = new Date();
  if (!days.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(todayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useDailyStatus() {
  const lessons = useLessons();
  const completions = useCompletions();
  const settings = useSettings();
  const dhikr = useDhikrToday();

  const day = todayKey();
  const completed = completions.data ?? [];
  const doneIds = new Set(completed.map((c) => c.lesson_id));
  const lessonsToday = completed.filter((c) => c.completed_on === day).length;
  const dhikrToday = (dhikr.data ?? []).reduce((sum, row) => sum + row.count, 0);

  const lessonsTarget = settings.data?.lessons_target ?? 1;
  const dhikrTarget = settings.data?.dhikr_target ?? 100;

  const all = lessons.data ?? [];
  const nextLesson = all.find((l) => !doneIds.has(l.id)) ?? null;

  const lessonsMet = lessonsToday >= lessonsTarget;
  const dhikrMet = dhikrToday >= dhikrTarget;

  return {
    loading: lessons.isLoading || completions.isLoading || settings.isLoading || dhikr.isLoading,
    lessons: all,
    doneIds,
    nextLesson,
    lessonsToday,
    lessonsTarget,
    dhikrToday,
    dhikrTarget,
    lessonsMet,
    dhikrMet,
    unlocked: lessonsMet && dhikrMet,
    streak: streakFrom(completed),
    blockedApps: settings.data?.blocked_apps ?? [],
    totalDone: completed.length,
  };
}
