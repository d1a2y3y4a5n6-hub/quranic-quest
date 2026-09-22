import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useDailyStatus } from "@/lib/noor";

function NavItem({
  to,
  label,
  glyph,
}: {
  to: "/today" | "/path" | "/read" | "/adhkar" | "/settings";
  label: string;
  glyph: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 py-1 text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      <span className="text-lg leading-none">{glyph}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const status = useDailyStatus();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const initials = (profile.data?.displayName ?? "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col bg-background">
      <div className="geo-pattern h-1.5 w-full opacity-30" />
      <header className="flex items-center justify-between px-5 pb-3 pt-4">
        <Link to="/today" className="flex items-center gap-2.5">
          <span className="arabesque-pattern grid size-10 place-items-center rounded-xl bg-primary font-arabic text-lg text-primary-foreground">
            نور
          </span>
          <span className="leading-none">
            <span className="block font-display text-[15px] font-semibold">Noor</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">Daily intention</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1.5">
            <span className="text-sm leading-none text-accent">✦</span>
            <span className="text-[13px] font-semibold">{status.streak}</span>
          </span>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-full bg-foreground text-[12px] font-semibold text-background"
          >
            {initials || "—"}
          </button>
        </div>
      </header>

      <main className="flex-1 pb-4">{children}</main>

      <nav className="sticky bottom-0 bg-background/95 px-5 pb-5 pt-3 backdrop-blur">
        <div className="card-noor grid grid-cols-5 py-2">
          <NavItem to="/today" label="Today" glyph="◉" />
          <NavItem to="/path" label="Lessons" glyph="۞" />
          <NavItem to="/read" label="Read" glyph="📖" />
          <NavItem to="/adhkar" label="Adhkar" glyph="۩" />
          <NavItem to="/settings" label="Target" glyph="◈" />
        </div>
      </nav>
    </div>
  );
}
