import { createFileRoute } from "@tanstack/react-router";
import { Sprout, TreeDeciduous, BookHeart } from "lucide-react";
import { DAYS_PER_TREE, TREES_PER_QURAN, useGarden } from "@/lib/noor";

export const Route = createFileRoute("/_authenticated/garden")({
  head: () => ({
    meta: [
      { title: "Your garden — Noor" },
      { name: "description", content: "Grow a tree with every day you meet your target. Every 6 consistent months, a Quran is pledged in your name." },
      { property: "og:title", content: "Your garden — Noor" },
      { property: "og:description", content: "Grow trees with your streak and pledge a Quran every 6 consistent months." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Garden,
});

function Garden() {
  const g = useGarden();
  const stage =
    g.progress < 0.15 ? "Seed" :
    g.progress < 0.35 ? "Sprout" :
    g.progress < 0.6 ? "Sapling" :
    g.progress < 0.85 ? "Young tree" : "Full tree";
  const size = 40 + g.progress * 80;

  return (
    <div className="px-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your garden</p>
      <h1 className="mt-0.5 font-display text-[27px] font-semibold leading-tight">Grow with every day</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Each day you finish your target, your tree grows. {DAYS_PER_TREE} days (about 2 months) grows one tree.
      </p>

      <section className="card-noor geo-pattern mt-4 grid place-items-center p-6">
        <div className="grid h-36 place-items-end">
          {g.progress < 0.25 ? (
            <Sprout aria-hidden="true" className="text-primary" style={{ width: size, height: size }} />
          ) : (
            <TreeDeciduous aria-hidden="true" className="text-primary" style={{ width: size, height: size }} />
          )}
        </div>
        <p className="mt-3 font-display text-[18px] font-semibold">{stage}</p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(g.progress * 100)}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">{g.daysToNext} more target days until this tree is fully grown</p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="card-noor p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Trees grown</p>
          <p className="mt-1 font-display text-[28px] font-semibold">{g.trees}</p>
          <p className="text-[12px] text-muted-foreground">{g.metDays} target days</p>
        </div>
        <div className="card-noor p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Qurans pledged</p>
          <p className="mt-1 font-display text-[28px] font-semibold text-accent">{g.qurans}</p>
          <p className="text-[12px] text-muted-foreground">{g.treesToNextQuran} trees to the next</p>
        </div>
      </section>

      <section className="card-noor mt-4 p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your orchard</p>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {Array.from({ length: Math.max(TREES_PER_QURAN, Math.ceil((g.trees + 1) / TREES_PER_QURAN) * TREES_PER_QURAN) }).map((_, i) => (
            <TreeDeciduous key={i} aria-hidden="true" className={`size-6 ${i < g.trees ? "text-primary" : "text-muted"}`} />
          ))}
        </div>
      </section>

      <section className="mt-4 flex gap-3 rounded-xl bg-gold-soft p-4">
        <BookHeart aria-hidden="true" className="size-5 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed">
          Every {TREES_PER_QURAN} trees — 6 consistent months — one Quran is pledged to be donated in your name. Pledges are recorded here — the donation partner is coming soon.
        </p>
      </section>
    </div>
  );
}
